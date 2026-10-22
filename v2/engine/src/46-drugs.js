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
