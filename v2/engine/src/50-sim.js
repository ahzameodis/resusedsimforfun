/* RESUS Sim v2 engine — the simulation loop.
 *
 *   200 Hz  lungs (equation of motion), heart events, Windkessel, ECG/CVP/PAP/pleth samples
 *    20 Hz  circulatory operating point (venous return × Starling) and baroreflex
 *    10 Hz  gas exchange
 *
 * Every QRS gets its own stroke volume: the operating-point SV scaled by that beat's
 * filling time (short AF cycles → weak beats), atrial kick (AV dissociation), and the
 * pleural-pressure swing from breathing — so pulse-pressure variation, pulse deficit and
 * pulsus paradoxus come out of the physics.
 *
 * Drugs, fluids and events (45-47) act on an EFFECTIVE copy of the parameters (sim.pe),
 * rebuilt every 50 ms; sim.p stays exactly what the instructor set.
 *
 * Myocardial oxygen debt (this.hypox, 0–1.5) rises when the blood is desaturated (SaO2 < 60 %)
 * or the coronary perfusion pressure is low (aortic − right atrial pressure below ~35 mmHg:
 * profound shock, arrest, poor CPR) and is repaid when both are restored. Up to 1 it slows the
 * heart and weakens it; above 1 the heart fails: an organised rhythm becomes PEA, and an
 * arrest left untreated ends in asystole. Compressions, pacing and shocks: 48-resus.js.
 * Rhythm changes the engine makes itself (arrest, ROSC, shocks) happen only on the screen with
 * `authority` (the instructor's) and are announced in `notices` for it to share.
 *
 * Two-screen sync: exportSync() returns parameters + the SLOW state (baroreflex, gas
 * stores, PRVC level, blood volume, drugs on board, active events). The Control screen publishes it ~1 Hz; each Display runs its own
 * Sim and calls importSync() — waveforms are generated locally, never streamed.
 *
 *   const sim = new ResusEngine.Sim(ResusEngine.scenario('septic').params, { seed: 1 });
 *   sim.step(1 / 60, (s) => ring.push(s.art));   // per animation frame
 *   sim.vitals;                                   // measured monitor numbers
 */
(function (R) {
  'use strict';
  const U = R.util;

  const SUPRA = ['sinus', 'sinustach', 'sinusbrad', 'istemi', 'af', 'svt', 'avb1', 'avb2i', 'avb2ii'];
  const VAGAL = ['sinus', 'sinustach', 'sinusbrad', 'istemi', 'af', 'avb1', 'avb2i'];

  class Sim {
    constructor(params, opts) {
      this.opts = opts || {};
      this.authority = this.opts.authority !== false;   // may this screen change the rhythm on its own?
      this.rand = U.rng(this.opts.seed != null ? this.opts.seed : 12345);
      this.dt = 0.005;
      this.t = 0;
      this._acc = 0; this._slowClock = 0; this._gasClock = 0;
      this.heart = new R.Heart(this);
      this.vasc = new R.Vasculature(this);
      this.lungs = new R.Lungs(this);
      this.gas = new R.Gas(this);
      this.sample = { t: 0, ecg: 0, art: 0, pleth: 0, cvp: 0, pap: 0, paw: 0, flow: 0, vol: 0, co2: 0, resp: 0, palv: 0, ppl: 0 };
      this.load(params);
    }

    // Replace the whole patient (scenario load): defaults + params, then settle.
    load(params) {
      this.p = U.deepMerge(U.clone(R.DEFAULTS), params || {});
      this.baro = { hr: 1, svr: 1, vu: 1, ct: 1 };
      this.chemo = 0; this.drive = 1; this.hypox = 0;
      this.va = 4; this.vaInst = 4;
      this.beats = []; this.qrsT = []; this.pulseT = [];
      this.lastWindowT = this.t; this.lastBeatMech = false; this.lastSV = 0;
      this.coMeas = 0; this.cvpMean = 6; this.ppv = 0; this.svv = 0;
      this.pplHist = new U.Ring(80, -5);
      this.k = R.circulation.derive(this.p);
      this.volume = new R.Volume(this); this.pharm = new R.Pharm(this); this.events = new R.Events(this);
      this.resus = new R.Resus(this); this.heart.pace = null; this.heart.shockT = null;
      this.notices = []; this._adeno = 0; this.pcMean = 90; this.cpp = 85;
      this._derive();
      this._slow(0.05);
      this.vasc.init(this.eq); this.pcMean = this.eq.map;
      if (this.opts.warmup !== false) this.warmup(this.opts.warmupSeconds != null ? this.opts.warmupSeconds : 40);
      return this;
    }

    // Change part of the patient while running (instructor overrides, events).
    set(patch) {
      const before = this.p.heart.rhythm;
      U.deepMerge(this.p, patch);
      if (this.p.heart.rhythm !== before) this._externalRhythm();
      this._derive();
      return this;
    }
    // The instructor chose a rhythm: any engine-made arrest is forgotten, and choosing a perfusing
    // rhythm means "the circulation is back" — repay most of the oxygen debt so it holds.
    _externalRhythm() {
      this.resus.cause = null; this.resus.terminal = 0;
      const rh = R.RHYTHMS[this.p.heart.rhythm];
      if (rh && rh.mech) this.hypox = Math.min(this.hypox, 0.5);
    }
    // The engine changes the rhythm itself (arrest, ROSC, shock outcome) and tells the app.
    _changeRhythm(rhythm, text, cause) {
      this.p.heart.rhythm = rhythm;
      this.resus.cause = cause || null; this.resus.terminal = 0;
      this.notices.push({ type: 'rhythm', rhythm, hr: this.p.heart.hr, text });
      this._effective();
    }

    _derive() {
      const p = this.p;
      this.k = R.circulation.derive(p);
      this.volume.syncBaseline();
      this.k.bv = this.volume.bv;
      this.pbw = U.pbw(p.patient.sex, p.patient.heightCm);
      this._effective();
    }

    // Effective parameters = instructor baseline × drugs × events, with live blood volume / Hb.
    _effective() {
      const p = this.p, D = this.pharm.effects();
      const M = { svr: D.svr, vu: D.vu, ctL: D.ct, ctR: D.ct, hr: D.hr, hrAdd: D.hrAdd, pvr: D.pvr, effort: D.effort, baro: D.baro,
                  relief: D.relief, avBlock: D.avBlock, compliance: 1, shunt: 0, vq: 0, ds: 0, ppl: 0, peri: 0, vobs: 1, spasm: 0, rawAdd: 0, airway: 'normal' };
      this.flows = this.events.apply(M, D);
      const as = (a, b) => Object.assign({}, a, b);
      const pe = {
        patient: p.patient, sim: p.sim, vent: p.vent, resus: p.resus || {},
        airway: as(p.airway, { state: M.airway }),
        heart: as(p.heart, { hr: p.heart.hr * M.hr, hrAdd: M.hrAdd, contractility: p.heart.contractility * M.ctL, rvContractility: p.heart.rvContractility * M.ctR }),
        vessels: as(p.vessels, { svr: p.vessels.svr * M.svr, pvr: p.vessels.pvr * M.pvr }),
        volume: as(p.volume, { venousTone: (p.volume.venousTone || 1) * M.vu }),
        thorax: as(p.thorax, { pplOffset: (p.thorax.pplOffset || 0) + M.ppl, pericardial: (p.thorax.pericardial || 0) + M.peri, venousObstruction: (p.thorax.venousObstruction || 1) * M.vobs }),
        lungs: as(p.lungs, { compliance: p.lungs.compliance * M.compliance, resistance: p.lungs.resistance + M.rawAdd + M.spasm * (1 - M.relief),
          shunt: U.clamp(p.lungs.shunt + M.shunt, 0, 0.9), vqMismatch: U.clamp((p.lungs.vqMismatch || 0) + M.vq, 0, 0.8), deadSpace: U.clamp(p.lungs.deadSpace + M.ds, 0, 0.9) }),
        metabolism: as(p.metabolism, { hb: this.volume.hb() }),
        reflex: as(p.reflex, { baro: (p.reflex.baro || 0) * M.baro }),
        // respiratory chemoreflex (this.drive) enlarges and speeds spontaneous breaths; sedatives scale it down with the effort
        breathing: as(p.breathing, { effort: (p.breathing.effort || 0) * M.effort * this.drive, rate: (p.breathing.rate || 0) * (1 + 0.6 * (this.drive - 1)) }),
      };
      // adenosine: a few seconds of AV-node block on supraventricular rhythms (P waves, no QRS)
      let rhythm = p.heart.rhythm;
      if (SUPRA.includes(rhythm) && M.avBlock > 0.2) rhythm = 'avblock';
      pe.heart.rhythm = rhythm;
      this.mods = M; this.pe = pe;
      this.lungs.derive(pe);
      this.heart.setRhythm(this.t, rhythm);
      this.rh = this.heart.rh;
    }

    // When the adenosine block wears off, a big enough dose has converted SVT to sinus.
    _adenosine() {
      const ab = this.mods.avBlock;
      if (ab > 0.2) { this._adeno = Math.max(this._adeno, ab); return; }
      if (this._adeno > 0 && ab < 0.1) {
        if (this.p.heart.rhythm === 'svt' && this._adeno > 0.5) {    // 12 mg converts; 6 mg only pauses
          this.p.heart.rhythm = 'sinus';
          this.p.heart.hr = Math.min(this.p.heart.hr, 90);
          this.notices.push({ type: 'rhythm', rhythm: 'sinus', hr: this.p.heart.hr, reason: 'adenosine' });
          this._effective();
        }
        this._adeno = 0;
      }
    }

    // ---------- treatments and events (public API) ----------
    giveFluid(type, mL, minutes) { return this.volume.give(type, mL, minutes); }
    shock(joules, sync) { return this.resus.shock(joules, sync); }
    bolus(id, dose, absorb) { const ok = this.pharm.bolus(id, dose, absorb); return ok; }
    infuse(id, rate) { return this.pharm.setRate(id, rate); }
    startEvent(id, sev) { const uid = this.events.start(id, sev); this._effective(); return uid; }
    endEvent(key) { return this.events.resolve(key); }
    eventAction(actionId) { return this.events.action(actionId); }
    takeNotices() { const n = this.notices; this.notices = []; return n; }
    treatments() {
      const v = this.volume;
      return { drugs: this.pharm.summary(), events: this.events.summary(),
               bags: v.bags.map((b) => ({ type: b.type, label: R.FLUIDS[b.type].label, left: b.left, total: b.total, rate: b.rate })),
               bvPct: 100 * v.bv / this.k.bvNormal, hb: v.hb(), given: v.given, lost: v.lost, airway: this.lungs.airway };
    }

    // Run with the gas stores held, then put them at steady state for what the patient is doing.
    warmup(seconds) {
      this._gasHold = true;
      this.step(seconds);
      this._gasHold = false;
      this.notices = [];
      // an arrested or apnoeic patient has no steady state: prime as if it has only just happened
      const inp = this._gasInputs();
      inp.co = Math.max(inp.co, 4);
      inp.va = Math.max(inp.va, 0.863 * inp.vco2 / 40);
      this.gas.prime(inp);
      this.cvpMean = this.eq.rap;
      // the scenario starts now: no oxygen debt or arrest time carried over from the warm-up
      this.hypox = 0; this.resus.stats = R.Resus.newStats(); this.resus.terminal = 0;
    }

    step(seconds, onSample) {
      this._acc += seconds;
      while (this._acc >= this.dt - 1e-9) {
        this._acc -= this.dt;
        this._substep();
        if (onSample) onSample(this.sample);
      }
      return this;
    }
    run(seconds) { return this.step(seconds); }

    // How the oxygen debt depresses the heart: up to 1, rate and contractility fall by up to 60 %;
    // beyond 1 (failing heart) they fall further, toward the agonal rhythm of a hypoxic arrest.
    _hx() {
      const h1 = Math.min(this.hypox, 1), h2 = Math.max(0, this.hypox - 1) / 0.5;
      return { h1, rate: (1 - 0.6 * h1) * (1 - 0.5 * h2), ct: (1 - 0.6 * h1) * (1 - 0.6 * h2) };
    }

    _rates(rh) {
      const p = this.pe, hx = this._hx();
      // sympathetic chemoreflex adds to the baroreflex (tachycardia of hypoxaemia / hypercapnia) until
      // the myocardium itself is exhausted by hypoxia, when the rate falls (pre-arrest bradycardia)
      const reflex = 1 + (this.baro.hr - 1 + 0.55 * this.chemo * (1 - hx.h1)) * (rh.baro || 0);
      // vagolytic drugs (atropine) speed the sinus node and AV node, not infranodal rhythms
      const vag = VAGAL.includes(this.heart.rhythm) ? (p.heart.hrAdd || 0) : 0;
      const vRate = U.clamp(((p.heart.hr || 0) * reflex + vag) * hx.rate, 0, 250);
      let aRate = vRate;
      if (rh.conduct === 'wenckebach') aRate = vRate * rh.n / (rh.n - 1);
      else if (rh.conduct === 'mobitz2') aRate = vRate * rh.n;
      else if (rh.atrial === 'indep') aRate = (p.heart.atrialRate || 80) * this.baro.hr + (p.heart.hrAdd || 0);   // sinus node still reflex-driven
      return { vRate, aRate };
    }

    _slow(dt) {
      this.pharm.step(dt); this.events.step(dt);
      this._effective();
      this.volume.step(dt, this.flows.bleed, this.flows.leak);
      this.k.bv = this.volume.bv;
      this._adenosine();
      // a capturing pacemaker replaces the ventricular rhythm the circulation sees
      const rI = this._rates(this.heart.rh), pz = this.resus.pace(rI.vRate);
      this.heart.pace = pz;
      this.rh = pz && pz.capture ? (pz.mech ? R.RHYTHMS.paced : R.RHYTHMS.pacedNoMech) : this.heart.rh;
      this.rates = pz && pz.capture ? { vRate: pz.rate, aRate: rI.aRate } : rI;
      const p = this.pe, rh = this.rh, hx = this._hx();
      const mech = !!rh.mech && this.rates.vRate > 5;
      this.fillMean = mech ? R.cardiac.meanFill(rh, this.rates.vRate) : 0;
      this.eq = R.circulation.equilibrium(this.k, p, {
        hr: this.rates.vRate, fill: this.fillMean, kick: rh.kick, mech,
        pplMean: U.mmHg(this.lungs.pplMean),
        // high alveolar pressure compresses alveolar capillaries (West zone 1–2): PVR rises,
        // loading the RV — dynamic hyperinflation and very high PEEP
        pvrFactor: 1 + 0.03 * Math.max(0, this.lungs.palvMean - 12),
        baro: { svr: this.baro.svr * (1 + 0.15 * this.chemo), vu: this.baro.vu, ct: this.baro.ct * (1 + 0.1 * this.chemo) * hx.ct },
      });
      // baroreflex: MAP error → heart rate, arteriolar tone, venous tone (unstressed volume), contractility.
      // In arrest (no mechanical rhythm) sympathetic tone is lost, so venous tone relaxes and
      // the circulation settles at the normal mean systemic filling pressure.
      // the chemoreflex resets the baroreflex upward, so the two reflexes don't cancel each other
      const g = p.reflex.baro || 0, sp = (this.p.reflex.mapSetpoint || 90) + 15 * this.chemo;
      const alive = rh.mech ? 1 : U.clamp((this.eq.map - 20) / 20, 0, 1);
      const e = U.clamp((sp - this.eq.map) / sp, -0.4, 0.6) * g * alive;
      const tgt = { hr: U.clamp(1 + 2.2 * e, 0.6, 2.1), svr: U.clamp(1 + 1.5 * e, 0.7, 1.9), vu: U.clamp(1 - 1.0 * e, 0.70, 1.15), ct: U.clamp(1 + 0.35 * e, 0.8, 1.35) };
      const tau = { hr: 6, svr: 12, vu: 20, ct: 10 };
      for (const key in tgt) this.baro[key] += (tgt[key] - this.baro[key]) * Math.min(1, dt / tau[key]);
      // chemoreflex: falling saturation (from ~94 %) and rising CO2 add sympathetic drive —
      // tachycardia, vasoconstriction, contractility. SpO2 82 % → ~+30 % HR; 70 % → ~+55 %.
      const ga = this.gas, sao2 = ga.sao2 * 100;
      const hypoxic = U.clamp((94 - sao2) / 24, 0, 1.25), hypercap = U.clamp((ga.paco2 - 45) / 30, 0, 1);
      const drive = rh.mech ? Math.min(1.6, hypoxic + 0.6 * hypercap) : 0;
      this.chemo += (drive - this.chemo) * Math.min(1, dt / 8);
      // myocardial oxygen debt: desaturated blood (SaO2 < 60 %: SaO2 40 % → debt 1 in ~60 s) or a low
      // coronary perfusion pressure < 40 mmHg (no flow → debt 1 in ~4 min; good CPR slows it to about half;
      // good CPR with adrenaline repays it).
      // Repaid over ~2 min once both are restored. The last stage (1 → 1.5, failing heart) runs slower.
      const cpp = this.pcMean - this.eq.rap;
      const o = U.clamp((60 - sao2) / 60, 0, 1), q = U.clamp((40 - cpp) / 30, 0, 1);
      // repayment needs oxygen delivery: CPR moves only ~a quarter of a normal output, so it repays slowly
      const delivery = U.clamp(this.coMeas / 3, 0.2, 1);
      let debt = 0.05 * o + 0.004 * q - (o > 0 ? 0 : (1 / 120) * (1 - q) * (1 - q) * delivery);
      if (debt > 0 && this.hypox >= 1) debt *= 0.2;
      this.hypox = U.clamp(this.hypox + debt * dt, 0, 1.5);
      this.cpp = cpp;
      const cpr = !!(this.pe.resus && this.pe.resus.cpr);
      this.resus.track(dt, !rh.mech, cpr);
      if (this.authority && !this._gasHold && this.pe.resus.autoRhythm !== false) this._autoRhythm(dt, cpr, o >= q ? 'hypoxaemia' : 'shock');
      // respiratory drive: rising CO2 and falling saturation → bigger, faster spontaneous breaths
      const want = U.clamp(1 + 0.05 * Math.max(0, ga.paco2 - 40) + 0.02 * Math.max(0, 92 - ga.sao2 * 100), 1, 2.2);
      this.drive += (want - this.drive) * Math.min(1, dt / 15);
    }

    // Rhythm changes the physiology makes by itself (only on the screen with authority).
    _autoRhythm(dt, cpr, why) {
      const rhythm = this.p.heart.rhythm, rhI = this.heart.rh, R2 = this.resus;
      if (rhI.mech) {
        // the failing, oxygen-starved heart stops ejecting: PEA (agonal complexes, no pulse)
        if (this.hypox >= 1.45) this._changeRhythm('pea', 'PEA arrest — profound ' + why, why);
        return;
      }
      // return of spontaneous circulation: an arrest the engine made (or post-shock PEA), once the
      // debt is repaid (good CPR, adrenaline) and the blood is oxygenated again
      if (rhythm === 'pea' && R2.cause && this.hypox < 0.5 && this.gas.sao2 > 0.88) { this._changeRhythm('sinus', 'ROSC — sinus rhythm', null); return; }
      // an arrest left at maximal debt burns out to asystole (CPR only slows it)
      if (rhythm === 'asystole') { R2.terminal = 0; return; }
      R2.terminal = this.hypox >= 1.49 ? R2.terminal + dt * (cpr ? 0.5 : 1) : Math.max(0, R2.terminal - dt);
      if (R2.terminal > 120) this._changeRhythm('asystole', 'Asystole — untreated arrest', R2.cause || 'arrest');
    }

    _gasInputs() {
      const p = this.pe, l = this.lungs, eq = this.eq, w = p.patient.weightKg;
      const vent = p.vent.mode !== 'off' && !l.open;    // a disconnected / extubated patient breathes room air
      const peepTot = l.last ? l.last.peepTot : (vent ? p.vent.peep : 0);
      const recruit = U.clamp(p.lungs.recruitability || 0, 0, 1);
      let shunt = p.lungs.shunt * (1 - recruit * (1 - Math.exp(-Math.max(0, peepTot) / 8)));
      if (eq.lap > 20) shunt += 0.012 * (eq.lap - 20);              // hydrostatic pulmonary oedema
      let ds = p.lungs.deadSpace;
      const pplat = l.last ? l.last.pplat : 0;
      if (vent && pplat > 28) ds += 0.012 * (pplat - 28);           // over-distension
      const vo2 = 3.5 * w * p.metabolism.vo2Factor;
      const frc = (p.lungs.frc != null ? p.lungs.frc : 30 * this.pbw) / 1000;
      return {
        fio2: (vent ? p.vent.fio2 : p.airway.fio2) / 100,
        va: this.va, co: Math.max(this.coMeas, 0), shunt: U.clamp(shunt, 0, 0.8), vq: p.lungs.vqMismatch || 0,
        ds: U.clamp(ds, 0, 0.9), vo2, vco2: vo2 * p.metabolism.rq, hb: p.metabolism.hb,
        vl: frc + (l.airway === 'esophageal' ? 0 : Math.max(0, l.V)), k: 20 * w / 70, coFull: 3.5 * Math.pow(w / 70, 0.75), speed: p.sim.gasSpeed,
      };
    }

    // Called by the lungs at the end of every breath.
    onBreath(m) {
      this.vaInst = this.lungs.airway === 'esophageal' ? 0 : Math.max(0, m.vte / 1000 - this.lungs.vdanat) * 60 / m.ttot;
      this.va += (this.vaInst - this.va) * Math.min(1, m.ttot / 10);
    }

    _onQRS(ev) {
      const w = this.vasc.closeBeatWindow();
      if (w) this._recordBeat(w);
      this.lastWindowT = ev.t;
      this.qrsT.push(ev.t); if (this.qrsT.length > 10) this.qrsT.shift();
      this.lastBeatMech = ev.mech;
      if (!ev.mech || this.eq.sv <= 0) { this.lastSV = 0; return; }
      const fillRatio = this.fillMean > 0 ? R.cardiac.fillOf(ev.rr) / this.fillMean : 1;
      const kickRatio = this.rh.kick > 0 ? ev.kick / this.rh.kick : 1;
      // breathing: lagged pleural rise ↓ RV preload → ↓ LV output a few beats later (scaled by
      // how preload-dependent the heart is); early inspiratory squeeze; inspiratory fall with
      // spontaneous breaths, exaggerated by tamponade (pulsus paradoxus)
      const pm = this.lungs.pplMean;
      const lag = U.clamp(2.5 * 60 / Math.max(this.rates.vRate, 30), 0.8, 2.0);
      const dNow = U.mmHg(this.lungs.ppl - pm), dLag = U.mmHg(this.pplHist.ago(lag / 0.05) - pm);
      const sensEff = U.clamp(this.eq.sens * 0.22, 0, 0.08);
      const paradox = 0.006 + 0.005 * (this.pe.thorax.pericardial || 0);   // ventricular interdependence
      const resp = U.clamp(1 - sensEff * dLag + 0.008 * dNow - paradox * Math.max(0, -dNow), 0.3, 1.6);
      const sv = Math.max(0, this.eq.sv * fillRatio * kickRatio * resp * (1 + 0.006 * U.clamp(U.normal(this.rand), -2, 2)));
      this.vasc.eject(ev.t, ev.rr, sv);
      this.lastSV = sv;
      const inst = sv * 60 / ev.rr / 1000;
      this.coMeas += (inst - this.coMeas) * Math.min(1, ev.rr / 6);
      if (sv > 15) { this.pulseT.push(ev.t); if (this.pulseT.length > 10) this.pulseT.shift(); }
    }

    _recordBeat(w) {
      const b = { t: this.t, sys: w.sys, dia: w.dia, map: w.map, pp: w.sys - w.dia, psys: w.psys, pdia: w.pdia, pmap: w.pmap, sv: this.lastBeatMech ? this.lastSV : 0, mech: this.lastBeatMech };
      this.beats.push(b); if (this.beats.length > 40) this.beats.shift();
      // PPV / SVV over the last breath (≥ 4 s window)
      const win = Math.max(4, this.lungs.last ? this.lungs.last.ttot : 4);
      let ppMax = -Infinity, ppMin = Infinity, svMax = -Infinity, svMin = Infinity, n = 0;
      for (let i = this.beats.length - 1; i >= 0; i--) {
        const x = this.beats[i];
        if (this.t - x.t > win) break;
        if (!x.mech) continue;
        n++;
        if (x.pp > ppMax) ppMax = x.pp; if (x.pp < ppMin) ppMin = x.pp;
        if (x.sv > svMax) svMax = x.sv; if (x.sv < svMin) svMin = x.sv;
      }
      if (n >= 3 && ppMax > 0) {
        this.ppv += (100 * (ppMax - ppMin) / ((ppMax + ppMin) / 2) - this.ppv) * 0.25;
        this.svv += (100 * (svMax - svMin) / ((svMax + svMin) / 2) - this.svv) * 0.25;
      }
    }

    _substep() {
      const dt = this.dt, t = this.t;
      this._slowClock += dt;
      if (this._slowClock >= 0.05 - 1e-9) { this._slowClock -= 0.05; this._slow(0.05); this.pplHist.push(this.lungs.ppl); }
      this._gasClock += dt;
      if (this._gasClock >= 0.1 - 1e-9) {
        this._gasClock -= 0.1;
        if (t - this.lungs.lastBreathT > Math.max(8, 2 * (this.lungs.last ? this.lungs.last.ttot : 4))) this.va *= Math.exp(-0.1 / 4);   // apnoea
        if (!this._gasHold) this.gas.update(0.1, this._gasInputs());
      }
      this.lungs.step(t, dt);
      const evs = this._evs || (this._evs = []);
      evs.length = 0;
      this.heart.advance(t + dt, this.rates, evs);
      for (let i = 0; i < evs.length; i++) this._onQRS(evs[i]);
      if (t - this.lastWindowT > 3) {   // no QRS for 3 s: keep reporting the (flat) pressure
        this.lastBeatMech = false;
        const w = this.vasc.closeBeatWindow(); if (w) this._recordBeat(w);
        this.lastWindowT = t;
      }
      // no beats: output falls to whatever the chest compressions are moving
      this.resus.step(dt);
      if (!this.lastBeatMech && t - (this.pulseT.length ? this.pulseT[this.pulseT.length - 1] : -1e9) > 3) this.coMeas += (this.resus.co - this.coMeas) * (1 - Math.exp(-dt / 2));
      this.vasc.step(t + dt, dt, this.k, this.eq, U.mmHg(this.lungs.ppl - this.lungs.pplMean), this.resus);
      this.cvpMean += (this.vasc.cvp - this.cvpMean) * (dt / 4);
      this.pcMean += (this.vasc.pc - this.pcMean) * (dt / 2);
      this.t = t + dt;
      const s = this.sample, l = this.lungs;
      s.t = this.t; s.ecg = this.heart.ecg(this.t) + this.resus.art;
      s.art = this.vasc.part; s.pleth = this.vasc.pleth; s.cvp = this.vasc.cvp; s.pap = this.vasc.ppa;
      s.paw = l.paw; s.flow = l.Q * 60; s.vol = l.volDisplay(); s.co2 = l.co2; s.resp = l.V; s.palv = l.palv; s.ppl = l.ppl;
    }

    _rateFrom(times, n) {
      if (times.length < 2) return null;
      const a = times.slice(-(n + 1));
      const mean = (a[a.length - 1] - a[0]) / (a.length - 1);
      if (this.t - a[a.length - 1] > Math.max(2.5 * mean, 3)) return null;
      return 60 / mean;
    }

    // Measured monitor numbers (what the bedside monitor and ventilator would display).
    get vitals() {
      const p = this.pe, l = this.lungs, eq = this.eq, g = this.gas;
      const recent = this.beats.slice(-4);
      const avg = (key) => recent.length ? recent.reduce((s, b) => s + b[key], 0) / recent.length : null;
      const mechRecent = this.beats.filter((b) => b.mech && this.t - b.t < 8).slice(-6);
      const svAvg = mechRecent.length ? mechRecent.reduce((s, b) => s + b.sv, 0) / mechRecent.length : 0;
      const sys = avg('sys'), dia = avg('dia'), map = avg('map');
      const hr = this.rh.continuous ? null : this._rateFrom(this.qrsT, 5);
      const pulse = this._rateFrom(this.pulseT, 5);
      const pi = this.vasc.piGain * (sys != null && dia != null ? sys - dia : 0);
      const perfused = pulse != null && pi > 0.3;
      const apnea = this.t - l.lastBreathT > Math.max(8, 2 * (l.last ? l.last.ttot : 4));
      const vent = p.vent.mode !== 'off' && !l.open;
      const fio2 = (vent ? p.vent.fio2 : p.airway.fio2) / 100;
      const co = this.coMeas, cvp = this.cvpMean;
      const lv = l.last;
      const mv = lv && !apnea ? lv.vte * Math.min(lv.rr, 80) / 1000 : 0;
      return {
        t: this.t, rhythm: p.heart.rhythm, rhythmLabel: this.rh.label,
        hr, pulse,
        abp: { sys, dia, map },
        nibp: perfused && sys - dia > 8 && map > 30 ? { sys, dia, map } : null,
        cvp, pap: { sys: avg('psys'), dia: avg('pdia'), map: avg('pmap') }, pcwp: Math.max(0, eq.lap),
        co, sv: svAvg, svr: co > 0.2 && map != null ? 80 * (map - cvp) / co : null,
        spo2: perfused ? g.spo2 : null, pi,
        etco2: lv && !apnea ? lv.etco2 : 0,
        rr: lv && !apnea ? lv.rr : 0,
        ppv: this.ppv, svv: this.svv,
        pao2: g.pao2, paco2: g.paco2, sao2: g.sao2 * 100, svo2: g.svo2() * 100, fio2, pf: g.pao2 / fio2,
        vent: lv && l.open ? { pip: 0, pplat: null, peepTot: 0, peepi: 0, vti: 0, vte: 0, mv: 0, rr: 0, ti: 0, ie: 0, dp: null, cstat: null, cdyn: null, mpaw: 0, triggered: false, disconnected: true }
          : lv ? { pip: lv.pip, pplat: lv.pplat, peepTot: lv.peepTot, peepi: lv.peepi, vti: lv.vti, vte: lv.vte, mv,
          rr: lv.rr, ti: lv.ti, ie: lv.ie, dp: lv.dp, cstat: lv.cstat, cdyn: lv.cdyn, mpaw: lv.mpaw, triggered: lv.triggered } : null,
        apnea, airway: l.airway,
        bvPct: 100 * this.volume.bv / this.k.bvNormal, hb: this.volume.hb(),
        eq: { co: eq.co, sv: eq.sv, map: eq.map, rap: eq.rap, lap: eq.lap, pap: eq.pap, msfp: eq.msfp, svr: eq.svr, sens: eq.sens },
        baro: { hr: this.baro.hr, svr: this.baro.svr, vu: this.baro.vu, ct: this.baro.ct, chemo: this.chemo, hypox: this.hypox },
        hypox: this.hypox, cpp: this.cpp,
        resus: this._resusVitals(),
      };
    }
    _resusVitals() {
      const r = this.pe.resus || {}, pz = this.resus.paceState, S = this.resus.stats;
      return {
        cpr: !!r.cpr, cprRate: r.cprRate, cprDepth: r.cprDepth, cprCO: this.resus.co, pulseless: !this.rh.mech,
        pacing: pz ? { rate: pz.rate, mA: pz.mA, threshold: pz.thr, fire: pz.fire, capture: pz.capture, mech: pz.mech, inhibited: pz.inhibited } : null,
        cause: this.resus.cause,
        stats: Object.assign({ cprFraction: S.arrestT > 0 ? S.cprT / S.arrestT : null }, S),
      };
    }

    exportSync() {
      const g = this.gas;
      return { v: 1, t: this.t, p: U.clone(this.p),
        s: { baro: Object.assign({}, this.baro), chemo: this.chemo, drive: this.drive, hypox: this.hypox, va: this.va, prvcP: this.lungs.prvcP, adeno: this._adeno,
             vol: this.volume.export(), drugs: this.pharm.export(), events: this.events.export(), resus: this.resus.export(),
             gas: { fa: g.fa, paco2: g.paco2, cv: g.cv, spo2: g.spo2 } } };
    }
    // opts.stateOnly: keep this sim's own parameters and take only the slow state — for a
    // display that already builds its parameters from the shared settings, so a delayed
    // message can never roll back a newer instructor change.
    importSync(m, opts) {
      if (!m || m.v !== 1 || !m.s) return false;
      if (!(opts && opts.stateOnly)) {
        this.p = U.deepMerge(U.clone(R.DEFAULTS), m.p);
        this._derive();
      }
      Object.assign(this.baro, m.s.baro);
      this.chemo = m.s.chemo || 0; this.drive = m.s.drive || 1; this.hypox = m.s.hypox || 0;
      this.va = m.s.va; this.lungs.prvcP = m.s.prvcP; this._adeno = m.s.adeno || 0;
      Object.assign(this.gas, m.s.gas);
      if (m.s.vol) { this.volume.import(m.s.vol); this.k.bv = this.volume.bv; }
      if (m.s.drugs) this.pharm.import(m.s.drugs);
      if (m.s.events) this.events.import(m.s.events);
      if (m.s.resus) this.resus.import(m.s.resus);
      this._effective();
      return true;
    }
  }

  R.Sim = Sim;
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
