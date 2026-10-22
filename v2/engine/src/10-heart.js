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
