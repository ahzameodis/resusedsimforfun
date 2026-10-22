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
