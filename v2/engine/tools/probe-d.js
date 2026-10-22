/* Calibration probe for step D (drugs, fluids, events). Prints one line per situation. */
'use strict';
const R = require('..');
const f = (x, d = 0) => (x == null || !isFinite(x) ? '--' : (+x).toFixed(d));
const U = R.util;
const sc = (id, extra) => U.deepMerge(U.clone(R.scenario(id).params), extra || {});
const VC = { vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2 }, breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } };
const show = (label, s) => { const v = s.vitals, w = v.vent || {}; console.log(`${label.padEnd(44)} HR ${f(v.hr).padStart(3)} ABP ${f(v.abp.sys)}/${f(v.abp.dia)} (${f(v.abp.map)}) CO ${f(v.co,1)} CVP ${f(v.cvp,1)} SVR ${f(v.svr)} SpO2 ${f(v.spo2)} Et ${f(v.etco2)} RR ${f(v.rr)} BV ${f(v.bvPct)}% Hb ${f(v.hb,1)} | PIP ${f(w.pip)} VTe ${f(w.vte)} airway ${v.airway}`); };
const mk = (p) => new R.Sim(p, { seed: 5 });

// vasopressors in septic shock
for (const r of [0, 0.05, 0.1, 0.2, 0.4]) { const s = mk(sc('septic')); s.run(20); s.infuse('noradrenaline', r); s.run(300); show(`septic + noradrenaline ${r}`, s); }
// fluids in haemorrhage
{ const s = mk({ volume: { bloodVolume: 4550 * 0.7 } }); s.run(30); show('haemorrhage 30% baseline', s); s.giveFluid('crystalloid', 1000, 10); s.run(600); show('  + 1 L crystalloid, 10 min', s); s.run(3000); show('  + 60 min', s);
  s.giveFluid('blood', 300, 15); s.giveFluid('blood', 300, 15); s.run(1800); show('  + 2 units blood, 30 min', s); }
// anaphylaxis
{ const s = mk({}); s.run(20); s.startEvent('anaphylaxis'); s.run(120); show('anaphylaxis 2 min', s); s.run(180); show('anaphylaxis 5 min', s);
  s.bolus('adrenaline', 500, 5); s.run(300); show('  + adrenaline 0.5 mg IM, 5 min', s); s.run(600); show('  + 15 min', s); }
{ const s = mk({}); s.run(20); s.startEvent('anaphylaxis'); s.run(600); show('anaphylaxis untreated 10 min', s); }
// tension pneumothorax (ventilated)
{ const s = mk(VC); s.run(20); show('VC baseline', s); s.startEvent('tension'); s.run(180); show('tension 3 min', s); s.eventAction('decompress'); s.run(60); show('  decompressed + 1 min', s); }
// ongoing haemorrhage
{ const s = mk({}); s.run(20); s.startEvent('haemorrhage', 0.6); s.run(600); show('bleeding 90 mL/min, 10 min', s); s.eventAction('control'); s.run(300); show('  controlled + 5 min', s); }
// induction
for (const bv of [1, 0.8]) { const s = mk({ volume: { bloodVolume: 4550 * bv } }); s.run(20); show(`BV ${bv * 100}% spont baseline`, s); s.bolus('propofol', 1500); s.run(120); show('  propofol 1.5 mg/kg + 2 min', s); }
{ const s = mk({}); s.run(20); s.bolus('rocuronium', 1.2); let tA = null; for (let i = 0; i < 300; i++) { s.run(1); if (tA == null && s.vitals.apnea) tA = i; } show(`rocuronium: apnoea flagged at ${tA} s; 5 min`, s); }
{ const s = mk({ airway: { fio2: 100 } }); s.run(180); s.bolus('rocuronium', 1.2); s.run(300); show('preoxygenated + roc, 5 min apnoea', s); }
// atropine
for (const rh of ['sinusbrad', 'avb3']) { const s = mk({ heart: { rhythm: rh, hr: 40 }, reflex: { baro: 0 } }); s.run(20); const h0 = s.vitals.hr; s.bolus('atropine', 1); s.run(180); show(`${rh} 40 + atropine 1 mg (was ${f(h0)})`, s); }
// adenosine
for (const d of [6, 12]) { const s = mk({ heart: { rhythm: 'svt', hr: 180 } }); s.run(20); s.bolus('adenosine', d); let minHR = 999, pause = 0; for (let i = 0; i < 60; i++) { s.run(0.5); if (s.pe.heart.rhythm === 'avblock') pause += 0.5; } show(`SVT + adenosine ${d} mg: rhythm ${s.p.heart.rhythm}, block ${pause}s, notices ${JSON.stringify(s.takeNotices())}`, s); }
// GTN in RV infarct vs normal
for (const id of ['normal', 'istemi']) { const s = mk(sc(id)); s.run(30); const m0 = s.vitals.abp.map; s.infuse('gtn', 100); s.run(300); show(`${id} + GTN 100 mcg/min (MAP was ${f(m0)})`, s); }
// dobutamine in cardiogenic
{ const s = mk(sc('cardiogenic')); s.run(30); show('cardiogenic', s); s.infuse('dobutamine', 10); s.run(300); show('  + dobutamine 10', s); }
// airway events on VC
{ const s = mk(VC); s.run(20); s.startEvent('bronchospasm'); s.run(120); show('bronchospasm 2 min', s); s.bolus('salbutamol', 5); s.run(600); show('  + salbutamol 10 min', s); }
{ const s = mk(VC); s.run(20); s.startEvent('ettObstruction', 0.6); s.run(30); show('ETT obstruction partial', s); s.eventAction('suction'); s.run(30); show('  suctioned', s); }
{ const s = mk(VC); s.run(20); s.startEvent('mainstem'); s.run(120); show('right mainstem 2 min', s); s.eventAction('withdraw'); s.run(120); show('  withdrawn', s); }
{ const s = mk(VC); s.run(20); s.startEvent('oesophageal'); s.run(30); show('oesophageal 30 s', s); s.run(150); show('oesophageal 3 min', s); }
{ const s = mk(VC); s.run(20); s.startEvent('disconnection'); s.run(30); show('disconnection 30 s', s); s.run(150); show('disconnection 3 min', s); s.eventAction('reconnect'); s.run(60); show('  reconnected 1 min', s); }
{ const s = mk(U.deepMerge(U.clone(VC), { breathing: { rate: 16, effort: 6 } })); s.run(20); s.startEvent('extubation'); s.run(60); show('extubation (breathing) 1 min', s); }
