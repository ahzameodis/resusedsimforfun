/* How does severe ARDS respond to bad ventilator settings / worsening disease? HR should climb as SpO2 falls. */
'use strict';
const R = require('..');
const U = R.util;
const f = (x, d = 0) => (x == null || !isFinite(x) ? '--' : (+x).toFixed(d));
const base = () => U.clone(R.scenario('v-ards-severe').params);
const line = (label, s) => { const v = s.vitals; console.log(`${label.padEnd(38)} SpO2 ${f(v.spo2).padStart(3)} PaO2 ${f(v.pao2).padStart(3)} PaCO2 ${f(v.paco2).padStart(3)} | HR ${f(v.hr).padStart(3)} ABP ${f(v.abp.sys)}/${f(v.abp.dia)} (${f(v.abp.map)}) CO ${f(v.co,1)} | chemo ${f(s.chemo,2)} baroHR ${f(s.baro.hr,2)}`); };
const cases = [
  ['baseline (PC18, PEEP15, FiO2 90)', {}],
  ['FiO2 90 → 50', { vent: { fio2: 50 } }],
  ['FiO2 90 → 35', { vent: { fio2: 35 } }],
  ['PEEP 15 → 5 (derecruitment)', { vent: { peep: 5 } }],
  ['RR 28 → 12 (hypoventilation)', { vent: { rr: 12 } }],
  ['disease worse: shunt 0.55 → 0.75', { lungs: { shunt: 0.75 } }],
];
for (const [label, patch] of cases) {
  const s = new R.Sim(base(), { seed: 4 }); s.run(60);
  s.set(patch); s.run(240);
  line(label + ' (+4 min)', s);
}
{ const s = new R.Sim(base(), { seed: 4 }); s.run(60); s.startEvent('ardsWorsening', 1); s.run(300); line('event: worsening lung injury (+5 min)', s); }
{ const s = new R.Sim(base(), { seed: 4 }); s.run(60); s.set({ vent: { fio2: 21 }, lungs: { shunt: 0.8 } }); for (const m of [1, 2, 3, 5]) { s.run(m === 1 ? 60 : (m === 5 ? 120 : 60)); line(`profound hypoxaemia, ${m} min`, s); } }
