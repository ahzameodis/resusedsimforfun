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
