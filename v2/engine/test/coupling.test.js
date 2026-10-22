/* Phase 4 — cardiopulmonary interaction ("combined engine"). */
'use strict';
const test = require('node:test');
const { assert, sim, merge, scenario, within, settle } = require('./helpers');

const VC = (o) => merge({ vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2 },
  breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } }, o);
const HYPO = { volume: { bloodVolume: 4550 * 0.78 } };
const coAt = (p) => settle(p, 60).vitals.co;

test('PEEP lowers cardiac output through pleural pressure — more so when hypovolaemic', () => {
  const dropN = 1 - coAt(VC({ vent: { peep: 15 } })) / coAt(VC({ vent: { peep: 0 } }));
  const dropH = 1 - coAt(VC(merge(HYPO, { vent: { peep: 15 } }))) / coAt(VC(merge(HYPO, { vent: { peep: 0 } })));
  within(dropN, 0.05, 0.22, 'normovolaemic CO fall, PEEP 0→15');
  assert.ok(dropH > 1.3 * dropN, `hypovolaemic fall ${(dropH * 100).toFixed(0)} % vs ${(dropN * 100).toFixed(0)} %`);
});

test('stiff (ARDS) lungs transmit less pressure to the pleura: the same PEEP costs less output', () => {
  const drop = (ecwFrac) => 1 - coAt(VC({ vent: { peep: 15 }, lungs: { ecwFrac } })) / coAt(VC({ vent: { peep: 0 }, lungs: { ecwFrac } }));
  const normal = drop(0.45), ards = drop(0.25);
  assert.ok(ards < normal, `CO fall: ARDS-like ${(ards * 100).toFixed(0)} % vs normal ${(normal * 100).toFixed(0)} %`);
});

test('resistive airway pressure alone does not crash the blood pressure (v2.0 prototype flaw)', () => {
  const low = settle(VC({ vent: { rr: 8 } }), 60).vitals;
  const high = settle(VC({ vent: { rr: 8 }, lungs: { resistance: 30 } }), 60).vitals;
  assert.ok(high.vent.pip > low.vent.pip + 15, `PIP ${low.vent.pip.toFixed(0)} → ${high.vent.pip.toFixed(0)}`);
  assert.ok(Math.abs(high.abp.map - low.abp.map) / low.abp.map < 0.05, `MAP ${low.abp.map.toFixed(0)} → ${high.abp.map.toFixed(0)}`);
});

test('dynamic hyperinflation drops the BP in a sedated patient; disconnecting the ventilator restores it', () => {
  // sedation blunts the baroreflex — that is when breath stacking turns into hypotension
  const p = (rr, baro) => VC({ vent: { vt: 600, flow: 60, rr, pause: 0 }, lungs: { resistance: 40 }, reflex: { baro } });
  const base = settle(p(8, 0), 60).vitals.abp.map;
  const s = settle(p(24, 0), 60);
  assert.ok(s.vitals.vent.peepi > 8, `PEEPi ${s.vitals.vent.peepi.toFixed(1)}`);
  assert.ok(s.vitals.abp.map < 0.9 * base, `MAP ${s.vitals.abp.map.toFixed(0)} vs ${base.toFixed(0)}`);
  const buffered = 1 - settle(p(24, 1), 60).vitals.abp.map / settle(p(8, 1), 60).vitals.abp.map;
  assert.ok(buffered < 1 - s.vitals.abp.map / base, 'an intact baroreflex buffers the fall');
  s.set({ vent: { mode: 'off' } });          // open the circuit: trapped gas empties
  s.run(25);
  assert.ok(s.lungs.V < 0.05, 'trapped volume released');
  assert.ok(s.vitals.abp.map > 0.95 * base, `MAP after disconnect ${s.vitals.abp.map.toFixed(0)}`);
});

test('pulse-pressure variation: high when preload-dependent, low when not', () => {
  const ppv = (p) => settle(p, 60).vitals.ppv;
  const hypo = ppv(VC(merge(HYPO, { vent: { vt: 480 } })));
  const norm = ppv(VC({ vent: { vt: 480 } }));
  const failing = ppv(VC({ vent: { vt: 480 }, heart: { contractility: 0.4 }, volume: { bloodVolume: 4550 * 1.1 } }));
  assert.ok(hypo > 13, `hypovolaemic PPV ${hypo.toFixed(1)} % (fluid-responsive threshold 13 %)`);
  assert.ok(norm < 13, `normovolaemic PPV ${norm.toFixed(1)} %`);
  assert.ok(failing < norm, `failing, well-filled heart PPV ${failing.toFixed(1)} %`);
});

test('tension pneumothorax: obstructive shock that reverses on decompression', () => {
  const s = settle(scenario('tension'), 60);
  const before = s.vitals;
  s.set({ thorax: { pplOffset: 0, venousObstruction: 1 }, lungs: { compliance: 50, shunt: 0.05 } });
  s.run(60);
  const after = s.vitals;
  assert.ok(after.co > 1.5 * before.co, `CO ${before.co.toFixed(1)} → ${after.co.toFixed(1)}`);
  assert.ok(after.cvp < before.cvp - 5, `CVP ${before.cvp.toFixed(0)} → ${after.cvp.toFixed(0)}`);
  assert.ok(after.abp.sys > 95, `SBP after decompression ${after.abp.sys.toFixed(0)}`);
  assert.ok(after.vent.pip < before.vent.pip - 5, 'airway pressures fall');
});

// ---------- oxygenation drives the circulation (chemoreflex) ----------
const ARDS = () => scenario('v-ards-severe');

test('severe ARDS: worse ventilator settings → SpO2 falls and the heart rate climbs', () => {
  const run = (patch) => { const s = settle(ARDS(), 60); const v0 = s.vitals; s.set(patch); s.run(240); return { v0, v: s.vitals }; };
  for (const [label, patch] of [['FiO2 90 → 35', { vent: { fio2: 35 } }], ['PEEP 15 → 5', { vent: { peep: 5 } }]]) {
    const { v0, v } = run(patch);
    assert.ok(v.spo2 < v0.spo2 - 4, `${label}: SpO2 ${v0.spo2.toFixed(0)} → ${v.spo2.toFixed(0)}`);
    assert.ok(v.hr > v0.hr + 2, `${label}: HR ${v0.hr.toFixed(0)} → ${v.hr.toFixed(0)}`);
  }
});

test('worsening lung injury: progressive desaturation with tachycardia', () => {
  const s = settle(ARDS(), 60), v0 = s.vitals;
  s.startEvent('ardsWorsening', 1); s.run(300);
  const v = s.vitals;
  assert.ok(v.spo2 < v0.spo2 - 6, `SpO2 ${v0.spo2.toFixed(0)} → ${v.spo2.toFixed(0)}`);
  assert.ok(v.hr > 1.12 * v0.hr, `HR ${v0.hr.toFixed(0)} → ${v.hr.toFixed(0)}`);
});

test('hypoxaemia to SpO2 < 80 % gives at least a 25 % rise in heart rate; a normal SpO2 gives none', () => {
  const s = settle(ARDS(), 60), hr0 = s.vitals.hr;
  s.set({ vent: { fio2: 21, peep: 5 }, lungs: { shunt: 0.8 } }); s.run(180);
  assert.ok(s.vitals.spo2 < 80, `SpO2 ${s.vitals.spo2.toFixed(0)}`);
  assert.ok(s.vitals.hr > 1.25 * hr0, `HR ${hr0.toFixed(0)} → ${s.vitals.hr.toFixed(0)}`);
  within(settle({}, 60).chemo, 0, 0.05, 'chemoreflex drive with a normal blood gas');
});

test('sustained profound hypoxaemia: tachycardia, then bradycardia as the heart tires, then PEA arrest', () => {
  const s = settle(VC(), 30), hr0 = s.vitals.hr;
  s.startEvent('disconnection');            // paralysed, apnoeic: SpO2 falls through the 60s
  let peak = 0, low = 999, t = 0;
  while (s.p.heart.rhythm !== 'pea' && t < 600) {
    s.run(5); t += 5;
    const hr = s.vitals.hr; if (hr) { peak = Math.max(peak, hr); if (peak > 1.2 * hr0) low = Math.min(low, hr); }
  }
  assert.ok(peak > 1.25 * hr0, `tachycardia: HR ${hr0.toFixed(0)} → peak ${peak.toFixed(0)}`);
  assert.ok(low < 0.5 * peak, `then bradycardia: lowest ${low.toFixed(0)} before the arrest`);
  within(t, 150, 300, 'seconds from disconnection to PEA');
  assert.ok(s.hypox > 1.4, `myocardial oxygen debt ${s.hypox.toFixed(2)}`);
});

test('hypercapnia alone raises heart rate and blood pressure', () => {
  const s = settle(VC({ vent: { fio2: 60 } }), 60), v0 = s.vitals;
  s.set({ vent: { rr: 6 } }); s.run(900);
  const v = s.vitals;
  assert.ok(v.paco2 > 65 && v.spo2 > 92, `PaCO2 ${v.paco2.toFixed(0)}, SpO2 ${v.spo2.toFixed(0)}`);
  assert.ok(v.hr > v0.hr + 5 && v.abp.map > v0.abp.map, `HR ${v0.hr.toFixed(0)} → ${v.hr.toFixed(0)}, MAP ${v0.abp.map.toFixed(0)} → ${v.abp.map.toFixed(0)}`);
});
