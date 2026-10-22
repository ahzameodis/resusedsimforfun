/* Phase 6 — ventilator validation: the equation of motion in every mode. */
'use strict';
const test = require('node:test');
const { R, assert, sim, merge, scenario, record, within, settle } = require('./helpers');

// lungs.resistance + 5 (ETT) = total resistance seen by the ventilator
const VC = (o) => merge({ vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2, flowPattern: 'const' },
  breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } }, o);

test('VC, normal lungs: Pplat = PEEP + VT/C and PIP = Pplat + R·flow', () => {
  const w = settle(VC(), 20).vitals.vent;
  within(w.pplat, 13.5, 14.5, 'Pplat');           // 5 + 450/50
  within(w.pip, 21.6, 23.0, 'PIP');               // 14 + 10 × 50/60
  within(w.vte, 445, 455, 'VTe');
  within(w.peepi, 0, 0.3, 'PEEPi');
  within(w.cstat, 48, 52, 'Cstat');
});

test('VC decelerating flow: lower PIP, same plateau (v1 regression: 22 vs 16, plateau 14)', () => {
  const c = settle(VC(), 20).vitals.vent;
  const d = settle(VC({ vent: { flowPattern: 'decel' } }), 20).vitals.vent;
  within(c.pip, 21.5, 23, 'constant-flow PIP');
  within(d.pip, 15, 17, 'decelerating-flow PIP');
  within(d.pplat, 13.5, 14.5, 'decelerating-flow Pplat');
});

test('air trapping: auto-PEEP matches the breath-stacking steady state', () => {
  // τ = 40·0.05 = 2 s, Ti = 0.5 s, Te = 2.5 s → trapped = VT·e/(1−e), e = exp(−Te/τ)
  const p = VC({ vent: { vt: 500, flow: 60, rr: 20, pause: 0 }, lungs: { resistance: 35 } });
  const w = settle(p, 40).vitals.vent;
  const e = Math.exp(-2.5 / 2), expected = 500 * e / (1 - e) / 50;   // 4.0 cmH2O
  within(w.peepi, expected * 0.88, expected * 1.12, 'PEEPi');
  // v1's single-breath formula (VT·e/C = 2.9) under-reads this by ~30 %
  assert.ok(w.peepi > 500 * e / 50 * 1.2, 'stacking makes auto-PEEP larger than a single-breath estimate');
});

test('auto-PEEP rises with rate and falls when expiratory time is lengthened', () => {
  const at = (rr) => settle(VC({ vent: { vt: 500, flow: 60, rr, pause: 0 }, lungs: { resistance: 35 } }), 40).vitals.vent.peepi;
  const a = at(12), b = at(20), c = at(28);
  assert.ok(a < b && b < c, `PEEPi at RR 12/20/28 = ${a.toFixed(1)}/${b.toFixed(1)}/${c.toFixed(1)}`);
});

test('COPD: expiratory flow has not returned to zero when the next breath starts', () => {
  const s = settle(scenario('v-copd'), 30);
  const r = record(s, 12, ['flow']);
  let starts = 0, stillFlowing = 0;
  for (let i = 1; i < r.flow.length; i++) {
    if (r.flow[i - 1] <= 0 && r.flow[i] > 5) { starts++; if (r.flow[i - 1] < -3) stillFlowing++; }
  }
  assert.ok(starts >= 2 && stillFlowing === starts, `${stillFlowing}/${starts} breaths started on live expiratory flow`);
});

test('PC: delivered VT = ΔP·C·(1 − e^(−Ti/τ))', () => {
  const p = merge(VC(), { vent: { mode: 'PC', pc: 15, itime: 1.0, rise: 0.05, rr: 12 } });
  const w = settle(p, 30).vitals.vent;
  const expected = 15 * 50 * (1 - Math.exp(-1 / 0.5));   // 649 mL
  within(w.vte, expected * 0.93, expected * 1.03, 'VTe');
  within(w.pip, 19.5, 20.5, 'PIP = PEEP + ΔP');
});

test('PC: auto-PEEP steals delivered volume at fast rates', () => {
  const at = (rr) => settle(merge(VC(), { vent: { mode: 'PC', pc: 20, itime: 0.9, rr }, lungs: { resistance: 25 } }), 40).vitals.vent;
  const slow = at(10), fast = at(25);
  assert.ok(fast.peepi > 2, `PEEPi at RR 25 = ${fast.peepi.toFixed(1)}`);
  assert.ok(fast.vte < 0.85 * slow.vte, `VT at RR 25 (${fast.vte.toFixed(0)}) vs RR 10 (${slow.vte.toFixed(0)})`);
});

test('PRVC: converges on the target volume and re-adapts when compliance falls', () => {
  const s = sim(merge(VC(), { vent: { mode: 'PRVC', vt: 450, itime: 1.0, rr: 16 }, lungs: { compliance: 40 } }));
  s.run(40);
  within(s.vitals.vent.vte, 430, 470, 'VTe at C 40');
  const pip1 = s.vitals.vent.pip;
  s.set({ lungs: { compliance: 25 } });
  s.run(60);
  within(s.vitals.vent.vte, 425, 475, 'VTe after compliance falls to 25');
  assert.ok(s.vitals.vent.pip > pip1 + 5, 'inspiratory pressure stepped up');
});

test('PS: patient-triggered and flow-cycled at the set percentage of peak flow', () => {
  const s = sim({ vent: { mode: 'PS', ps: 10, cycle: 25, peep: 5, fio2: 30 }, lungs: { compliance: 55, resistance: 5 }, breathing: { rate: 16, effort: 4 } });
  s.run(20);
  const ratios = [];
  const end = s.lungs.endInsp.bind(s.lungs);
  s.lungs.endInsp = (t) => { if (s.lungs.mode === 'PS') ratios.push(s.lungs.Q / s.lungs.qPeak); return end(t); };
  s.run(20);
  assert.ok(ratios.length >= 4, 'breaths delivered');
  for (const r of ratios) within(r, 0.20, 0.26, 'end-inspiratory flow / peak flow');
  within(s.vitals.vent.rr, 15, 17, 'rate follows the patient');
});

test('PS without patient effort: no breaths and apnoea is flagged', () => {
  const s = settle({ vent: { mode: 'PS', ps: 10, peep: 5 }, breathing: { effort: 0 } }, 30);
  assert.equal(s.vitals.apnea, true);
  assert.equal(s.vitals.rr, 0);
});

test('assist-control: patient triggering raises the rate above the set rate', () => {
  const s = settle(VC({ vent: { rr: 10 }, breathing: { rate: 20, effort: 4 } }), 40);
  within(s.vitals.vent.rr, 18, 22, 'measured rate');
  assert.equal(s.vitals.vent.triggered, true);
});

test('spontaneous breathing: tidal volume ≈ effort × compliance', () => {
  const v = settle({ lungs: { compliance: 60, resistance: 4 }, breathing: { rate: 12, effort: 8 } }, 30).vitals;
  within(v.vent.vte, 400, 520, 'VT');
  within(v.rr, 11.5, 14, 'RR (set 12; the CO2 drive may add a little)');
});

test('capnogram: bronchospasm gives a sloping "shark-fin" plateau', () => {
  const slope = (params) => {
    const s = settle(params, 30);
    const r = record(s, 10, ['co2', 'flow']);
    // last complete expiration: from flow turning negative to flow turning positive
    let end = r.flow.length - 1; while (end > 0 && !(r.flow[end - 1] < 0 && r.flow[end] > 0)) end--;
    let start = end - 1; while (start > 0 && r.flow[start] < 0) start--;
    const mid = Math.floor((start + end) / 2), last = r.co2[end - 1];
    return (last - r.co2[mid]) / last;
  };
  const normal = slope(VC({ vent: { rr: 12 } })), asthma = slope(scenario('v-asthma'));
  assert.ok(asthma > 2 * normal && asthma > 0.05, `phase III rise: asthma ${asthma.toFixed(3)} vs normal ${normal.toFixed(3)}`);
});
