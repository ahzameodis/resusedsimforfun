/* RESUS Sim v2 engine — circulation.
 *
 * Two layers:
 *
 * 1. equilibrium()  — the operating point (CO, CVP, PCWP, MAP, mPAP), recomputed every
 *    50 ms. Guyton venous return meets right- and left-heart Starling curves:
 *        venous return   CO  = (MSFP − RAP) / RVR
 *        right heart     SV  = SVmax·cR·fill·kick·aR(mPAP)·(1 − e^(−RAPtm/kR))
 *        left heart      SV  = SVmax·cL·fill·kick·aL(MAP)·(1 − e^(−LAPtm/kL))
 *        transmural      Ptm = P − pleural − pericardial
 *        MAP = RAP + CO·SVR/80      mPAP = LAP + CO·PVR/80
 *    Solved as one monotone equation in CO by bisection. Because pleural and pericardial
 *    pressure enter through the TRANSMURAL filling pressure, PEEP, auto-PEEP, tension
 *    pneumothorax and tamponade all lower CO by the same physiological route, and the
 *    damage is larger when the patient is volume-depleted (steep part of the curve).
 *
 * 2. Vasculature    — the beat-to-beat waveforms at 200 Hz. Each QRS ejects a stroke
 *    volume (from the equilibrium, scaled by that beat's filling time, atrial kick and
 *    breathing) into a 3-element Windkessel whose outflow drains to RAP — so with no
 *    output the arterial pressure decays to mean systemic filling pressure. A short
 *    aortic-valve backflow makes the dicrotic notch and a reflected wave (stronger with
 *    vasoconstriction and age) shapes the late-systolic / dicrotic hump.
 */
(function (R) {
  'use strict';
  const U = R.util;

  const PPL_REF = U.mmHg(-5);   // resting pleural pressure, mmHg

  function derive(p) {
    const w = p.patient.weightKg, age = p.patient.age, male = p.patient.sex === 'M';
    const bvNormal = (male ? 75 : 65) * w;
    return {
      bvNormal,
      bv: p.volume.bloodVolume != null ? p.volume.bloodVolume : bvNormal,
      vu0: 0.68 * bvNormal,               // unstressed volume → stressed ≈ 32 % of blood volume
      cv: 1.9 * w,                        // systemic venous compliance, mL/mmHg (MSFP ≈ 11 at normal volume)
      rvr0: 1.25 * 70 / w,                // resistance to venous return, mmHg·min/L
      svmax: 135 * Math.pow(w / 70, 0.7), // asymptotic stroke volume of the Starling curves, mL
      kR: 8.3, kL: 11.1,                  // Starling curve pressure scales, mmHg
      p0R: 1, p0L: 3,                     // transmural filling pressure at which output begins, mmHg
      ca: p.vessels.arterialCompliance != null ? p.vessels.arterialCompliance
        : U.clamp(2.3 - 0.015 * age, 0.8, 2.2) * Math.sqrt(w / 70),      // mL/mmHg, stiffer with age
      rc: 0.04 * (1 + 0.012 * Math.max(0, age - 40)),                       // aortic characteristic impedance, mmHg·s/mL
      cpa: 4.5, rcpa: 0.012,
      reflLagS: U.clamp(0.20 - 0.0015 * (age - 20), 0.08, 0.22),           // reflected-wave return time, s
      age,
    };
  }

  // ctx: { hr, fill, kick, mech, pplMean (mmHg), pvrFactor, baro: {svr, vu, ct} }
  function equilibrium(k, p, ctx) {
    const pperi = p.thorax.pericardial || 0;
    const ppl = ctx.pplMean;
    const svr = p.vessels.svr * ctx.baro.svr;
    const pvr = p.vessels.pvr * (ctx.pvrFactor || 1);
    const vu = k.vu0 * (p.volume.venousTone || 1) * ctx.baro.vu;
    // ~30 % of a pleural pressure rise is passed to the abdomen and raises MSFP too
    const msfp = Math.max(0, k.bv - vu) / k.cv + 0.3 * (ppl - PPL_REF);
    // part of arteriolar resistance sits in the venous-return path, so vasodilation also eases venous return
    const rvr = k.rvr0 * (p.thorax.venousObstruction || 1) * (0.55 + 0.45 * svr / 1150);
    const cL = p.heart.contractility * ctx.baro.ct, cR = p.heart.rvContractility * ctx.baro.ct;
    const eq = { co: 0, sv: 0, hr: ctx.hr, msfp, svr, pvr, rvr, ppl, pperi, cL, cR, rap: msfp, lap: msfp, map: msfp, pap: msfp, rapTm: msfp - ppl - pperi, sens: 0 };
    if (!ctx.mech || ctx.hr < 5) return eq;   // no ejection: pressures settle toward MSFP

    const base = k.svmax * ctx.fill * ctx.kick;
    const betaL = 0.2 / Math.max(cL, 0.15);   // a weak LV is more afterload-sensitive
    const solve = (co) => {
      const sv = co * 1000 / ctx.hr;
      const rap = msfp - co * rvr;
      const map = rap + co * svr / 80;
      const aL = U.clamp(1 / (1 + betaL * (map - 90) / 90), 0.4, 1.6);
      const r = sv / Math.max(base * cL * aL, 1e-6);
      const lapTm = k.p0L + (r < 1 ? -k.kL * Math.log(Math.max(1 - r, 1e-4)) : 102 + (r - 1) * 1000);
      const lap = lapTm + ppl + pperi;
      const pap = lap + co * pvr / 80;
      const aR = 1 / (1 + Math.max(0, pap - 15) / 30);
      const rapTm = rap - ppl - pperi;
      const svR = base * cR * aR * (1 - Math.exp(-Math.max(0, rapTm - k.p0R) / k.kR));
      return { sv, rap, map, lap, pap, rapTm, svR };
    };
    const F = (co) => { const s = solve(co); return s.svR - s.sv; };
    // Venous return plateaus once RAP falls below 0: the great veins collapse, so return is
    // capped at MSFP/RVR however hard the heart pulls.
    const coMax = Math.max(msfp, 0) / rvr;
    if (coMax <= 0.02 || F(0.02) <= 0) return eq;
    let co, s;
    if (F(coMax) > 0) {
      co = coMax; s = solve(co);
      // collapsing veins hold RAP at ~0: the heart is under-filled and venous-return limited
      s.rap = 0; s.rapTm = -ppl - pperi; s.map = co * svr / 80;
    } else {
      co = U.bisectDecreasing(F, 0.02, coMax, 44);
      s = solve(co);
    }
    const x = Math.max(0, s.rapTm - k.p0R) / k.kR;
    eq.co = co; eq.sv = s.sv; eq.rap = s.rap; eq.map = s.map; eq.pap = s.pap; eq.rapTm = s.rapTm;
    eq.lap = Math.min(s.lap, 45);
    // preload sensitivity d(lnSV)/d(RAPtm): steep when underfilled → large pulse-pressure variation
    eq.sens = (1 / k.kR) * Math.exp(-x) / Math.max(1 - Math.exp(-x), 0.05);
    return eq;
  }

  // Ejection flow profile: skewed beta shape (peak ≈ 37 % of ejection) + valve-closure backflow.
  const EJ_A = 1.1, EJ_B = 1.9, BACKFLOW = 0.04, BACK_T = 0.03;
  const EJ_NORM = (() => { let s = 0; const n = 400; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n; s += Math.pow(x, EJ_A) * Math.pow(1 - x, EJ_B); } return s / n; })();
  function makeEjection(t0, dur, sv, backflow) {
    return { t0, dur, peakK: sv * (1 + backflow) / (dur * EJ_NORM), backK: sv * backflow * Math.PI / (2 * BACK_T) };
  }
  function ejFlow(ej, t) {   // mL/s
    if (!ej) return 0;
    const s = t - ej.t0;
    if (s < 0) return 0;
    if (s < ej.dur) { const x = s / ej.dur; return ej.peakK * Math.pow(x, EJ_A) * Math.pow(1 - x, EJ_B); }
    const s2 = s - ej.dur;
    if (s2 < BACK_T) return -ej.backK * Math.sin(Math.PI * s2 / BACK_T);
    return 0;
  }

  class Vasculature {
    constructor(sim) {
      this.sim = sim;
      this.ej = null; this.ejR = null;
      this.pc = 85; this.pcpa = 12;
      this.part = 85; this.ppa = 15; this.cvp = 6; this.pleth = 0;
      this.qHist = new U.Ring(80, 0);
      this.pf1 = 85; this.pf2 = 85; this.pRing = new U.Ring(80, 85); this.plethBase = 85;
      this.yDepth = 1.4;
      this.resetBeatWindow();
    }
    init(eq) {
      this.pc = eq.map; this.pcpa = eq.pap; this.part = eq.map;
      this.pf1 = this.pf2 = this.plethBase = eq.map; this.pRing.fill(eq.map);
    }
    resetBeatWindow() { this.bMax = -Infinity; this.bMin = Infinity; this.bSum = 0; this.bN = 0; this.pMax = -Infinity; this.pMin = Infinity; this.pSum = 0; }
    closeBeatWindow() {
      if (!this.bN) return null;
      const r = { sys: this.bMax, dia: this.bMin, map: this.bSum / this.bN, psys: this.pMax, pdia: this.pMin, pmap: this.pSum / this.bN };
      this.resetBeatWindow();
      return r;
    }

    // Start a mechanical beat: LV and RV eject `sv` mL.
    eject(tv, rr, sv) {
      const lvet = Math.min(R.cardiac.LVET(60 / rr), 0.85 * rr);
      this.ej = makeEjection(tv + 0.05, lvet, sv, BACKFLOW);
      this.ejR = makeEjection(tv + 0.04, Math.min(lvet * 1.05, 0.9 * rr), sv, 0.02);
    }

    // cpr: { q (mL/s forward flow from the compression), pth (mmHg intrathoracic pulse) } — 48-resus.js
    step(t, dt, k, eq, dPpl, cpr) {
      const qc = cpr ? cpr.q : 0, pth = cpr ? cpr.pth : 0;
      const q = ejFlow(this.ej, t) + qc, qr = ejFlow(this.ejR, t) + qc;
      // systemic 3-element Windkessel, exact update for constant inflow over dt, draining to RAP
      const rtot = eq.svr / 1333.2, rp = Math.max(0.05, rtot - k.rc);
      const e = Math.exp(-dt / (rp * k.ca));
      this.pc = eq.rap + (this.pc - eq.rap) * e + q * rp * (1 - e);
      this.qHist.push(q);
      const gamma = U.clamp(0.22 + 0.004 * (k.age - 40) + 0.18 * (eq.svr / 1150 - 1), 0.08, 0.6);
      const qMean = eq.co * 1000 / 60;
      // a chest compression squeezes every intrathoracic vessel: the pulse reaches the arterial line…
      this.part = this.pc + k.rc * q + gamma * k.rc * (this.qHist.ago(k.reflLagS / dt) - qMean) + 0.85 * pth;
      // pulmonary artery: 3-element Windkessel draining to LAP; measured relative to atmosphere
      const rpp = Math.max(0.01, eq.pvr / 1333.2 - k.rcpa);
      const ep = Math.exp(-dt / (rpp * k.cpa));
      this.pcpa = eq.lap + (this.pcpa - eq.lap) * ep + qr * rpp * (1 - ep);
      this.ppa = this.pcpa + k.rcpa * qr + dPpl + 0.8 * pth;
      // central venous pressure: mean RAP + respiratory swing + a/c/x/v/y waves
      this.yDepth = 1.4 * Math.max(0.15, 1 - (eq.pperi || 0) / 12);   // tamponade blunts the y descent
      this.cvp = eq.rap + dPpl + this.cvpWaves(t, eq.rap) + 0.9 * pth;   // …and the right atrium almost equally
      // pleth: arterial pulse low-passed by tissue/sensor and delayed ~0.2 s to the finger;
      // amplitude falls with vasoconstriction (perfusion index)
      const a1 = 1 - Math.exp(-dt / 0.03);
      this.pf1 += (this.part - this.pf1) * a1; this.pf2 += (this.pf1 - this.pf2) * a1;
      this.pRing.push(this.pf2);
      const pd = this.pRing.ago(0.2 / dt);
      this.plethBase += (pd - this.plethBase) * (dt / 3);
      this.piGain = 0.06 * Math.pow(1150 / Math.max(eq.svr, 200), 0.7);
      this.pleth = (pd - this.plethBase) * this.piGain;
      // beat window for measured systolic/diastolic/mean
      if (this.part > this.bMax) this.bMax = this.part;
      if (this.part < this.bMin) this.bMin = this.part;
      if (this.ppa > this.pMax) this.pMax = this.ppa;
      if (this.ppa < this.pMin) this.pMin = this.ppa;
      this.bSum += this.part; this.pSum += this.ppa; this.bN++;
    }

    cvpWaves(t, rap) {
      const h = this.sim.heart, g = U.gauss;
      const amp = 1 + Math.max(0, rap) / 12;
      let w = 0;
      for (let i = 0; i < h.A.length; i++) {
        const a = h.A[i], s = t - a.t;
        if (s <= 0 || s > 0.3) continue;
        let cannon = 1;   // atrium contracting against a closed tricuspid valve → cannon a wave
        for (let j = 0; j < h.V.length; j++) { const d = a.t - h.V[j].t; if (h.V[j].mech && d > 0.04 && d < 0.32) cannon = 3.2; }
        w += 1.6 * amp * cannon * g(s, 0.09, 0.035);
      }
      for (let i = 0; i < h.V.length; i++) {
        const b = h.V[i], s = t - b.t;
        if (!b.mech || s < -0.05 || s > 0.9) continue;
        const lv = R.cardiac.LVET(60 / b.rr);
        w += 0.8 * amp * g(s, 0.06, 0.02) - 1.4 * amp * g(s, 0.17, 0.045) + 1.6 * amp * g(s, lv + 0.12, 0.05) - this.yDepth * amp * g(s, lv + 0.25, 0.05);
      }
      return w;
    }
  }

  R.circulation = { derive, equilibrium, PPL_REF };
  R.Vasculature = Vasculature;
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
