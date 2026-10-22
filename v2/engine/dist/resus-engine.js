/* RESUS Sim v2 engine — built 2026-10-19T16:59:11.381Z from 00-core.js, 10-heart.js, 20-circulation.js, 30-lungs.js, 40-gas.js, 45-volume.js, 46-drugs.js, 47-events.js, 48-resus.js, 50-sim.js, 60-scenarios.js
 * TRAINING SIMULATION — NOT A MEDICAL DEVICE · NOT FOR CLINICAL USE. Do not edit; edit src/ and rebuild. */

/* ---- 00-core.js ---- */
/* RESUS Sim v2 engine — core utilities, units and the default patient.
 *
 * TRAINING SIMULATION — NOT A MEDICAL DEVICE · NOT FOR CLINICAL USE.
 *
 * Every src file attaches to one shared namespace (globalThis.ResusEngine), so the
 * files can be concatenated into a single <script> for the browser (see build.js) or
 * required in order from Node (see index.js). No DOM access anywhere in the engine.
 *
 * Unit conventions used throughout:
 *   circulation pressures  mmHg          airway / alveolar / pleural pressures  cmH2O
 *   blood flow             mL/s inside the heart model, L/min for CO
 *   gas flow               L/s inside the lung model, L/min when displayed
 *   SVR / PVR              dyn·s·cm⁻⁵ (MAP − CVP = CO·SVR/80)
 *   time                   seconds
 */
(function (R) {
  'use strict';

  const U = R.util = {};

  U.CMH2O_PER_MMHG = 1.3595;
  U.mmHg = (cm) => cm / U.CMH2O_PER_MMHG;
  U.cmH2O = (mm) => mm * U.CMH2O_PER_MMHG;

  U.clamp = (x, a, b) => (x < a ? a : (x > b ? b : x));
  U.gauss = (x, c, w) => Math.exp(-((x - c) * (x - c)) / (2 * w * w));
  U.sigmoid = (x) => 1 / (1 + Math.exp(-x));

  // Small, fast, seedable PRNG (mulberry32) so test runs are reproducible.
  U.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // Standard normal from a uniform source (Box–Muller).
  U.normal = function (rand) {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  // Stateless deterministic noise in [-0.5, 0.5) — used for ECG baseline texture so
  // drawing never consumes the seeded PRNG.
  U.hashNoise = function (t) {
    const s = Math.sin(t * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s) - 0.5;
  };

  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  U.deepMerge = function (dst, src) {
    if (!isObj(src)) return dst;
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (isObj(v)) { if (!isObj(dst[k])) dst[k] = {}; U.deepMerge(dst[k], v); }
      else if (v !== undefined) dst[k] = v;
    }
    return dst;
  };
  U.clone = (o) => JSON.parse(JSON.stringify(o));

  // Root of a monotonically DECREASING function on [lo, hi] by bisection.
  U.bisectDecreasing = function (f, lo, hi, iters) {
    for (let i = 0; i < (iters || 48); i++) {
      const mid = 0.5 * (lo + hi);
      if (f(mid) > 0) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  };

  // Predicted body weight (ARDSNet), kg.
  U.pbw = (sex, heightCm) => Math.max(30, (sex === 'M' ? 50 : 45.5) + 0.91 * (heightCm - 152.4));

  // Fixed-length ring buffer of numbers with linear-interpolated delayed reads.
  U.Ring = class {
    constructor(n, fill) { this.n = n; this.a = new Float64Array(n); this.a.fill(fill || 0); this.i = 0; }
    push(v) { this.a[this.i] = v; this.i = (this.i + 1) % this.n; }
    fill(v) { this.a.fill(v); }
    // value k samples ago (0 = most recent), fractional k allowed
    ago(k) {
      k = U.clamp(k, 0, this.n - 2);
      const k0 = Math.floor(k), f = k - k0;
      const i0 = (this.i - 1 - k0 + 2 * this.n) % this.n, i1 = (i0 - 1 + this.n) % this.n;
      return this.a[i0] * (1 - f) + this.a[i1] * f;
    }
  };

  // Default patient: healthy adult, spontaneously breathing room air, not ventilated.
  // Scenario presets (60-scenarios.js) and the instructor override these.
  R.DEFAULTS = {
    patient:    { sex: 'F', age: 45, heightCm: 168, weightKg: 70 },
    heart:      { rhythm: 'sinus', hr: 75, atrialRate: 80, contractility: 1.0, rvContractility: 1.0, hrv: 0.015 },
    vessels:    { svr: 1150, pvr: 100, arterialCompliance: null },   // null → from age
    volume:     { bloodVolume: null, venousTone: 1.0 },              // null → normal for sex/weight; venousTone >1 = venodilated
    thorax:     { pplOffset: 0, pericardial: 0, venousObstruction: 1.0 }, // pplOffset/pericardial in mmHg
    lungs:      { compliance: 60, resistance: 4, ecwFrac: 0.45, frc: null, shunt: 0.03, vqMismatch: 0, deadSpace: 0.05, recruitability: 0 },
    metabolism: { vo2Factor: 1.0, rq: 0.8, hb: 13.5 },
    reflex:     { baro: 1.0, mapSetpoint: 90 },
    breathing:  { rate: 14, effort: 9 },           // spontaneous drive; effort = peak muscle pressure, cmH2O (0 = apnoeic/paralysed)
    airway:     { fio2: 21, ettResistance: 5 },    // fio2 used when not ventilated (O2 device)
    vent:       { mode: 'off', rr: 14, vt: 450, flow: 50, flowPattern: 'const', pause: 0.2, pc: 15, itime: 1.0, rise: 0.15,
                  ps: 12, cycle: 25, peep: 5, fio2: 40, trigger: 2 },
    sim:        { gasSpeed: 1 },
    // resuscitation (48-resus.js): chest compressions, transcutaneous pacing, how shocks turn out,
    // and whether the patient can arrest / regain a circulation on their own
    resus:      { cpr: false, cprRate: 110, cprDepth: 1, pace: false, paceRate: 70, paceMA: 0, paceThreshold: 65,
                  autoRhythm: true, shockMode: 'auto' },   // shockMode 'auto' (physiology) | 'convert' | 'refractory'
  };

  R.version = '2.0.0-engine.1';
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));

/* ---- 10-heart.js ---- */
/* RESUS Sim v2 engine — cardiac rhythm, beat timing and ECG synthesis.
 *
 * The heart owns WHEN beats happen. Atrial (P) and ventricular (QRS) events are
 * scheduled separately, so AV blocks, AV dissociation and AF fall out of the timing
 * rules instead of being drawn as fixed pictures. Each ventricular event is handed to
 * the circulation, which decides how much blood that beat ejects (filling time, atrial
 * kick, breathing). The ECG is rebuilt from the same event list, so what you see on
 * lead II is exactly what drove the pressure trace.
 */
(function (R) {
  'use strict';
  const U = R.util;

  // atrial:  'sinus' P waves conduct per `conduct` · 'indep' P waves dissociated from QRS ·
  //          'fib' fibrillatory baseline · 'none'
  // conduct: 'normal' | 'wenckebach' (n:n-1) | 'mobitz2' (n:1)
  // vclock:  ventricular clock when QRS is not driven by conduction: 'af' | 'regular' | 'escape'
  // mech:    the QRS produces a mechanical (ejecting) beat
  // kick:    mean atrial contribution to stroke volume (1 = intact AV synchrony)
  // baro:    share of the baroreflex heart-rate response this rhythm can express
  R.RHYTHMS = {
    sinus:     { label: 'Sinus rhythm',                    atrial: 'sinus', conduct: 'normal',               qrs: 'narrow', mech: true,  kick: 1.00, baro: 1 },
    sinustach: { label: 'Sinus tachycardia',               atrial: 'sinus', conduct: 'normal',               qrs: 'narrow', mech: true,  kick: 1.00, baro: 1 },
    sinusbrad: { label: 'Sinus bradycardia',               atrial: 'sinus', conduct: 'normal',               qrs: 'narrow', mech: true,  kick: 1.00, baro: 1 },
    istemi:    { label: 'Inferior STEMI',                  atrial: 'sinus', conduct: 'normal',               qrs: 'stemi',  mech: true,  kick: 1.00, baro: 1 },
    af:        { label: 'Atrial fibrillation',             atrial: 'fib',   vclock: 'af',                    qrs: 'narrow', mech: true,  kick: 0.85, baro: 0.6 },
    svt:       { label: 'SVT',                             atrial: 'none',  vclock: 'regular',               qrs: 'narrow', mech: true,  kick: 0.88, baro: 0 },
    vt:        { label: 'VT with pulse',                   atrial: 'none',  vclock: 'regular',               qrs: 'wide',   mech: true,  kick: 0.60, baro: 0 },
    pvt:       { label: 'Pulseless VT',                    atrial: 'none',  vclock: 'regular',               qrs: 'wide',   mech: false, kick: 0,    baro: 0 },
    vf:        { label: 'Ventricular fibrillation',        continuous: 'vf',                                                mech: false, kick: 0,    baro: 0 },
    torsades:  { label: 'Torsades de pointes',             continuous: 'torsades',                                          mech: false, kick: 0,    baro: 0 },
    asystole:  { label: 'Asystole',                        continuous: 'asystole',                                          mech: false, kick: 0,    baro: 0 },
    pea:       { label: 'PEA',                             atrial: 'none',  vclock: 'regular',               qrs: 'narrow', mech: false, kick: 0,    baro: 0 },
    avb1:      { label: '1st-degree AV block',             atrial: 'sinus', conduct: 'normal', pr: 0.30,     qrs: 'narrow', mech: true,  kick: 0.95, baro: 1 },
    avb2i:     { label: '2nd-degree AVB · Mobitz I',       atrial: 'sinus', conduct: 'wenckebach', n: 4,     qrs: 'narrow', mech: true,  kick: 1.00, baro: 1 },
    avb2ii:    { label: '2nd-degree AVB · Mobitz II 2:1',  atrial: 'sinus', conduct: 'mobitz2', n: 2,        qrs: 'narrow', mech: true,  kick: 1.00, baro: 1 },
    avb3:      { label: 'Complete heart block',            atrial: 'indep', vclock: 'escape',                qrs: 'wide',   mech: true,  kick: 0.85, baro: 0 },
    // set by the engine, not chosen: adenosine's few seconds of AV-node block (P waves, no QRS)
    avblock:   { label: 'Transient AV block (adenosine)',  atrial: 'sinus', conduct: 'none',                 qrs: 'narrow', mech: false, kick: 0,    baro: 1, hidden: true },
  };

  // Left-ventricular ejection time (Weissler regression), clamped to physiological range.
  const LVET = (hr) => U.clamp(0.413 - 0.0017 * hr, 0.17, 0.34);
  // Diastolic filling completeness for a beat that follows an R-R interval `rr`.
  // Systole ≈ LVET + isovolumic periods; filling approaches completion exponentially
  // (τ 90 ms), so short diastoles (fast rates, short AF cycles) give small beats.
  const FILL_TAU = 0.09;
  const fillOf = (rr) => {
    const sys = LVET(60 / rr) + 0.10;
    return 1 - Math.exp(-Math.max(0, rr - sys) / FILL_TAU);
  };
  const AF_SPREAD = 0.9;   // AF R-R drawn uniformly from mean·[0.55, 1.45] (CV ≈ 0.26)
  const meanFill = (rh, vRate) => {
    const mean = 60 / Math.max(vRate, 5);
    if (rh.vclock !== 'af') return fillOf(mean);
    let s = 0; const n = 32;
    for (let i = 0; i < n; i++) s += fillOf(Math.max(0.28, mean * (1 - AF_SPREAD / 2 + AF_SPREAD * (i + 0.5) / n)));
    return s / n;
  };
  R.cardiac = { LVET, fillOf, meanFill };

  class Heart {
    constructor(sim) {
      this.sim = sim;
      this.rh = R.RHYTHMS.sinus;
      this.rhythm = '';
      this.A = [];          // recent atrial events {t}
      this.V = [];          // recent ventricular events {t, rr, mech, kick, qrs}
      this.pending = [];    // conducted QRS times waiting to fire
      this.nextA = Infinity;
      this.nextV = Infinity;
      this.lastA = null;
      this.lastV = null;
      this.k = 0;           // conduction counter for Wenckebach / Mobitz
      this.rates = { vRate: 75, aRate: 75 };
      this.pace = null;     // pacemaker state from 48-resus.js: { rate, fire, capture, mech }
      this.P = [];          // recent pacing spikes {t}
      this.nextP = Infinity;
      this.shockT = null;   // time of the last delivered shock (ECG artefact)
    }

    setRhythm(t, key) {
      if (key === this.rhythm) return;
      this.rhythm = key;
      this.rh = R.RHYTHMS[key] || R.RHYTHMS.sinus;
      this.pending.length = 0;
      this.k = 0;
      const rh = this.rh;
      this.nextA = (rh.atrial === 'sinus' || rh.atrial === 'indep') ? t + 0.05 : Infinity;
      this.nextV = (rh.atrial === 'sinus' || rh.continuous) ? Infinity : t + 0.12;
    }

    // Fire every event due up to time t1; mechanical/electrical QRS events go into `out`.
    // A capturing pacemaker owns the ventricles: its spikes each start a paced QRS and the
    // intrinsic ventricular events are dropped (the atria carry on — AV dissociation).
    advance(t1, rates, out) {
      this.rates = rates;
      const rh = this.rh, pz = this.pace, capture = !!(pz && pz.capture);
      if (pz && pz.fire) {
        if (this.nextP === Infinity) this.nextP = t1;
        while (this.nextP <= t1) {
          const tp = this.nextP;
          this.P.push({ t: tp }); if (this.P.length > 8) this.P.shift();
          if (capture) this.fireV(tp + 0.004, out, { mech: pz.mech, kick: 0.82 });
          this.nextP = tp + 60 / pz.rate;
        }
      } else this.nextP = Infinity;
      if (rh.continuous) return;
      const rand = this.sim.rand, hrv = this.sim.p.heart.hrv || 0;
      if (rh.atrial === 'sinus' || rh.atrial === 'indep') {
        while (this.nextA <= t1) {
          const ta = this.nextA;
          this.A.push({ t: ta }); if (this.A.length > 8) this.A.shift();
          this.lastA = ta;
          if (rh.atrial === 'sinus' && !capture) this.conduct(ta, rates.aRate);
          this.nextA = ta + (60 / Math.max(rates.aRate, 10)) * (1 + hrv * U.clamp(U.normal(rand), -3, 3));
        }
      }
      if (rh.atrial === 'sinus') {
        while (this.pending.length && this.pending[0] <= t1) { const tv = this.pending.shift(); if (!capture) this.fireV(tv, out); }
      } else {
        while (this.nextV <= t1) {
          const tv = this.nextV;
          if (!capture) this.fireV(tv, out);
          const mean = 60 / Math.max(rates.vRate, 5);
          let rr;
          if (rh.vclock === 'af') rr = Math.max(0.28, mean * (1 - AF_SPREAD / 2 + AF_SPREAD * rand()));
          else if (rh.vclock === 'escape') rr = mean * (1 + 0.01 * U.clamp(U.normal(rand), -3, 3));
          else rr = mean * (1 + 0.004 * U.clamp(U.normal(rand), -3, 3));
          this.nextV = tv + rr;
        }
      }
    }

    conduct(ta, aRate) {
      const rh = this.rh;
      if (rh.conduct === 'normal') {
        const pr = rh.pr || U.clamp(0.16 - 0.0004 * (aRate - 75), 0.11, 0.20);
        this.pending.push(ta + pr);
      } else if (rh.conduct === 'wenckebach') {
        const n = rh.n || 4, k = this.k % n;
        if (k < n - 1) this.pending.push(ta + [0.20, 0.30, 0.36, 0.40, 0.43][Math.min(k, 4)]);
        this.k++;
      } else if (rh.conduct === 'mobitz2') {
        const n = rh.n || 2;
        if (this.k % n === 0) this.pending.push(ta + 0.16);
        this.k++;
      }
    }

    // ov: a paced beat { mech, kick } instead of the intrinsic rhythm's own
    fireV(tv, out, ov) {
      const rh = this.rh;
      const rr = this.lastV != null ? Math.max(0.2, tv - this.lastV) : 60 / Math.max(this.rates.vRate, 5);
      let kick = ov ? ov.kick : rh.kick;
      if ((ov || rh.atrial === 'indep') && this.lastA != null) {
        // AV dissociation: the atrium only helps when its contraction lands just before the QRS
        const pv = tv - this.lastA;
        kick = (pv > 0.08 && pv < 0.30) ? 1.0 : 0.82;
      }
      const ev = ov ? { t: tv, rr, mech: !!ov.mech, kick: ov.mech ? kick : 0, qrs: 'paced' } : { t: tv, rr, mech: !!rh.mech, kick, qrs: rh.qrs };
      this.lastV = tv;
      this.V.push(ev); if (this.V.length > 8) this.V.shift();
      out.push(ev);
    }

    // Lead-II-like ECG, mV: the rhythm, plus pacing spikes and the defibrillator's artefact.
    ecg(t) {
      let v = this.ecgRhythm(t);
      for (let i = 0; i < this.P.length; i++) { const s = t - this.P[i].t; if (s > -0.01 && s < 0.02) v += 1.6 * U.gauss(s, 0, 0.0035); }
      if (this.shockT != null) {
        const s = t - this.shockT;   // amplifier saturates, then recovers from a deep offset
        if (s >= 0 && s < 3) v += s < 0.06 ? 4 : -1.1 * Math.exp(-(s - 0.06) / 0.4);
      }
      return v;
    }
    ecgRhythm(t) {
      const rh = this.rh, g = U.gauss;
      // VF coarsens to fine VF as the myocardium runs out of oxygen
      const vfAmp = 1 - 0.7 * U.clamp((this.sim.hypox || 0) / 1.5, 0, 1);
      if (rh.continuous === 'vf') return vfAmp * (0.42 * Math.sin(t * 18.3) + 0.30 * Math.sin(t * 27.7 + 1) + 0.20 * Math.sin(t * 41.1 + 2) + 0.10 * Math.sin(t * 5.3)) + 0.06 * U.hashNoise(t * 40);
      if (rh.continuous === 'torsades') return Math.sin(t * 15.5) * (0.22 + 0.78 * Math.abs(Math.sin(t * 1.15)));
      let v = 0.006 * U.hashNoise(t * 60);
      if (rh.continuous === 'asystole') v = 0.015 * Math.sin(t * 1.7) + 0.006 * U.hashNoise(t * 30);
      if (rh.atrial === 'fib') v += 0.045 * Math.sin(t * 33) + 0.03 * Math.sin(t * 51 + 0.4) + 0.015 * Math.sin(t * 23 + 1.3);
      for (let i = 0; i < this.A.length; i++) { const s = t - this.A[i].t; if (s > -0.02 && s < 0.2) v += 0.11 * g(s, 0.05, 0.02); }
      for (let i = 0; i < this.V.length; i++) { const b = this.V[i], s = t - b.t; if (s > -0.05 && s < 1.0) v += this.complex(s, b); }
      return v;
    }

    // One QRS-T complex, s = seconds after QRS onset. T-wave timing scales with √RR (QT).
    complex(s, b) {
      const g = U.gauss, rq = Math.sqrt(U.clamp(b.rr, 0.3, 1.6)), tp = 0.04 + 0.23 * rq;
      if (b.qrs === 'wide') return 0.9 * g(s, 0.07, 0.032) - 0.5 * g(s, 0.16, 0.035) - 0.3 * g(s, tp + 0.08, 0.06 * rq);
      if (b.qrs === 'paced') return 1.05 * g(s, 0.06, 0.03) - 0.6 * g(s, 0.15, 0.04) - 0.35 * g(s, tp + 0.1, 0.07 * rq);
      if (b.qrs === 'stemi') return -0.12 * g(s, 0.022, 0.009) + 0.86 * g(s, 0.04, 0.010) - 0.07 * g(s, 0.068, 0.010)
        + 0.30 * g(s, 0.04 + 0.5 * (tp - 0.04), 0.07 * rq) + 0.34 * g(s, tp, 0.05 * rq);
      return -0.10 * g(s, 0.022, 0.008) + 1.0 * g(s, 0.04, 0.010) - 0.22 * g(s, 0.066, 0.010) + 0.25 * g(s, tp, 0.045 * rq);
    }
  }
  R.Heart = Heart;
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));

/* ---- 20-circulation.js ---- */
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

/* ---- 30-lungs.js ---- */
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

/* ---- 40-gas.js ---- */
/* RESUS Sim v2 engine — gas exchange.
 *
 * Oxygen
 *   Alveolar O2 is a store (FRC + PEEP volume) filled by alveolar ventilation and
 *   emptied by blood uptake:   VL·dFAO2/dt = VA·(FiO2 − FAO2) − uptake
 *   At steady state this reduces to the alveolar gas equation (PAO2 ≈ PiO2 − PaCO2/0.8);
 *   in apnoea the store drains, so desaturation time depends on pre-oxygenation and FRC.
 *   Arterial content = end-capillary blood mixed with venous admixture:
 *     - true shunt (ARDS, consolidation, oedema) — does NOT improve with FiO2; PEEP recruits
 *       the recruitable fraction;
 *     - low V/Q units (COPD, asthma) — behave like shunt on room air, vanish as FiO2 rises.
 *   Mixed venous content follows Fick (Ca − VO2/CO) with a circulation lag, so a low
 *   cardiac output deepens hypoxaemia when shunt is present.
 *   SpO2 is the arterial saturation delayed by lung-to-finger transit and averaging.
 *
 * Carbon dioxide
 *   One body store:  K·dPaCO2/dt = VCO2 − VA·PETCO2/0.863
 *   PETCO2 = PaCO2·(1 − alveolar dead-space fraction). Dead space rises with pathology
 *   (PE, COPD), over-distension, and LOW PULMONARY BLOOD FLOW — so EtCO2 falls in shock,
 *   approaches zero in arrest, and surges at ROSC as stored CO2 washes out.
 */
(function (R) {
  'use strict';
  const U = R.util;
  const PH2O_ADJ = 713;     // (760 − 47) mmHg
  const BTPS = 1.21;        // STPD → BTPS volume factor at 37 °C

  const sat = (po2) => { const p = Math.max(po2, 0.1); return 1 / (23400 / (p * p * p + 150 * p) + 1); };   // Severinghaus
  const content = (po2, hb) => 1.34 * hb * sat(po2) + 0.003 * po2;                                             // mL O2/dL
  const po2FromContent = (c, hb) => {
    let lo = 0.1, hi = 760;
    for (let i = 0; i < 40; i++) { const mid = 0.5 * (lo + hi); if (content(mid, hb) < c) lo = mid; else hi = mid; }
    return 0.5 * (lo + hi);
  };

  class Gas {
    constructor(sim) {
      this.sim = sim;
      this.fa = 0.14;        // alveolar O2 fraction
      this.paco2 = 40;
      this.cv = 15;          // mixed venous O2 content, mL/dL
      this.va = 4.2;         // alveolar ventilation estimate, L/min
      this.etAlv = 38;       // mixed alveolar PCO2 (end-tidal target), mmHg
      this.pao2 = 95; this.sao2 = 0.97; this.qva = 0.03; this.fds = 0.05; this.vo2 = 245; this.vco2 = 196;
      this.satRing = new U.Ring(80, 0.97);   // 0.5 s spacing → 40 s of history
      this.spo2 = 97; this.ringClock = 0;
    }

    // Put the stores at their steady state for the current inputs (start of a scenario).
    prime(inp) {
      this.va = inp.va;
      for (let i = 0; i < 4000; i++) this.update(1.0, inp, true);
      this.satRing.fill(this.sao2);
      this.spo2 = this.sao2 * 100;
    }

    // dt in seconds. inp: { fio2 (0–1), va (L/min), co (L/min), shunt, vq, ds, vo2, vco2, hb, vl (L), k (mL/mmHg) }
    update(dt, inp, priming) {
      const speed = priming ? 1 : (inp.speed || 1);
      const dtMin = dt / 60 * speed;
      const fi = U.clamp(inp.fio2, 0.21, 1);
      const qva = U.clamp(inp.shunt + inp.vq * U.clamp(1 - (fi - 0.21) / 0.4, 0, 1), 0, 0.95);
      const pAO2 = this.fa * PH2O_ADJ;
      const ccp = content(pAO2, inp.hb);
      const ca = (1 - qva) * ccp + qva * this.cv;
      const pao2 = po2FromContent(ca, inp.hb);
      const co = Math.max(inp.co, 0);
      // alveolar O2 store
      const uptake = co * (1 - qva) * 10 * Math.max(ccp - this.cv, 0);   // mL/min STPD
      this.fa += dtMin * (inp.va * (fi - this.fa) - uptake * BTPS / 1000) / Math.max(inp.vl, 0.3);
      this.fa = U.clamp(this.fa, 0.005, fi);
      // mixed venous O2 (Fick), slower when the circulation is slow
      const cvTarget = Math.max(ca - inp.vo2 / (10 * Math.max(co, 0.3)), 0.5);
      const tauV = U.clamp(0.5 * 5 / Math.max(co, 0.5), 0.3, 5);   // min
      this.cv += (cvTarget - this.cv) * Math.min(1, dtMin / tauV);
      // CO2
      const perfDS = Math.pow(U.clamp(1 - co / inp.coFull, 0, 1), 1.4);
      const fds = 1 - (1 - inp.ds) * (1 - perfDS);
      this.etAlv = this.paco2 * (1 - fds);
      const elim = inp.va * this.etAlv / 0.863;   // mL/min
      this.paco2 = U.clamp(this.paco2 + dtMin * (inp.vco2 - elim) / inp.k, 5, 200);
      this.pao2 = pao2; this.sao2 = sat(pao2); this.qva = qva; this.fds = fds; this.ca = ca;
      this.vo2 = inp.vo2; this.vco2 = inp.vco2; this.pAO2 = pAO2;
      if (priming) return;
      // pulse oximeter: lung-to-finger delay (longer in low flow) then ~4 s averaging
      this.ringClock += dt;
      while (this.ringClock >= 0.5) { this.ringClock -= 0.5; this.satRing.push(this.sao2); }
      const delay = U.clamp(6 * 5 / Math.max(co, 1), 5, 25);
      const delayed = this.satRing.ago(delay / 0.5);
      this.spo2 += (delayed * 100 - this.spo2) * Math.min(1, dt / 4);
    }

    svo2() { return sat(po2FromContent(this.cv, this.sim.pe.metabolism.hb)); }
  }

  R.Gas = Gas;
  R.gasMath = { sat, content, po2FromContent };
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));

/* ---- 45-volume.js ---- */
/* RESUS Sim v2 engine — intravascular volume, fluids and haemoglobin.
 *
 * Blood volume is live state, not a fixed setting:
 *   - bags run in over minutes (crystalloid, packed red cells);
 *   - crystalloid leaves the circulation for the tissues: about a quarter stays
 *     intravascular at equilibrium (τ ≈ 20 min), less when capillaries leak;
 *   - bleeding removes whole blood; capillary leak removes plasma (haemoconcentration);
 *   - haemoglobin follows red-cell mass ÷ volume, so crystalloid dilutes and blood raises it.
 * The instructor's blood-volume / Hb settings remain the baseline: moving them shifts the
 * live state by the same amount instead of discarding what has been given or lost.
 */
(function (R) {
  'use strict';

  R.FLUIDS = {
    crystalloid: { label: 'Crystalloid', hb: 0, crystalloid: true },
    blood:       { label: 'Packed red cells', hb: 20, crystalloid: false },   // 1 unit ≈ 300 mL, Hct ~60 %
  };
  const MIN_BV = 800;

  class Volume {
    constructor(sim) { this.sim = sim; this.reset(); }

    reset() {
      const p = this.sim.p, k = this.sim.k;
      this.base = k.bv;                        // instructor setting last applied
      this.bv = k.bv;                          // actual intravascular volume, mL
      this.hbBase = p.metabolism.hb;
      this.rbc = p.metabolism.hb * this.bv / 100;   // red-cell mass as grams of haemoglobin
      this.crysIV = 0; this.crysISF = 0;       // crystalloid still in vessels / moved to tissues
      this.bags = []; this.given = 0; this.lost = 0;
    }

    // The instructor moved the blood-volume or Hb setting: shift the live state by that amount.
    syncBaseline() {
      const p = this.sim.p, k = this.sim.k;
      if (Math.abs(k.bv - this.base) > 0.5) {
        const d = k.bv - this.base, hb = this.hb();
        this.base = k.bv;
        this.bv = Math.max(MIN_BV, this.bv + d);
        this.rbc = Math.max(0, this.rbc + d * hb / 100);
      }
      if (Math.abs(p.metabolism.hb - this.hbBase) > 1e-6) {
        this.hbBase = p.metabolism.hb;
        this.rbc = p.metabolism.hb * this.bv / 100;
      }
    }

    hb() { return this.bv > 0 ? 100 * this.rbc / this.bv : 0; }

    give(type, mL, minutes) {
      const f = R.FLUIDS[type];
      if (!f || !(mL > 0)) return null;
      const bag = { type, total: mL, left: mL, rate: mL / Math.max(minutes || 1, 0.25) };   // mL/min
      this.bags.push(bag);
      return bag;
    }
    stopBags() { this.bags = []; }

    // dt seconds; bleed = whole blood mL/min, leak = plasma to tissues mL/min (from events)
    step(dt, bleed, leak) {
      const dm = dt / 60;
      for (const b of this.bags) {
        const a = Math.min(b.left, b.rate * dm);
        b.left -= a; this.bv += a; this.given += a;
        const f = R.FLUIDS[b.type];
        if (f.crystalloid) this.crysIV += a; else this.rbc += a * f.hb / 100;
      }
      if (this.bags.length) this.bags = this.bags.filter((b) => b.left > 0.01);
      const retain = leak > 0 ? 0.15 : 0.25;
      const flux = (this.crysIV - retain * (this.crysIV + this.crysISF)) * Math.min(1, dm / 20);
      this.crysIV -= flux; this.crysISF += flux; this.bv -= flux;
      if (bleed > 0) {
        const a = Math.min(bleed * dm, this.bv - MIN_BV);
        if (a > 0) { const f = a / this.bv; this.rbc -= this.rbc * f; this.crysIV -= this.crysIV * f; this.bv -= a; this.lost += a; }
      }
      if (leak > 0) {
        const a = Math.min(leak * dm, this.bv - MIN_BV);
        if (a > 0) { this.bv -= a; this.crysISF += a; }
      }
      this.bv = Math.max(MIN_BV, this.bv);
    }

    export() {
      return { bv: this.bv, base: this.base, rbc: this.rbc, hbBase: this.hbBase, crysIV: this.crysIV, crysISF: this.crysISF,
               bags: this.bags.map((b) => Object.assign({}, b)), given: this.given, lost: this.lost };
    }
    import(s) {
      if (!s) return;
      Object.assign(this, s);
      this.bags = (s.bags || []).map((b) => Object.assign({}, b));
    }
  }
  R.Volume = Volume;
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));

/* ---- 46-drugs.js ---- */
/* RESUS Sim v2 engine — drugs (bolus and infusion).
 *
 * One effect model for every drug, defined by data:
 *   level   in the drug's infusion units (e.g. mcg/kg/min). An infusion holds the level at its
 *           rate; a bolus adds dose ÷ τoff to a store that decays with τoff (IM doses first
 *           absorb from a depot). The effect-site level lags with τon.
 *   effect  E = level^n / (level^n + EC50^n)
 *   actions each channel coefficient c changes the patient by (1 + c·E):
 *     svr (arteriolar tone) · vu (venous capacitance, >0 venodilates) · ct (contractility)
 *     hr · pvr · effort (respiratory drive; −1 = paralysis) · baro (reflex gain)
 *     relief (bronchodilation 0–1) · leakBlock (mast-cell / mediator suppression 0–1)
 *     hrAdd (vagolytic bpm, added) · avBlock (transient AV-node block, adenosine)
 * Doses and time constants are typical adult teaching values, not prescribing guidance.
 */
(function (R) {
  'use strict';
  const U = R.util;

  R.DRUGS = {
    noradrenaline: { label: 'Noradrenaline', group: 'Vasoactive infusions', rate: { unit: 'mcg/kg/min', min: 0, max: 1, step: 0.01 }, perKg: true,
                     ec50: 0.15, n: 1.2, ton: 1.5, toff: 2, fx: { svr: 1.4, vu: -0.25, ct: 0.15, hr: 0.05 } },
    adrenaline:    { label: 'Adrenaline', group: 'Vasoactive infusions', rate: { unit: 'mcg/kg/min', min: 0, max: 0.5, step: 0.01 }, perKg: true,
                     ec50: 0.08, n: 1, ton: 1, toff: 2, fx: { ct: 0.6, hr: 0.35, svr: 0.8, vu: -0.2, relief: 0.85, leakBlock: 0.9 },
                     bolusUnit: 'mcg', bolus: [{ label: '10 mcg IV', dose: 10 }, { label: '50 mcg IV', dose: 50 }, { label: '0.5 mg IM', dose: 500, absorb: 5 }, { label: '1 mg IV', dose: 1000 }] },
    vasopressin:   { label: 'Vasopressin', group: 'Vasoactive infusions', rate: { unit: 'U/min', min: 0, max: 0.06, step: 0.01 },
                     ec50: 0.02, n: 1, ton: 2, toff: 10, fx: { svr: 0.8, vu: -0.1 } },
    phenylephrine: { label: 'Phenylephrine', group: 'Vasoactive infusions', rate: { unit: 'mcg/kg/min', min: 0, max: 3, step: 0.1 }, perKg: true,
                     ec50: 0.5, n: 1, ton: 1, toff: 5, fx: { svr: 1.2, vu: -0.2 },
                     bolusUnit: 'mcg', bolus: [{ label: '100 mcg IV', dose: 100 }, { label: '200 mcg IV', dose: 200 }] },
    dobutamine:    { label: 'Dobutamine', group: 'Vasoactive infusions', rate: { unit: 'mcg/kg/min', min: 0, max: 20, step: 1 }, perKg: true,
                     ec50: 6, n: 1, ton: 2, toff: 3, fx: { ct: 0.9, hr: 0.2, svr: -0.15 } },
    gtn:           { label: 'GTN (nitroglycerin)', group: 'Vasoactive infusions', rate: { unit: 'mcg/min', min: 0, max: 200, step: 5 },
                     ec50: 60, n: 1, ton: 2, toff: 3, fx: { vu: 0.25, svr: -0.15, pvr: -0.1 } },
    propofol:      { label: 'Propofol', group: 'Induction & sedation', rate: { unit: 'mcg/kg/min', min: 0, max: 200, step: 10 }, perKg: true,
                     ec50: 80, n: 1.5, ton: 1, toff: 6, fx: { svr: -0.45, vu: 0.15, ct: -0.15, effort: -1, baro: -0.7 },
                     bolusUnit: 'mcg/kg', bolus: [{ label: '1 mg/kg', dose: 1000 }, { label: '1.5 mg/kg', dose: 1500 }, { label: '2 mg/kg', dose: 2000 }] },
    ketamine:      { label: 'Ketamine', group: 'Induction & sedation', perKg: true, ec50: 0.12, n: 1, ton: 1, toff: 10,
                     fx: { hr: 0.25, svr: 0.2, effort: -0.3, relief: 0.4 },
                     bolusUnit: 'mg/kg', bolus: [{ label: '1 mg/kg', dose: 1 }, { label: '1.5 mg/kg', dose: 1.5 }, { label: '2 mg/kg', dose: 2 }] },
    etomidate:     { label: 'Etomidate', group: 'Induction & sedation', perKg: true, ec50: 0.03, n: 1.5, ton: 0.7, toff: 5,
                     fx: { effort: -1, svr: -0.05 }, bolusUnit: 'mg/kg', bolus: [{ label: '0.3 mg/kg', dose: 0.3 }] },
    fentanyl:      { label: 'Fentanyl', group: 'Induction & sedation', perKg: true, ec50: 0.07, n: 1, ton: 1.5, toff: 30,
                     fx: { effort: -0.6, hr: -0.12, baro: -0.3, svr: -0.08 },
                     bolusUnit: 'mcg/kg', bolus: [{ label: '1 mcg/kg', dose: 1 }, { label: '2 mcg/kg', dose: 2 }, { label: '3 mcg/kg', dose: 3 }] },
    midazolam:     { label: 'Midazolam', group: 'Induction & sedation', ec50: 0.04, n: 1, ton: 2, toff: 60,
                     fx: { effort: -0.5, svr: -0.1 }, bolusUnit: 'mg', bolus: [{ label: '2 mg', dose: 2 }, { label: '5 mg', dose: 5 }] },
    rocuronium:    { label: 'Rocuronium', group: 'Neuromuscular blockade', perKg: true, ec50: 0.006, n: 3, ton: 0.8, toff: 45,
                     fx: { effort: -1 }, bolusUnit: 'mg/kg', bolus: [{ label: '0.6 mg/kg', dose: 0.6 }, { label: '1.2 mg/kg', dose: 1.2 }] },
    suxamethonium: { label: 'Suxamethonium', group: 'Neuromuscular blockade', perKg: true, ec50: 0.05, n: 3, ton: 0.5, toff: 6,
                     fx: { effort: -1 }, bolusUnit: 'mg/kg', bolus: [{ label: '1.5 mg/kg', dose: 1.5 }] },
    atropine:      { label: 'Atropine', group: 'Rate & rhythm', ec50: 0.012, n: 1, ton: 1, toff: 40,
                     fx: { hrAdd: 40 }, bolusUnit: 'mg', bolus: [{ label: '0.6 mg', dose: 0.6 }, { label: '1 mg', dose: 1 }] },
    adenosine:     { label: 'Adenosine', group: 'Rate & rhythm', ec50: 62, n: 2, ton: 0.02, toff: 0.096,
                     fx: { avBlock: 1 }, bolusUnit: 'mg', bolus: [{ label: '6 mg', dose: 6 }, { label: '12 mg', dose: 12 }] },
    // antiarrhythmic: raises the chance a shock terminates VF / pulseless VT (read in 48-resus.js)
    amiodarone:    { label: 'Amiodarone', group: 'Rate & rhythm', ec50: 1.5, n: 1, ton: 2, toff: 60,
                     fx: { hr: -0.1, svr: -0.1, ct: -0.05 }, bolusUnit: 'mg', bolus: [{ label: '300 mg IV', dose: 300 }, { label: '150 mg IV', dose: 150 }] },
    salbutamol:    { label: 'Salbutamol', group: 'Airway', ec50: 0.08, n: 1, ton: 3, toff: 30,
                     fx: { relief: 0.7, hr: 0.15 }, bolusUnit: 'mg', bolus: [{ label: '5 mg nebuliser', dose: 5 }] },
  };
  const MULT = ['svr', 'vu', 'ct', 'hr', 'pvr', 'effort', 'baro'];
  const hill = (x, ec, n) => { if (x <= 0) return 0; const a = Math.pow(x, n || 1); return a / (a + Math.pow(ec, n || 1)); };

  class Pharm {
    constructor(sim) { this.sim = sim; this.s = {}; }
    st(id) { return this.s[id] || (this.s[id] = { rate: 0, b: 0, e: 0, dep: [] }); }

    setRate(id, rate) {
      const D = R.DRUGS[id];
      if (!D || !D.rate) return null;
      const r = U.clamp(+rate || 0, D.rate.min, D.rate.max);
      this.st(id).rate = +r.toFixed(4);
      return this.st(id).rate;
    }
    // dose in the drug's bolusUnit; absorb (min) for IM / nebulised routes
    bolus(id, dose, absorb) {
      const D = R.DRUGS[id];
      if (!D || !(dose > 0)) return false;
      const unit = D.bolusUnit || '';
      const amount = (D.perKg && !/\/kg$/.test(unit)) ? dose / this.sim.p.patient.weightKg : dose;
      this.st(id).dep.push({ inc: amount / D.toff, tabs: Math.max(absorb || 0.01, 0.005) });   // IV ≈ 0.6 s
      return true;
    }
    stopAll() { for (const id in this.s) this.s[id].rate = 0; }

    step(dt) {
      const dm = dt / 60;
      // delivery from the injection site needs blood flow: in arrest an IV drug only reaches the heart
      // once compressions (or a returned circulation) move it — "flush and compress"
      const flow = U.clamp((this.sim.coMeas || 0) / 1.5, 0, 1);
      for (const id in this.s) {
        const D = R.DRUGS[id], st = this.s[id];
        for (const d of st.dep) { const tr = d.inc * (1 - Math.exp(-dm * flow / d.tabs)); d.inc -= tr; st.b += tr; }
        if (st.dep.length) st.dep = st.dep.filter((d) => d.inc > 1e-9);
        st.b *= Math.exp(-dm / D.toff);
        st.e += (st.rate + st.b - st.e) * (1 - Math.exp(-dm / D.ton));
        if (!st.rate && !st.dep.length && st.b < 1e-7 && st.e < 1e-7) delete this.s[id];
      }
    }

    effect(id) { const st = this.s[id], D = R.DRUGS[id]; return st ? hill(st.e, D.ec50, D.n) : 0; }

    effects() {
      const M = { svr: 1, vu: 1, ct: 1, hr: 1, pvr: 1, effort: 1, baro: 1, relief: 0, leakBlock: 0, hrAdd: 0, avBlock: 0 };
      for (const id in this.s) {
        const D = R.DRUGS[id], E = hill(this.s[id].e, D.ec50, D.n);
        if (E <= 0) continue;
        for (const ch in D.fx) {
          const c = D.fx[ch];
          if (MULT.includes(ch)) M[ch] *= Math.max(0.02, 1 + c * E);
          else if (ch === 'relief' || ch === 'leakBlock') M[ch] = 1 - (1 - M[ch]) * (1 - U.clamp(c * E, 0, 1));
          else if (ch === 'hrAdd') M.hrAdd += c * E;
          else if (ch === 'avBlock') M.avBlock = Math.max(M.avBlock, c * E);
        }
      }
      return M;
    }

    // what is running / still acting, for the UI
    summary() {
      const out = [];
      for (const id in this.s) {
        const D = R.DRUGS[id], st = this.s[id], E = hill(st.e, D.ec50, D.n);
        if (st.rate > 0 || E > 0.02) out.push({ id, label: D.label, rate: st.rate, unit: D.rate ? D.rate.unit : '', effect: E, infusing: st.rate > 0 });
      }
      return out;
    }

    export() { return JSON.parse(JSON.stringify(this.s)); }
    import(s) { this.s = s ? JSON.parse(JSON.stringify(s)) : {}; }
  }
  R.Pharm = Pharm;
  R.drugMath = { hill };
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));

/* ---- 47-events.js ---- */
/* RESUS Sim v2 engine — clinical events.
 *
 * An event ramps in with its own onset time constant (ton, s) toward its severity (0–1),
 * changes the patient through the same channels as drugs, and ramps out (toff, s) when it
 * is resolved — by its treatment action (needle decompression, pericardiocentesis, suction…)
 * or by the instructor ending it. Anaphylaxis is also damped by drugs that suppress the
 * mediator response (adrenaline), so giving adrenaline is what turns it around.
 *
 * fx(L, M, flows, ctx): L = current level (0–sev); M = modifier channels (multiply or add);
 * flows.bleed / flows.leak in mL/min.
 */
(function (R) {
  'use strict';
  const U = R.util;

  R.EVENTS = {
    anaphylaxis:   { label: 'Anaphylaxis', group: 'Circulation', sev: 0.8, ton: 90, toff: 180, actions: [],
                     fx(L, M, F, c) { const e = L * (1 - 0.85 * c.drugs.leakBlock); M.svr *= 1 - 0.7 * e; M.vu *= 1 + 0.3 * e;
                       M.spasm += 15 * e; M.vq += 0.1 * e; F.leak += 220 * e * Math.exp(-c.elapsed / 600); } },
    haemorrhage:   { label: 'Ongoing haemorrhage', group: 'Circulation', sev: 0.6, ton: 5, toff: 5, actions: [{ id: 'control', label: 'Control the bleeding' }],
                     fx(L, M, F) { F.bleed += 150 * L; } },
    tension:       { label: 'Tension pneumothorax', group: 'Circulation', sev: 1, ton: 90, toff: 10, actions: [{ id: 'decompress', label: 'Needle decompression' }],
                     fx(L, M) { M.ppl += 16 * L; M.compliance *= 1 - 0.5 * L; M.shunt += 0.3 * L; M.vobs *= 1 + 0.6 * L; } },
    tamponade:     { label: 'Cardiac tamponade', group: 'Circulation', sev: 0.9, ton: 180, toff: 15, actions: [{ id: 'drain', label: 'Pericardiocentesis' }],
                     fx(L, M) { M.peri += 16 * L; } },
    pe:            { label: 'Massive pulmonary embolism', group: 'Circulation', sev: 0.8, ton: 30, toff: 600, actions: [{ id: 'lyse', label: 'Thrombolysis' }],
                     fx(L, M) { M.pvr *= 1 + 5 * L; M.ctR *= 1 - 0.35 * L; M.ds += 0.3 * L; M.shunt += 0.1 * L; } },
    ardsWorsening: { label: 'Worsening lung injury (ARDS)', group: 'Airway & ventilator', sev: 0.7, ton: 240, toff: 600, actions: [],
                     fx(L, M) { M.shunt += 0.4 * L; M.compliance *= 1 - 0.4 * L; M.ds += 0.12 * L; } },
    bronchospasm:  { label: 'Bronchospasm', group: 'Airway & ventilator', sev: 0.7, ton: 60, toff: 90, actions: [],
                     fx(L, M) { M.spasm += 35 * L; M.vq += 0.15 * L; } },
    ettObstruction:{ label: 'ETT obstruction', group: 'Airway & ventilator', sev: 0.6, ton: 5, toff: 3, actions: [{ id: 'suction', label: 'Suction / change tube' }],
                     fx(L, M) { M.rawAdd += L >= 0.95 ? 600 : 50 * L; } },
    mainstem:      { label: 'Right main-bronchus intubation', group: 'Airway & ventilator', sev: 1, ton: 2, toff: 3, actions: [{ id: 'withdraw', label: 'Withdraw tube 2 cm' }],
                     fx(L, M) { M.compliance *= 1 - 0.45 * L; M.shunt += 0.3 * L; M.rawAdd += 3 * L; } },
    oesophageal:   { label: 'Oesophageal intubation', group: 'Airway & ventilator', sev: 1, ton: 1, toff: 1, actions: [{ id: 'reintubate', label: 'Re-intubate' }], airway: true,
                     fx(L, M) { if (L > 0.5) M.airway = 'esophageal'; } },
    disconnection: { label: 'Circuit disconnection', group: 'Airway & ventilator', sev: 1, ton: 1, toff: 1, actions: [{ id: 'reconnect', label: 'Reconnect circuit' }], airway: true,
                     fx(L, M) { if (L > 0.5) M.airway = 'disconnected'; } },
    extubation:    { label: 'Unplanned extubation', group: 'Airway & ventilator', sev: 1, ton: 1, toff: 1, actions: [{ id: 'reintubate', label: 'Re-intubate' }], airway: true,
                     fx(L, M) { if (L > 0.5) M.airway = 'extubated'; } },
  };

  class Events {
    constructor(sim) { this.sim = sim; this.list = []; this.n = 0; }

    // One live instance per event type: starting it again just changes the severity.
    start(id, sev) {
      const E = R.EVENTS[id];
      if (!E) return null;
      const s = U.clamp(sev != null ? +sev : E.sev, 0.05, 1);
      const live = this.list.find((e) => e.id === id && e.tEnd == null);
      if (live) { live.sev = s; return live.uid; }
      const ev = { uid: id + '-' + (++this.n), id, sev: s, t0: this.sim.t, tEnd: null, L: 0 };
      this.list.push(ev);
      return ev.uid;
    }
    // End an event by type or uid (instructor "end event").
    resolve(key) {
      let n = 0;
      for (const e of this.list) if ((e.id === key || e.uid === key) && e.tEnd == null) { e.tEnd = this.sim.t; n++; }
      return n;
    }
    // A treatment action resolves every live event it applies to; returns how many it fixed.
    action(actionId) {
      let n = 0;
      for (const e of this.list) {
        if (e.tEnd != null) continue;
        if ((R.EVENTS[e.id].actions || []).some((a) => a.id === actionId)) { e.tEnd = this.sim.t; n++; }
      }
      return n;
    }

    step(dt) {
      for (const e of this.list) {
        const E = R.EVENTS[e.id], on = e.tEnd == null;
        e.L += ((on ? e.sev : 0) - e.L) * (1 - Math.exp(-dt / (on ? E.ton : E.toff)));
      }
      if (this.list.length) this.list = this.list.filter((e) => e.tEnd == null || e.L > 0.004);
    }

    apply(M, drugs) {
      const F = { bleed: 0, leak: 0 };
      for (const e of this.list) R.EVENTS[e.id].fx(e.L, M, F, { drugs, elapsed: this.sim.t - e.t0 });
      return F;
    }

    summary() {
      return this.list.map((e) => {
        const E = R.EVENTS[e.id];
        return { uid: e.uid, id: e.id, label: E.label, level: e.L, sev: e.sev, elapsed: this.sim.t - e.t0, ending: e.tEnd != null, actions: E.actions || [] };
      });
    }

    // times travel as ages: every screen's simulation clock started at a different moment
    export() {
      const t = this.sim.t;
      return { n: this.n, list: this.list.map((e) => ({ uid: e.uid, id: e.id, sev: e.sev, L: e.L, age: t - e.t0, endAge: e.tEnd == null ? null : t - e.tEnd })) };
    }
    import(s) {
      if (!s) return;
      const t = this.sim.t;
      this.n = s.n || 0;
      this.list = (s.list || []).map((e) => ({ uid: e.uid, id: e.id, sev: e.sev, L: e.L, t0: t - e.age, tEnd: e.endAge == null ? null : t - e.endAge }));
    }
  }
  R.Events = Events;
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));

/* ---- 48-resus.js ---- */
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

/* ---- 50-sim.js ---- */
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

/* ---- 60-scenarios.js ---- */
/* RESUS Sim v2 engine — scenario library.
 *
 * In v2 a preset sets the patient's PHYSIOLOGY (volume, vascular tone, contractility,
 * lung mechanics, shunt…) and the engine works out the monitor numbers. Each preset
 * carries `expect`: the ranges the measured vitals should settle into. Those ranges come
 * from v1's preset numbers (the shock CO/SVR/CVP triads) and standard clinical values,
 * and the validation tests check every preset against them — so a model change that
 * breaks a teaching scenario fails the build.
 *
 * Ventilator presets reuse v1's settings. v1's resistance was the TOTAL seen by the
 * ventilator; here lungs.resistance is the patient's airways and the ETT adds 5.
 *
 * expect keys are paths into sim.vitals ('abp.sys', 'vent.pip', 'co' …): [min, max].
 */
(function (R) {
  'use strict';
  const U = R.util;

  const SEDATED = { breathing: { effort: 0 } };
  const vent = (v, lungs, extra) => U.deepMerge(U.deepMerge({ vent: v, lungs }, SEDATED), extra || {});

  R.SCENARIOS = [
    // ---------------- haemodynamic ----------------
    { id: 'normal', group: 'hemo', label: 'Healthy / normal baseline', v1: 'Healthy / normal baseline',
      params: {},
      expect: { hr: [68, 88], 'abp.sys': [105, 135], 'abp.dia': [60, 85], 'abp.map': [80, 100], co: [4.5, 6.8], cvp: [1, 8], spo2: [95, 100], paco2: [35, 45], etco2: [32, 43], rr: [12, 16] },
      notes: 'Reference patient. Dicrotic notch on the arterial line, a/c/v waves on the CVP.' },

    { id: 'septic', group: 'hemo', label: 'Septic shock', v1: 'Septic shock',
      params: { heart: { rhythm: 'sinustach', hr: 75, contractility: 0.85 }, vessels: { svr: 330 }, volume: { venousTone: 1.10 },
        metabolism: { vo2Factor: 1.3 }, lungs: { shunt: 0.15, deadSpace: 0.12 }, breathing: { rate: 28, effort: 9 } },
      expect: { hr: [110, 135], 'abp.sys': [80, 105], 'abp.dia': [32, 52], 'abp.map': [50, 68], co: [6.5, 9.5], svr: [400, 720], cvp: [2, 9], spo2: [89, 96], etco2: [20, 32] },
      notes: 'Vasodilated, hyperdynamic: wide pulse pressure, low diastolic, high CO / low SVR, warm periphery (high PI).' },

    { id: 'cardiogenic', group: 'hemo', label: 'Cardiogenic shock', v1: 'Cardiogenic shock',
      params: { heart: { rhythm: 'sinustach', hr: 85, contractility: 0.27, rvContractility: 0.5 }, lungs: { shunt: 0.06 },
        volume: { bloodVolume: 4550 * 1.12, venousTone: 0.9 },   // chronic fluid retention + neurohormonal venoconstriction
        breathing: { rate: 26, effort: 6 } },
      expect: { hr: [105, 135], 'abp.sys': [78, 100], 'abp.map': [62, 82], co: [2.6, 4.2], svr: [1200, 2000], cvp: [13, 22], pcwp: [20, 35], spo2: [86, 94] },
      notes: 'Pump failure: narrow pulse pressure, high SVR, raised CVP and wedge, pulmonary oedema widens the shunt.' },

    { id: 'haemorrhagic', group: 'hemo', label: 'Haemorrhagic shock', v1: 'Haemorrhagic shock',
      params: { volume: { bloodVolume: 4550 * 0.67 }, heart: { rhythm: 'sinustach', hr: 80 }, breathing: { rate: 24, effort: 8 } },
      expect: { hr: [115, 145], 'abp.sys': [70, 92], co: [2.8, 4.4], svr: [1350, 2100], cvp: [-1, 4], spo2: [94, 100] },
      notes: '~33 % blood loss with full baroreflex compensation: tachycardia, narrow pulse pressure, low CVP. Ventilate with PPV and watch PPV/SVV climb.' },

    { id: 'pe', group: 'hemo', label: 'Obstructive — massive PE', v1: 'Obstructive (PE / tamponade)',
      params: { vessels: { pvr: 700 }, heart: { rhythm: 'sinustach', hr: 92, rvContractility: 0.5 }, lungs: { deadSpace: 0.40, shunt: 0.15 },
        volume: { venousTone: 0.8 }, breathing: { rate: 28, effort: 10 } },
      expect: { hr: [110, 140], 'abp.sys': [80, 105], co: [2.6, 4.3], cvp: [12, 22], 'pap.map': [28, 48], pcwp: [0, 12], etco2: [16, 30], spo2: [86, 95] },
      notes: 'RV pressure overload: high CVP and PA pressure, LOW wedge, wide PaCO2–EtCO2 gap (dead space).' },

    { id: 'tamponade', group: 'hemo', label: 'Obstructive — tamponade',
      params: { thorax: { pericardial: 14 }, heart: { rhythm: 'sinustach', hr: 75 }, volume: { venousTone: 0.9 }, breathing: { rate: 24, effort: 8 } },
      expect: { hr: [105, 140], 'abp.sys': [75, 100], co: [2.5, 4.4], cvp: [13, 22] },
      notes: 'Equalised diastolic pressures (CVP ≈ wedge), blunted y descent, pulsus paradoxus with spontaneous breaths.' },

    { id: 'tension', group: 'hemo', label: 'Tension pneumothorax (ventilated)',
      params: vent({ mode: 'VC', vt: 450, flow: 50, rr: 16, peep: 5, fio2: 50 }, { compliance: 25, resistance: 4, shunt: 0.30 },
        { thorax: { pplOffset: 14, venousObstruction: 1.5 }, heart: { hr: 85 } }),
      expect: { hr: [110, 150], 'abp.sys': [55, 90], cvp: [14, 26], spo2: [70, 90], 'vent.pip': [30, 50] },
      notes: 'Rising airway pressures, hypoxia, obstructive shock. Decompress (pplOffset → 0, venousObstruction → 1) and it recovers.' },

    { id: 'istemi', group: 'hemo', label: 'Inferior STEMI (RV involvement)', v1: 'Inferior STEMI',
      params: { heart: { rhythm: 'istemi', hr: 50, contractility: 0.8, rvContractility: 0.55 }, reflex: { baro: 0.4 }, breathing: { rate: 20, effort: 8 } },
      expect: { hr: [50, 64], 'abp.sys': [85, 112], cvp: [8, 16], co: [3.0, 4.8] },
      notes: 'Bradycardic with RV infarction: raised CVP with clear lungs — preload dependent (fluid helps, nitrates hurt).' },

    { id: 'respfail', group: 'hemo', label: 'Respiratory failure (spontaneous)', v1: 'Respiratory failure',
      params: { heart: { rhythm: 'sinustach', hr: 98 }, vessels: { svr: 1450 }, reflex: { baro: 0.5 }, lungs: { compliance: 40, resistance: 7, shunt: 0.14, vqMismatch: 0.15, deadSpace: 0.12 },
        metabolism: { vo2Factor: 1.25 }, breathing: { rate: 23, effort: 5.5 } },   // fatigued: the CO2 drive pushes it to ~31/min
      expect: { hr: [100, 125], 'abp.sys': [108, 145], spo2: [76, 88], paco2: [50, 68], etco2: [44, 62], rr: [30, 34] },
      notes: 'Rapid shallow breathing: high dead-space ventilation → hypercapnia; shunt + V/Q mismatch → hypoxaemia that partly responds to O2.' },

    { id: 'vf', group: 'arrest', label: 'Cardiac arrest — VF', v1: 'Cardiac arrest — VF',
      params: { heart: { rhythm: 'vf' }, breathing: { effort: 0 } }, settle: 20,
      expect: { co: [0, 0.05], 'abp.map': [6, 16], cvp: [6, 16] },
      notes: 'No output: arterial and venous pressures meet at mean systemic filling pressure; no pleth, no SpO2, EtCO2 falls to zero.' },

    { id: 'asystole', group: 'arrest', label: 'Cardiac arrest — asystole', v1: 'Cardiac arrest — asystole',
      params: { heart: { rhythm: 'asystole' }, breathing: { effort: 0 } }, settle: 20,
      expect: { co: [0, 0.05], 'abp.map': [6, 16] } },

    { id: 'pea', group: 'arrest', label: 'Cardiac arrest — PEA',
      params: { heart: { rhythm: 'pea', hr: 45 }, breathing: { effort: 0 } }, settle: 20,
      expect: { hr: [38, 52], co: [0, 0.05], 'abp.map': [6, 16] },
      notes: 'Organised complexes on the ECG (the monitor still counts a heart rate) with no pulse and no pleth.' },

    // ---------------- ventilator (v1 presets) ----------------
    { id: 'v-normal', group: 'vent', label: 'Normal lungs', v1: 'Normal lungs',
      params: vent({ mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 30 }, { compliance: 55, resistance: 3 }),
      expect: { 'vent.pip': [16, 22], 'vent.pplat': [12, 15.5], 'vent.peepi': [0, 0.5], 'vent.vte': [440, 460], spo2: [97, 100], paco2: [35, 45] } },

    { id: 'v-ards-mild', group: 'vent', label: 'ARDS — mild', v1: 'ARDS — mild',
      params: vent({ mode: 'VC', vt: 400, flow: 55, rr: 20, peep: 8, fio2: 50 }, { compliance: 45, resistance: 4, shunt: 0.18, recruitability: 0.4, ecwFrac: 0.35 }),
      expect: { 'vent.pplat': [15, 19], 'vent.dp': [8, 10], spo2: [94, 100], pf: [200, 320] } },

    { id: 'v-ards-mod', group: 'vent', label: 'ARDS — moderate', v1: 'ARDS — moderate',
      params: vent({ mode: 'VC', vt: 360, flow: 55, rr: 24, peep: 12, fio2: 70 }, { compliance: 32, resistance: 5, shunt: 0.32, recruitability: 0.5, ecwFrac: 0.3, deadSpace: 0.30 }),
      expect: { 'vent.pplat': [21, 26], 'vent.dp': [10, 13], spo2: [90, 100], pf: [100, 200], paco2: [38, 55] } },

    { id: 'v-ards-severe', group: 'vent', label: 'ARDS — severe', v1: 'ARDS — severe',
      params: vent({ mode: 'PC', pc: 18, itime: 1.0, rr: 28, peep: 15, fio2: 90 }, { compliance: 20, resistance: 7, shunt: 0.65, recruitability: 0.55, ecwFrac: 0.25, deadSpace: 0.45 }),
      expect: { 'vent.pplat': [29, 34], 'vent.vte': [280, 380], spo2: [82, 96], pf: [50, 100], paco2: [42, 70] } },

    { id: 'v-copd', group: 'vent', label: 'COPD exacerbation', v1: 'COPD exacerbation',
      params: vent({ mode: 'VC', vt: 480, flow: 70, rr: 16, peep: 6, fio2: 40 }, { compliance: 70, resistance: 21, vqMismatch: 0.25, deadSpace: 0.20 }),
      expect: { 'vent.pip': [38, 50], 'vent.pplat': [14, 20], 'vent.peepi': [1, 4], spo2: [90, 100] },
      notes: 'High compliance, high resistance: long expiratory time constant; expiratory flow still running when the next breath starts. Rate 16 (v1: 12) so the air trapping is visible.' },

    { id: 'v-asthma', group: 'vent', label: 'Status asthmaticus', v1: 'Status asthmaticus',
      params: vent({ mode: 'PC', pc: 22, itime: 0.9, rr: 14, peep: 5, fio2: 60 }, { compliance: 50, resistance: 40, vqMismatch: 0.2, deadSpace: 0.15 }),
      expect: { 'vent.peepi': [1.5, 8], 'vent.vte': [250, 450], paco2: [45, 75] },
      notes: 'Extreme resistance: small delivered VT in PC, air trapping (auto-PEEP), shark-fin capnogram.' },

    { id: 'v-prvc', group: 'vent', label: 'PRVC — volume target', v1: 'PRVC — volume target',
      params: vent({ mode: 'PRVC', vt: 420, itime: 1.0, rr: 18, peep: 8, fio2: 50 }, { compliance: 38, resistance: 6 }),
      expect: { 'vent.vte': [395, 445], 'vent.pip': [16, 28] } },

    { id: 'v-ps', group: 'vent', label: 'PS weaning trial', v1: 'PS weaning trial',
      params: { vent: { mode: 'PS', ps: 10, cycle: 25, rise: 0.15, peep: 5, fio2: 30 }, lungs: { compliance: 55, resistance: 5 }, breathing: { rate: 18, effort: 3 } },
      expect: { 'vent.rr': [17, 19], 'vent.vte': [400, 650], 'vent.pip': [14, 16.5], spo2: [96, 100], paco2: [22, 40] },
      notes: 'PS 10 on a patient with modest drive: VT ~500 at 18/min over-ventilates (PaCO2 high-20s) — a cue to wean the support.' },
  ];

  // One-line physiology summary per preset (shown under the preset button).
  const TAGS = {
    normal: 'Healthy adult · room air',
    septic: 'Low SVR · venodilated · high VO₂',
    cardiogenic: 'Weak LV + RV · fluid retention',
    haemorrhagic: '~33 % blood loss · full reflexes',
    pe: 'PVR ×7 · RV failure · dead space',
    tamponade: 'Pericardial pressure 14 mmHg',
    tension: 'Pleural +14 mmHg · ventilated',
    istemi: 'Bradycardia · RV infarct',
    respfail: 'Shunt + V/Q · rapid shallow',
    vf: 'No output', asystole: 'No output', pea: 'Organised ECG · no output',
    'v-normal': 'VC · C 55 · R 8', 'v-ards-mild': 'VC · C 45 · shunt 18 %', 'v-ards-mod': 'VC · C 32 · PEEP 12',
    'v-ards-severe': 'PC · C 20 · PEEP 15', 'v-copd': 'VC · C 70 · R 26', 'v-asthma': 'PC · R 45 · auto-PEEP',
    'v-prvc': 'PRVC · target 420', 'v-ps': 'PS 10 · patient-triggered',
  };
  R.SCENARIOS.forEach((s) => { s.tag = TAGS[s.id] || ''; });

  R.scenario = function (id) {
    const s = R.SCENARIOS.find((x) => x.id === id);
    return s ? U.clone(s) : null;
  };

  // Read a dotted path out of a vitals object ('abp.sys' → v.abp.sys).
  R.pick = function (obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  };
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
