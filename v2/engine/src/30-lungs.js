/* RESUS Sim v2 engine — respiratory mechanics and ventilator.
 *
 * Single-compartment equation of motion, integrated every 5 ms:
 *     Paw = R·Flow + V/C − Pmus        (V = volume above relaxed FRC)
 *     Palv = V/C − Pmus                Ppl = −5 + ecw·V/C − Pmus (+ pneumothorax offset)
 * Volume carries over from breath to breath, so when expiration is cut short the next
 * breath starts on top of trapped gas — auto-PEEP and dynamic hyperinflation emerge
 * rather than being calculated. Pmus (patient effort) runs on its own clock, so the
 * patient can trigger, double-trigger or breathe against the ventilator.
 *
 * Modes: 'off' (spontaneous, not intubated) · 'VC' · 'PC' · 'PRVC' · 'PS' · 'CPAP'.
 * VC/PC/PRVC are assist-control (time-triggered at the set rate, patient-triggerable);
 * PS is patient-triggered and flow-cycled; CPAP and 'off' are fully spontaneous.
 *
 * Pplat and PEEPtot are reported as STATIC values (V/C at end-inspiration and at
 * end-expiration) — what an inspiratory / expiratory hold manoeuvre would show.
 */
(function (R) {
  'use strict';
  const U = R.util;
  const PPL0 = -5;   // pleural pressure at relaxed volume, cmH2O

  class Lungs {
    constructor(sim) {
      this.sim = sim;
      this.V = 0; this.Q = 0;
      this.paw = 0; this.palv = 0; this.ppl = PPL0; this.pmus = 0; this.pmusT = 0;
      this.pplMean = PPL0; this.palvMean = 0;
      this.mode = 'off';
      this.phase = 'exp'; this.tIn = 1; this.breathStart = 0; this.haveBreath = false; this.triggered = false;
      this.prvcP = 10;
      this.tiFlow = 1; this.f0 = 0; this.pauseT = 0;
      this.resetAcc(0);
      this.last = null;
      this.lastBreathT = -1e9;
      this.co2 = 0; this.co2Peak = 0; this.etLast = 0; this.exhaling = false; this.vex = 0; this.tExp = 0;
    }

    // Called every 50 ms with the EFFECTIVE parameters (drugs and events applied).
    // Airway events only matter once intubated: 'disconnected' and 'extubated' open the airway
    // to the room (no PEEP, no ventilator breaths); 'esophageal' sends every breath into the
    // stomach — normal-looking pressures, no alveolar ventilation, no CO2.
    derive(p) {
      const aw = (p.airway && p.airway.state) || 'normal';
      this.airway = p.vent.mode === 'off' ? 'normal' : aw;
      this.open = this.airway === 'disconnected' || this.airway === 'extubated';
      const stomach = this.airway === 'esophageal';
      this.C = (stomach ? 120 : Math.max(p.lungs.compliance, 5)) / 1000;   // L/cmH2O
      this.intub = p.vent.mode !== 'off' && this.airway !== 'extubated';
      this.R = Math.max(0.5, p.lungs.resistance + (this.intub ? p.airway.ettResistance : 0));
      this.tau = Math.max(this.R * this.C, 1e-3);
      this.ecw = stomach ? 0.05 : U.clamp(p.lungs.ecwFrac, 0.05, 0.95);
      this.vdanat = 2.2 * U.pbw(p.patient.sex, p.patient.heightCm) / 1000;   // L
      if (p.vent.mode !== this.mode) this.setMode(p.vent.mode, p);
      if (this.wasOpen && !this.open) { this.phase = 'exp'; this.tIn = 1; this.haveBreath = false; this.breathStart = this.sim.t - 60 / Math.max(p.vent.rr, 1); }
      this.wasOpen = this.open;
    }

    setMode(mode, p) {
      this.mode = mode;
      this.phase = 'exp'; this.tIn = 1; this.haveBreath = false;
      this.breathStart = this.sim.t - 60 / Math.max(p.vent.rr, 1);   // first mandatory breath is due now
      if (mode === 'PRVC') this.prvcP = 10;                          // test breath, then adapt
    }

    resetAcc(t) {
      this.breathStart = t;
      this.pip = -Infinity; this.qPeak = 0; this.vtiAcc = 0; this.vteAcc = 0;
      this.pawSum = 0; this.palvSum = 0; this.pplSum = 0; this.nAcc = 0;
      this.vStart = this.V; this.vEndInsp = this.V; this.tiLast = 0; this.vMaxT = 0;
    }

    // Patient inspiratory effort: half-cosine rise to `effort` over Ti, then fast relaxation.
    effortStep(dt) {
      const b = this.sim.pe.breathing;
      const eff = Math.max(0, b.effort || 0), rate = Math.max(0, b.rate || 0);
      if (eff < 0.4 || rate <= 0) { this.pmus = 0; this.pmusT = 0; return false; }   // a flicker of effort is apnoea
      const T = 60 / rate, ti = Math.min(0.42 * T, 1.3);
      this.pmusT += dt;
      let cycle = false;
      if (this.pmusT >= T) { this.pmusT -= T; cycle = true; }
      const s = this.pmusT;
      this.pmus = s < ti ? eff * 0.5 * (1 - Math.cos(Math.PI * s / ti)) : eff * Math.exp(-(s - ti) / 0.12);
      return cycle;
    }

    // Pressure-driven segment: exact solution of R·dV/dt = Pdrive + Pmus − V/C over dt.
    pDrive(pd, dt) {
      const vInf = this.C * (pd + this.pmus);
      const v1 = vInf + (this.V - vInf) * Math.exp(-dt / this.tau);
      this.Q = (v1 - this.V) / dt;
      this.V = v1;
    }

    startBreath(t, triggered) {
      if (this.haveBreath) this.closeBreath(t);
      this.haveBreath = true;
      this.resetAcc(t);
      this.phase = 'insp'; this.tIn = 0; this.triggered = triggered;
      const v = this.sim.p.vent;
      if (this.mode === 'VC') {
        const T = 60 / Math.max(v.rr, 1), vt = v.vt / 1000, F = Math.max(v.flow, 5) / 60;
        const decel = v.flowPattern === 'decel';
        // a descending ramp delivers the same VT at the set PEAK flow over twice the time
        let tiFlow = decel ? vt / (F / 2) : vt / F;
        let pause = U.clamp(v.pause || 0, 0, 1.5);
        const maxTi = 0.9 * T;
        if (tiFlow + pause > maxTi) { pause = Math.min(pause, maxTi * 0.4); tiFlow = Math.max(maxTi - pause, 0.15); }
        this.tiFlow = tiFlow; this.pauseT = pause;
        this.f0 = decel ? 2 * vt / tiFlow : vt / tiFlow;
      }
    }

    endInsp(t) {
      this.vEndInsp = this.V;
      this.tiLast = t - this.breathStart;
      this.phase = 'exp'; this.tIn = 0;
    }

    closeBreath(t) {
      const v = this.sim.p.vent, C = this.C;
      const spont = this.mode === 'off' || this.mode === 'CPAP' || this.open;
      const ttot = Math.max(t - this.breathStart, 0.2);
      const peepSet = (this.mode === 'off' || this.open) ? 0 : v.peep;
      const peepTot = this.V / C;
      const pplat = this.vEndInsp / C;
      const vti = this.vtiAcc * 1000, vte = this.vteAcc * 1000;
      const ti = spont ? this.vMaxT : this.tiLast;
      const n = Math.max(this.nAcc, 1);
      const m = {
        t, ttot, ti, te: ttot - ti, rr: 60 / ttot, ie: ti > 0 ? (ttot - ti) / ti : 0,
        pip: spont ? null : this.pip, pplat, peepTot, peepi: Math.max(0, peepTot - peepSet), vti, vte,
        dp: pplat - peepTot,
        cstat: pplat - peepTot > 0.5 ? vti / (pplat - peepTot) : 0,
        cdyn: !spont && this.pip - peepTot > 0.5 ? vti / (this.pip - peepTot) : 0,
        mpaw: this.pawSum / n, palvMean: this.palvSum / n, pplMean: this.pplSum / n,
        triggered: this.triggered, etco2: this.etLast,
      };
      if (this.mode === 'PRVC') {
        const err = v.vt - vti, cEst = Math.max(vti / Math.max(this.prvcP, 1), 5);
        this.prvcP = U.clamp(this.prvcP + U.clamp(err / cEst, -3, 3), 5, 40 - v.peep);
      }
      this.last = m;
      this.lastBreathT = t;
      this.sim.onBreath(m);
    }

    step(t, dt) {
      const p = this.sim.p, v = p.vent, C = this.C;
      const newCycle = this.effortStep(dt);
      const pm = this.pmus, mode = this.mode;
      let paw;
      if (mode === 'off' || mode === 'CPAP' || this.open) {
        const base = (mode === 'CPAP' && !this.open) ? v.peep : 0;
        if (newCycle) { if (this.haveBreath) this.closeBreath(t); this.haveBreath = true; this.resetAcc(t); this.triggered = true; }
        this.pDrive(base, dt);
        paw = base - (mode === 'CPAP' && !this.open ? 0.12 * pm : 0);
        if (this.V > this.vEndInsp) { this.vEndInsp = this.V; this.vMaxT = t - this.breathStart; }
      } else {
        const T = 60 / Math.max(v.rr, 1);
        if (this.phase === 'exp') {
          const trig = this.tIn > 0.25 && pm > 0.3 && this.Q * 60 > (v.trigger || 2);
          const due = mode !== 'PS' && (t - this.breathStart) >= T;
          if (trig || due) this.startBreath(t, trig && !due);
        }
        if (this.phase === 'insp' && mode === 'VC') {
          const x = Math.min(this.tIn / this.tiFlow, 1);
          const q = v.flowPattern === 'decel' ? this.f0 * (1 - x) : this.f0;
          this.Q = q; this.V += q * dt;
          paw = this.V / C - pm + this.R * q;
          this.tIn += dt;
          if (this.tIn >= this.tiFlow) { if (this.pauseT > 0) { this.phase = 'pause'; this.tIn = 0; } else this.endInsp(t + dt); }
        } else if (this.phase === 'insp') {
          const pset = mode === 'PS' ? v.ps : (mode === 'PC' ? v.pc : this.prvcP);
          paw = v.peep + pset * Math.min(1, (this.tIn + dt) / Math.max(v.rise || 0.1, 0.02));
          this.pDrive(paw, dt);
          this.tIn += dt;
          if (this.Q > this.qPeak) this.qPeak = this.Q;
          const end = mode === 'PS'
            ? (this.tIn > 0.15 && this.Q < (v.cycle / 100) * this.qPeak) || this.tIn >= 2.5
            : this.tIn >= Math.min(v.itime, 0.85 * T);
          if (end) this.endInsp(t + dt);
        } else if (this.phase === 'pause') {
          this.Q = 0;
          paw = this.V / C - pm;
          this.tIn += dt;
          if (this.tIn >= this.pauseT) this.endInsp(t + dt);
        } else {
          // expiration: valve open to PEEP; a patient effort makes a small trigger dip
          paw = v.peep - 0.15 * pm;
          this.pDrive(paw, dt);
          this.tIn += dt;
        }
      }
      this.paw = paw;
      this.palv = this.V / C - pm;
      this.ppl = PPL0 + this.ecw * (this.V / C) - pm + U.cmH2O(this.sim.pe.thorax.pplOffset || 0);
      this.pplMean += (this.ppl - this.pplMean) * (dt / 4);
      this.palvMean += (this.palv - this.palvMean) * (dt / 4);
      if ((this.phase === 'insp' || this.phase === 'pause') && paw > this.pip) this.pip = paw;
      if (this.Q > 0) this.vtiAcc += this.Q * dt; else this.vteAcc -= this.Q * dt;
      this.pawSum += paw; this.palvSum += this.palv; this.pplSum += this.ppl; this.nAcc++;
      this.capno(dt);
    }

    // Capnogram: dead-space gas first (phase II), then the alveolar plateau (phase III).
    // Obstruction spreads emptying → slow upstroke and sloping plateau ("shark fin").
    capno(dt) {
      if (this.Q < -1e-4) {
        if (!this.exhaling) { this.exhaling = true; this.vex = 0; this.tExp = 0; this.co2Peak = 0; }
        this.vex -= this.Q * dt; this.tExp += dt;
        const obst = 1 + Math.max(0, this.R - 10) / 10, vd = this.vdanat;
        const ph2 = U.sigmoid((this.vex - vd) / (0.15 * vd * obst));
        const ph3 = 1 - (0.05 + 0.10 * (obst - 1)) * Math.exp(-this.tExp / (0.35 + 0.5 * (obst - 1)));
        this.co2 = (this.airway === 'esophageal' ? 0 : this.sim.gas.etAlv) * ph2 * ph3;
        if (this.co2 > this.co2Peak) this.co2Peak = this.co2;
      } else if (this.Q > 1e-4) {
        if (this.exhaling) { this.exhaling = false; this.etLast = this.co2Peak; }
        this.co2 *= Math.exp(-dt / 0.03);
      } else {
        this.co2 *= Math.exp(-dt / 2);   // no gas movement (apnoea / pause)
      }
    }

    // Volume shown on the ventilator: inspired volume since breath start (resets each breath).
    volDisplay() { return (this.mode === 'off' ? this.V : this.V - this.vStart) * 1000; }
  }

  R.Lungs = Lungs;
  R.lungsConst = { PPL0 };
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
