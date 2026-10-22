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
