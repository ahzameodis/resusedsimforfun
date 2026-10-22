/* Phase 4 — gas exchange: FiO2 / ventilation → SpO2, PaO2, PaCO2, EtCO2. */
'use strict';
const test = require('node:test');
const { assert, sim, merge, scenario, within, settle } = require('./helpers');

const VC = (o) => merge({ vent: { mode: 'VC', vt: 500, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2 },
  breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } }, o);

test('healthy, room air: normal blood gas and a small PaCO2–EtCO2 gap', () => {
  const v = settle({}, 60).vitals;
  within(v.pao2, 85, 105, 'PaO2'); within(v.spo2, 95, 99.5, 'SpO2'); within(v.paco2, 35, 45, 'PaCO2');
  within(v.paco2 - v.etco2, 1, 6, 'PaCO2–EtCO2 gap');
});

test('alveolar gas equation holds at steady state', () => {
  for (const fio2 of [21, 50, 100]) {
    const s = settle(VC({ vent: { fio2 }, lungs: { shunt: 0, vqMismatch: 0 } }), 60);
    const expected = fio2 / 100 * 713 - s.gas.paco2 / 0.8;
    within(s.gas.pAO2, expected - 4, expected + 4, `PAO2 at FiO2 ${fio2}`);
  }
});

test('true shunt is refractory to oxygen; V/Q mismatch is not', () => {
  const sh = (fio2) => settle(VC({ vent: { fio2 }, lungs: { shunt: 0.4 } }), 60).vitals;
  const s50 = sh(50), s100 = sh(100);
  assert.ok(s100.pao2 - s50.pao2 < 40, `40 % shunt: PaO2 ${s50.pao2.toFixed(0)} → ${s100.pao2.toFixed(0)} on FiO2 0.5 → 1.0`);
  assert.ok(s100.spo2 < 94, `40 % shunt SpO2 on 100 % O2 = ${s100.spo2.toFixed(1)}`);
  const vq = (fio2) => settle({ lungs: { vqMismatch: 0.35 }, airway: { fio2 } }, 60).vitals.spo2;
  const ra = vq(21), o2 = vq(60);
  assert.ok(ra < 90 && o2 > 96, `V/Q mismatch SpO2 ${ra.toFixed(0)} on air → ${o2.toFixed(0)} on 60 %`);
});

test('PEEP recruits shunt in recruitable ARDS', () => {
  const at = (peep) => settle(scenario('v-ards-mod', { vent: { peep } }), 60).vitals.pao2;
  const p5 = at(5), p15 = at(15);
  assert.ok(p15 > 1.25 * p5, `PaO2 PEEP 5 → 15: ${p5.toFixed(0)} → ${p15.toFixed(0)}`);
});

test('halving alveolar ventilation roughly doubles PaCO2, over minutes not seconds', () => {
  const s = settle(VC(), 30);
  const p0 = s.gas.paco2;
  s.set({ vent: { rr: 7 } });
  s.run(60);
  const p1 = s.gas.paco2;
  s.run(25 * 60);
  const pInf = s.gas.paco2;
  within(pInf / p0, 1.7, 2.3, 'PaCO2 ratio after halving the rate');
  assert.ok((p1 - p0) / (pInf - p0) < 0.4, 'less than 40 % of the rise happens in the first minute');
});

test('low cardiac output widens the PaCO2–EtCO2 gap (dead space)', () => {
  const gap = (p) => { const v = settle(p, 60).vitals; return v.paco2 - v.etco2; };
  const normal = gap(VC()), shock = gap(VC({ volume: { bloodVolume: 4550 * 0.6 } }));
  assert.ok(shock > normal + 3, `gap ${normal.toFixed(1)} → ${shock.toFixed(1)} mmHg`);
});

test('arrest: EtCO2 falls toward zero; ROSC brings a CO2 washout surge', () => {
  const s = settle(VC(), 40);
  const base = s.vitals.etco2;
  s.set({ heart: { rhythm: 'vf' } });
  s.run(120);
  assert.ok(s.vitals.etco2 < 5, `EtCO2 in VF ${s.vitals.etco2.toFixed(1)}`);
  s.set({ heart: { rhythm: 'sinus', hr: 90 } });
  let peak = 0;
  for (let i = 0; i < 60; i++) { s.run(0.5); peak = Math.max(peak, s.vitals.etco2); }
  assert.ok(peak > base + 3, `ROSC EtCO2 peak ${peak.toFixed(1)} vs pre-arrest ${base.toFixed(1)}`);
});

test('apnoea: pre-oxygenation buys minutes, room air buys about a minute', () => {
  const timeToDesat = (fio2) => {
    const s = settle({ airway: { fio2 } }, 180);
    s.set({ breathing: { effort: 0 } });
    for (let t = 0; t < 900; t += 1) { s.run(1); if (s.vitals.spo2 != null && s.vitals.spo2 < 90) return t / 60; }
    return Infinity;
  };
  within(timeToDesat(100), 4, 10, 'minutes to SpO2 < 90 after pre-oxygenation');
  within(timeToDesat(21), 0.4, 2.5, 'minutes to SpO2 < 90 on room air');
});

test('hypoventilation alone causes hypoxaemia on room air', () => {
  // controlled ventilation at a low rate: the patient cannot compensate (a spontaneous patient's CO2 drive would)
  const v = settle(VC({ vent: { rr: 5, fio2: 21, peep: 0 } }), 20 * 60).vitals;
  assert.ok(v.paco2 > 60, `PaCO2 ${v.paco2.toFixed(0)}`);
  assert.ok(v.pao2 < 70, `PaO2 ${v.pao2.toFixed(0)}`);
});
