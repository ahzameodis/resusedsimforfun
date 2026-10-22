/* RESUS Sim v2 engine — resuscitation: chest compressions, defibrillation / cardioversion,
 * transcutaneous pacing, and the arrest bookkeeping used for the debrief.
 *
 * Chest compressions (p.resus.cpr) drive the circulation when the heart cannot. Each
 * compression squeezes a small stroke volume into the arterial and pulmonary Windkessels and
 * transmits a pressure pulse to every intrathoracic vessel, so the arterial line shows
 * compression "beats", the CVP spikes with them, and the coronary perfusion pressure
 * (aortic relaxation pressure − right atrial pressure) depends on depth, rate and arteriolar
 * tone — which is why adrenaline matters. Good compressions move ~1.2 L/min; that flow carries
 * CO2 to the lungs, so EtCO2 reports CPR quality (good ≳ 20 mmHg, poor ≲ 10).
 *
 * The myocardial oxygen debt that decides what happens next (sim.hypox, 0–1.5) lives in
 * 50-sim.js: it rises with desaturated blood or a low coronary perfusion pressure, depresses
 * rate and contractility, and above 1 the heart fails (PEA, then asystole). Good CPR with
 * adrenaline repays it slowly — so shocks succeed more often and an engine-made PEA can
 * return a circulation once the cause is fixed.
 *
 * Shocks: the outcome is drawn from the seeded PRNG on the screen that has `authority`
 * (the instructor's); other screens only draw the artefact and wait for the new rhythm.
 */
(function (R) {
  'use strict';
  const U = R.util;

  const SV_CPR = 10;        // mL forward per compression at full depth (≈ 1.1–1.3 L/min at 110/min)
  const PTH = 55;           // peak intrathoracic pressure pulse at full depth, mmHg
  const COMP = 0.45;        // compression share of each cycle
  const SHOCKABLE = ['vf', 'pvt', 'torsades'];
  const SYNC_OK = { vt: 0.85, svt: 0.9, af: 0.7 };              // synchronised cardioversion success, ≥ 150 J
  const NO_MECH_PACE = ['vf', 'pvt', 'torsades', 'asystole', 'pea'];   // pacing cannot give these a pulse

  // paced rhythms: what the circulation sees while the pacemaker captures
  R.RHYTHMS.paced = { label: 'Paced rhythm', vclock: 'regular', qrs: 'paced', mech: true, kick: 0.82, baro: 0, hidden: true };
  R.RHYTHMS.pacedNoMech = { label: 'Paced — no mechanical capture', vclock: 'regular', qrs: 'paced', mech: false, kick: 0, baro: 0, hidden: true };

  class Resus {
    constructor(sim) {
      this.sim = sim;
      this.phase = 0; this.q = 0; this.pth = 0; this.co = 0; this.art = 0;
      this.cause = null;        // why the engine made this arrest (null = the instructor chose the rhythm)
      this.terminal = 0;        // seconds of maximal debt in an arrest rhythm (→ asystole)
      this.paceState = null;
      this.stats = Resus.newStats();
    }
    static newStats() {
      return { arrests: 0, roscs: 0, inArrest: false, arrestT: 0, cprT: 0, noFlowT: 0, firstCPR: null, sinceOnset: 0,
               pauseCur: 0, longestPause: 0, pauses: 0, cycleT: 0, cprOn: false, shocks: 0 };
    }

    // Every 5 ms: compression flow, thoracic pressure pulse and the ECG artefact.
    step(dt) {
      const r = this.sim.pe.resus || {};
      if (!r.cpr) { this.q = 0; this.pth = 0; this.art = 0; this.co *= Math.exp(-dt / 2); return; }
      const rate = U.clamp(+r.cprRate || 110, 40, 160), depth = U.clamp(r.cprDepth != null ? +r.cprDepth : 1, 0, 1.2);
      const T = 60 / rate, tc = COMP * T;
      this.phase = (this.phase + dt / T) % 1;
      const comp = this.phase < COMP ? Math.sin(Math.PI * this.phase / COMP) : 0;
      // forward stroke: depth × venous filling (MSFP) × time to refill (above 120/min the chest cannot)
      const fill = U.clamp((this.sim.eq ? this.sim.eq.msfp : 10) / 10, 0.4, 1.3);
      const refill = rate > 120 ? U.clamp(1 - (rate - 120) / 80, 0.5, 1) : 1;
      const sv = SV_CPR * depth * fill * refill;
      this.q = comp * sv * Math.PI / (2 * tc);                     // mL/s; integrates to sv per compression
      this.pth = PTH * depth * comp;
      this.co += (sv * rate / 1000 - this.co) * Math.min(1, dt / 3);
      this.art = 0.75 * depth * (comp - 2 * COMP / Math.PI);      // large slow artefact on the ECG
    }

    // Pacemaker state for this 50 ms, given the intrinsic ventricular rate.
    pace(intrinsicRate) {
      const r = this.sim.pe.resus || {};
      if (!r.pace) return (this.paceState = null);
      const rh = this.sim.heart.rh, rhythm = this.sim.pe.heart.rhythm;
      const rate = U.clamp(+r.paceRate || 70, 30, 180), mA = U.clamp(+r.paceMA || 0, 0, 200);
      // an ischaemic, hypoxic myocardium needs more current to capture
      const thr = (+r.paceThreshold || 65) * (1 + 0.4 * U.clamp(this.sim.hypox, 0, 1.5));
      // demand mode: a faster intrinsic rhythm with QRS complexes inhibits the pacer
      const inhibited = !rh.continuous && rh.qrs && intrinsicRate >= rate;
      const fire = !inhibited;
      const capture = fire && rh.continuous !== 'vf' && rh.continuous !== 'torsades' && mA >= thr;
      const mech = capture && !NO_MECH_PACE.includes(rhythm) && this.sim.hypox < 1;
      return (this.paceState = { on: true, rate, mA, thr, fire, capture, mech, inhibited });
    }

    // Arrest bookkeeping (every 50 ms): pulseless time, CPR fraction, pauses, time to first CPR.
    track(dt, pulseless, cpr) {
      const S = this.stats;
      if (pulseless && !S.inArrest) { S.inArrest = true; S.arrests++; S.sinceOnset = 0; S.pauseCur = 0; }
      if (!pulseless && S.inArrest) { S.inArrest = false; S.roscs++; S.pauseCur = 0; S.cycleT = 0; }
      if (cpr && !S.cprOn) { S.cycleT = 0; if (S.pauseCur > 2) S.pauses++; S.pauseCur = 0; }
      S.cprOn = cpr;
      if (cpr) S.cycleT += dt;
      if (!S.inArrest) return;
      S.arrestT += dt; S.sinceOnset += dt;
      if (cpr) { S.cprT += dt; if (S.firstCPR == null) S.firstCPR = S.sinceOnset; }
      else { S.noFlowT += dt; if (S.firstCPR != null) { S.pauseCur += dt; S.longestPause = Math.max(S.longestPause, S.pauseCur); } }
    }

    // Defibrillation (sync = false) or synchronised cardioversion (sync = true).
    shock(J, sync) {
      const sim = this.sim, rh = sim.heart.rh, rhythm = sim.p.heart.rhythm;
      J = U.clamp(+J || 200, 2, 360);
      // a synchronised shock waits for an R wave: VF, torsades and asystole have none, so it never fires
      if (sync && (rh.continuous || !rh.qrs)) return { delivered: false, reason: 'no R wave to synchronise to — shock not delivered', from: rhythm, to: rhythm, J, sync };
      sim.heart.shockT = sim.t;
      this.stats.shocks++;
      if (!sim.authority) return { delivered: true, pending: true, from: rhythm, to: rhythm, J, sync };
      const mode = (sim.p.resus || {}).shockMode || 'auto';
      const ef = J >= 150 ? 1 : J >= 100 ? 0.85 : J >= 50 ? 0.6 : 0.3;
      const h = sim.hypox, amio = sim.pharm.effect('amiodarone');
      const roll = (p) => mode === 'convert' ? true : mode === 'refractory' ? false : sim.rand() < p;
      let to = rhythm;
      if (SHOCKABLE.includes(rhythm)) {
        // early, coarse VF terminates readily; after minutes of no flow it terminates less often, and
        // a myocardium still in oxygen debt is left in an organised rhythm without output (PEA)
        const p = U.clamp((0.92 - 0.55 * Math.max(0, h - 0.4)) * ef * (1 + 0.25 * amio), 0.05, 0.97);
        const pRosc = U.clamp(1 - (h - 0.3) / 0.6, 0, 1);   // debt 0.3 → always ROSC · 0.9 → organised but no output
        if (roll(p)) to = (mode === 'convert' || sim.rand() < pRosc) ? 'sinus' : 'pea';
      } else if (SYNC_OK[rhythm] != null) {
        // an unsynchronised shock on an organised rhythm can land on the T wave
        if (!sync && mode === 'auto' && sim.rand() < 0.2) to = 'vf';
        else if (roll(SYNC_OK[rhythm] * ef)) to = 'sinus';
      } else if (rh.mech && !sync && mode === 'auto' && sim.rand() < 0.2) {
        to = 'vf';                                       // shocking a perfusing rhythm: R-on-T
      }
      if (to !== rhythm) {
        const label = (R.RHYTHMS[to] || {}).label || to;
        sim._changeRhythm(to, (sync ? 'Cardioversion ' : 'Shock ') + Math.round(J) + ' J → ' + label, to === 'pea' ? 'post-shock' : null);
      }
      return { delivered: true, from: rhythm, to, J, sync, changed: to !== rhythm };
    }

    export() { return { phase: this.phase, co: this.co, cause: this.cause, terminal: this.terminal, stats: Object.assign({}, this.stats) }; }
    import(s) {
      if (!s) return;
      this.co = s.co || 0; this.cause = s.cause || null; this.terminal = s.terminal || 0;
      if (s.stats) Object.assign(this.stats, s.stats);
    }
  }

  R.Resus = Resus;
  R.resusConst = { SV_CPR, PTH, SHOCKABLE, SYNC_OK };
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
