/* Engine contract: determinism, two-screen sync, real-time performance, robustness. */
'use strict';
const test = require('node:test');
const { R, assert, sim, merge, scenario, record, within } = require('./helpers');

const CHANNELS = ['ecg', 'art', 'pleth', 'cvp', 'pap', 'paw', 'flow', 'vol', 'co2', 'resp'];

test('deterministic: the same seed gives identical waveforms', () => {
  const a = record(sim(scenario('septic'), { seed: 9 }), 10, CHANNELS);
  const b = record(sim(scenario('septic'), { seed: 9 }), 10, CHANNELS);
  for (const k of CHANNELS) assert.deepEqual(a[k], b[k], k);
});

test('two-screen sync: a display importing the control state tracks its numbers', () => {
  const control = sim(scenario('septic', { vent: { mode: 'VC', vt: 450, rr: 18, peep: 8, fio2: 50 }, breathing: { effort: 0 } }), { seed: 1 });
  control.run(30);
  const display = sim({}, { seed: 2 });
  assert.ok(display.importSync(JSON.parse(JSON.stringify(control.exportSync()))));
  control.run(20); display.run(20);
  const c = control.vitals, d = display.vitals;
  within(d.hr, c.hr * 0.95, c.hr * 1.05, 'HR');
  within(d.abp.map, c.abp.map * 0.95, c.abp.map * 1.05, 'MAP');
  within(d.spo2, c.spo2 - 2, c.spo2 + 2, 'SpO2');
  within(d.etco2, c.etco2 - 3, c.etco2 + 3, 'EtCO2');
  within(d.vent.pip, c.vent.pip - 1, c.vent.pip + 1, 'PIP');
});

test('state-only import keeps the display\'s own parameters', () => {
  const control = sim(scenario('septic'), { seed: 1 });
  control.run(10);
  const msg = control.exportSync();
  const display = sim(scenario('septic', { vent: { peep: 12 } }), { seed: 2 });
  display.importSync(msg, { stateOnly: true });
  assert.equal(display.p.vent.peep, 12, 'newer local setting survives');
  assert.equal(display.gas.paco2, msg.s.gas.paco2, 'slow state taken');
  assert.equal(display.importSync({ v: 1 }, { stateOnly: true }), false, 'malformed message rejected');
});

test('real-time budget: one simulated minute takes well under a second', () => {
  const s = sim(scenario('v-ards-severe'));
  const t0 = process.hrtime.bigint();
  s.step(60, () => {});
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.ok(ms < 400, `60 s simulated in ${ms.toFixed(0)} ms`);
});

test('changing rhythm, mode and scenario mid-run never produces NaN', () => {
  const s = sim({});
  const bad = (x) => CHANNELS.some((k) => !Number.isFinite(x[k]));
  const check = () => s.step(3, (x) => { if (bad(x)) throw new Error('NaN sample at t=' + x.t); });
  for (const rhythm of Object.keys(R.RHYTHMS)) { s.set({ heart: { rhythm, hr: 90 } }); check(); }
  for (const mode of ['VC', 'PC', 'PRVC', 'PS', 'CPAP', 'off']) { s.set({ vent: { mode } }); check(); }
  for (const sc of R.SCENARIOS) { s.set(sc.params); check(); }
});

test('fuzz: random physiology stays finite and bounded', () => {
  const rand = R.util.rng(42);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const span = (lo, hi) => lo + rand() * (hi - lo);
  for (let i = 0; i < 40; i++) {
    const p = {
      heart: { rhythm: pick(Object.keys(R.RHYTHMS)), hr: span(20, 220), contractility: span(0.1, 1.5), rvContractility: span(0.1, 1.5) },
      vessels: { svr: span(200, 3000), pvr: span(50, 1200) },
      volume: { bloodVolume: span(2000, 7000), venousTone: span(0.8, 1.2) },
      thorax: { pplOffset: span(0, 25), pericardial: span(0, 25) },
      lungs: { compliance: span(10, 100), resistance: span(1, 50), shunt: span(0, 0.7), vqMismatch: span(0, 0.5), deadSpace: span(0, 0.6) },
      breathing: { rate: span(0, 40), effort: span(0, 15) },
      vent: { mode: pick(['off', 'VC', 'PC', 'PRVC', 'PS', 'CPAP']), rr: span(4, 40), vt: span(200, 800), peep: span(0, 24), fio2: span(21, 100), pc: span(5, 35), ps: span(0, 30) },
    };
    const s = sim(p, { seed: i });
    s.step(15, (x) => {
      for (const k of CHANNELS) if (!Number.isFinite(x[k])) throw new Error(`case ${i}: ${k} not finite`);
      if (x.art < -30 || x.art > 400) throw new Error(`case ${i}: arterial ${x.art}`);
    });
    const v = s.vitals;
    for (const k of ['co', 'cvp', 'pao2', 'paco2']) assert.ok(Number.isFinite(v[k]), `case ${i}: ${k}`);
  }
});
