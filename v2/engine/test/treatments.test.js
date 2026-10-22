/* Step D — fluids, drugs and clinical events. */
'use strict';
const test = require('node:test');
const { R, assert, sim, merge, scenario, within, settle } = require('./helpers');

const VC = (o) => merge({ vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2 },
  breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } }, o);
const map = (s) => s.vitals.abp.map;

// ---------- fluids ----------
test('crystalloid: a transient rise, ~25 % stays in the vessels, haemoglobin dilutes', () => {
  const s = settle({ volume: { bloodVolume: 4550 * 0.7 } }, 30);
  const m0 = map(s), bv0 = s.volume.bv, hb0 = s.volume.hb();
  s.giveFluid('crystalloid', 1000, 10);
  s.run(600);
  assert.ok(map(s) > m0 + 10, `MAP ${m0.toFixed(0)} → ${map(s).toFixed(0)} after 1 L`);
  assert.ok(s.volume.hb() < hb0 - 1.5, 'haemodilution');
  s.run(3000);
  within((s.volume.bv - bv0) / 1000, 0.18, 0.40, 'fraction of 1 L still intravascular at 60 min');
});

test('packed red cells: volume stays, haemoglobin rises ~1 g/dL per unit', () => {
  const s = settle({ volume: { bloodVolume: 4550 * 0.75 }, metabolism: { hb: 8 } }, 20);
  const hb0 = s.volume.hb(), bv0 = s.volume.bv;
  s.giveFluid('blood', 300, 15); s.giveFluid('blood', 300, 15);
  s.run(3600);
  within((s.volume.hb() - hb0) / 2, 0.7, 1.4, 'Hb rise per unit');
  within(s.volume.bv - bv0, 550, 610, 'volume retained (mL)');
});

test('the instructor\'s baseline settings are never overwritten by treatments', () => {
  const s = settle(scenario('septic'), 10);
  s.infuse('noradrenaline', 0.3); s.giveFluid('crystalloid', 500, 5); s.startEvent('bronchospasm');
  s.run(120);
  assert.equal(s.p.vessels.svr, R.scenario('septic').params.vessels.svr);
  assert.ok(s.pe.vessels.svr > s.p.vessels.svr, 'effective SVR carries the drug');
  assert.ok(s.pe.lungs.resistance > s.p.lungs.resistance, 'effective resistance carries the bronchospasm');
});

// ---------- vasoactive drugs ----------
test('noradrenaline: dose-dependent rise in MAP and SVR, reflex slowing, washes out when stopped', () => {
  const at = (r) => { const s = settle(scenario('septic'), 20); s.infuse('noradrenaline', r); s.run(300); return s; };
  const v = [0, 0.05, 0.1, 0.3].map(at);
  for (let i = 1; i < v.length; i++) assert.ok(map(v[i]) > map(v[i - 1]), `MAP rises with dose (step ${i})`);
  assert.ok(map(v[2]) > map(v[0]) + 8, `0.1 mcg/kg/min: MAP ${map(v[0]).toFixed(0)} → ${map(v[2]).toFixed(0)}`);
  assert.ok(v[3].vitals.svr > 1.3 * v[0].vitals.svr && v[3].vitals.hr < v[0].vitals.hr, 'SVR up, HR down');
  const s = v[3]; s.infuse('noradrenaline', 0); s.run(600);
  within(map(s), map(v[0]) - 4, map(v[0]) + 4, 'MAP 10 min after stopping');
});

test('dobutamine raises cardiac output in cardiogenic shock', () => {
  const s = settle(scenario('cardiogenic'), 30), co0 = s.vitals.co;
  s.infuse('dobutamine', 10); s.run(300);
  assert.ok(s.vitals.co > 1.2 * co0, `CO ${co0.toFixed(1)} → ${s.vitals.co.toFixed(1)}`);
});

test('phenylephrine bolus: brief pressor response with reflex bradycardia', () => {
  // the usual context: just after induction, reflexes partly blunted
  const s = settle({ reflex: { baro: 0.5 } }, 30), m0 = map(s), hr0 = s.vitals.hr;
  s.bolus('phenylephrine', 100); s.run(120);
  assert.ok(map(s) > m0 + 6 && s.vitals.hr < hr0 - 3, `MAP ${m0.toFixed(0)} → ${map(s).toFixed(0)}, HR ${hr0.toFixed(0)} → ${s.vitals.hr.toFixed(0)}`);
  s.run(1200);
  within(map(s), m0 - 3, m0 + 3, 'worn off by 20 min');
});

test('GTN venodilation drops the BP more in RV infarction than in a normal heart', () => {
  const drop = (id) => { const s = settle(scenario(id), 30), m0 = map(s); s.infuse('gtn', 100); s.run(300); return (m0 - map(s)) / m0; };
  const normal = drop('normal'), rv = drop('istemi');
  assert.ok(rv > normal, `MAP fall: RV infarct ${(rv * 100).toFixed(0)} % vs normal ${(normal * 100).toFixed(0)} %`);
});

// ---------- rate and rhythm ----------
test('atropine speeds sinus bradycardia but not complete heart block', () => {
  const run = (rhythm) => { const s = settle({ heart: { rhythm, hr: 40 }, reflex: { baro: 0 } }, 20), h0 = s.vitals.hr; s.bolus('atropine', 1); s.run(180); return s.vitals.hr - h0; };
  assert.ok(run('sinusbrad') > 15, 'sinus bradycardia responds');
  within(run('avb3'), -3, 3, 'complete heart block HR change');
});

test('adenosine: 6 mg only pauses SVT, 12 mg converts it to sinus', () => {
  const give = (dose) => {
    const s = settle({ heart: { rhythm: 'svt', hr: 180 } }, 10);
    s.bolus('adenosine', dose);
    let paused = 0;
    for (let i = 0; i < 160; i++) { s.run(0.25); if (s.pe.heart.rhythm === 'avblock') paused += 0.25; }
    return { s, paused, notices: s.takeNotices() };
  };
  const six = give(6), twelve = give(12);
  assert.ok(six.paused >= 2 && six.paused <= 7, `6 mg pause ${six.paused} s`);
  assert.equal(six.s.p.heart.rhythm, 'svt');
  assert.ok(twelve.paused >= 5 && twelve.paused <= 14, `12 mg pause ${twelve.paused} s`);
  assert.equal(twelve.s.p.heart.rhythm, 'sinus');
  assert.equal(twelve.notices[0] && twelve.notices[0].rhythm, 'sinus', 'conversion reported to the app');
  within(twelve.s.vitals.hr, 70, 110, 'rate after conversion');
});

// ---------- induction and paralysis ----------
test('propofol: deeper fall in BP when hypovolaemic, and near-apnoea', () => {
  const run = (bv) => { const s = settle({ volume: { bloodVolume: 4550 * bv }, airway: { fio2: 100 } }, 120), m0 = map(s), vt0 = s.vitals.vent.vte;
    s.bolus('propofol', 1500); s.run(120); return { drop: (m0 - map(s)) / m0, vt: s.vitals.vent ? s.vitals.vent.vte / vt0 : 0 }; };
  const nv = run(1), hv = run(0.78);
  assert.ok(nv.drop > 0.05, `normovolaemic MAP fall ${(nv.drop * 100).toFixed(0)} %`);
  assert.ok(hv.drop > 1.4 * nv.drop, `hypovolaemic MAP fall ${(hv.drop * 100).toFixed(0)} %`);
  assert.ok(nv.vt < 0.5, `tidal volume falls to ${(nv.vt * 100).toFixed(0)} %`);
});

test('rocuronium: apnoea within 90 s; pre-oxygenation keeps SpO2 above 90 % for 4 minutes', () => {
  const s = settle({ airway: { fio2: 100 } }, 180);
  s.bolus('rocuronium', 1.2);
  let apnoeaAt = null, lowAt = null;
  for (let t = 1; t <= 300; t++) { s.run(1); if (apnoeaAt == null && s.vitals.apnea) apnoeaAt = t; if (lowAt == null && s.vitals.spo2 < 90) lowAt = t; }
  assert.ok(apnoeaAt != null && apnoeaAt <= 90, `apnoea flagged at ${apnoeaAt} s`);
  assert.ok(lowAt == null || lowAt > 240, `SpO2 < 90 at ${lowAt} s`);
});

test('respiratory drive: a spontaneously breathing patient breathes harder as CO2 rises', () => {
  const base = settle({}, 300).vitals, ds = settle({ lungs: { deadSpace: 0.35 } }, 300).vitals;
  assert.ok(ds.rr * ds.vent.vte > 1.2 * base.rr * base.vent.vte, `minute volume ${(base.rr * base.vent.vte / 1000).toFixed(1)} → ${(ds.rr * ds.vent.vte / 1000).toFixed(1)} L/min`);
});

// ---------- events ----------
test('anaphylaxis: vasodilated, leaky, bronchospastic — adrenaline IM turns it round', () => {
  const untreated = settle({}, 20); const m0 = map(untreated), bv0 = untreated.volume.bv;
  untreated.startEvent('anaphylaxis'); untreated.run(900);
  assert.ok(map(untreated) < m0 - 15, `untreated MAP ${m0.toFixed(0)} → ${map(untreated).toFixed(0)}`);
  assert.ok(untreated.volume.bv < bv0 - 400, 'capillary leak');
  const treated = settle({}, 20); treated.startEvent('anaphylaxis'); treated.run(300);
  treated.bolus('adrenaline', 500, 5); treated.run(600);
  assert.ok(map(treated) > map(untreated) + 10, `MAP at 15 min: treated ${map(treated).toFixed(0)} vs untreated ${map(untreated).toFixed(0)}`);
});

test('tension pneumothorax event: obstructive shock, then recovery on needle decompression', () => {
  const s = settle(VC(), 20), m0 = map(s);
  s.startEvent('tension'); s.run(180);
  assert.ok(map(s) < m0 - 15 && s.vitals.cvp > 12, `MAP ${map(s).toFixed(0)}, CVP ${s.vitals.cvp.toFixed(0)}`);
  assert.equal(s.eventAction('decompress'), 1);
  s.run(60);
  within(map(s), m0 - 5, m0 + 5, 'MAP after decompression');
});

test('ongoing haemorrhage removes blood at its rate until it is controlled', () => {
  const s = settle({}, 20), bv0 = s.volume.bv;
  s.startEvent('haemorrhage', 0.6); s.run(600);
  within(bv0 - s.volume.bv, 800, 950, 'mL lost in 10 min at 90 mL/min');
  s.eventAction('control'); const bv1 = s.volume.bv; s.run(300);
  within(bv1 - s.volume.bv, 0, 20, 'mL lost after control');
});

test('bronchospasm raises airway pressure; salbutamol relieves it', () => {
  const s = settle(VC(), 20), pip0 = s.vitals.vent.pip;
  s.startEvent('bronchospasm'); s.run(150);
  const pip1 = s.vitals.vent.pip;
  assert.ok(pip1 > pip0 + 12, `PIP ${pip0.toFixed(0)} → ${pip1.toFixed(0)}`);
  s.bolus('salbutamol', 5); s.run(600);
  assert.ok(s.vitals.vent.pip < pip1 - 4, `after salbutamol ${s.vitals.vent.pip.toFixed(0)}`);
});

test('ETT obstruction: high PIP in volume control, lost volume in pressure control; suction fixes both', () => {
  const vc = settle(VC(), 20), pip0 = vc.vitals.vent.pip;
  vc.startEvent('ettObstruction', 0.6); vc.run(30);
  assert.ok(vc.vitals.vent.pip > pip0 + 15, `VC PIP ${pip0.toFixed(0)} → ${vc.vitals.vent.pip.toFixed(0)}`);
  const pc = settle(merge(VC(), { vent: { mode: 'PC', pc: 15, itime: 1 } }), 20), vt0 = pc.vitals.vent.vte;
  pc.startEvent('ettObstruction', 0.6); pc.run(30);
  assert.ok(pc.vitals.vent.vte < 0.75 * vt0, `PC VT ${vt0.toFixed(0)} → ${pc.vitals.vent.vte.toFixed(0)}`);
  pc.eventAction('suction'); pc.run(30);
  within(pc.vitals.vent.vte, vt0 * 0.95, vt0 * 1.05, 'PC VT after suction');
});

test('right main-bronchus intubation: higher pressures and desaturation, fixed by withdrawing', () => {
  const s = settle(VC({ vent: { fio2: 30 } }), 60), pip0 = s.vitals.vent.pip, sp0 = s.vitals.spo2;
  s.startEvent('mainstem'); s.run(150);
  assert.ok(s.vitals.vent.pip > pip0 + 5 && s.vitals.spo2 < sp0 - 3, `PIP ${s.vitals.vent.pip.toFixed(0)}, SpO2 ${s.vitals.spo2.toFixed(0)}`);
  s.eventAction('withdraw'); s.run(150);
  within(s.vitals.vent.pip, pip0 - 1, pip0 + 1, 'PIP after withdrawal');
});

test('oesophageal intubation: no CO2 from the first breaths, then desaturation', () => {
  const s = settle(VC(), 30);
  s.startEvent('oesophageal'); s.run(15);
  within(s.vitals.etco2, 0, 1, 'EtCO2');
  s.run(165);
  assert.ok(s.vitals.spo2 < 85, `SpO2 after 3 min ${s.vitals.spo2.toFixed(0)}`);
  s.eventAction('reintubate'); s.run(30);
  assert.ok(s.vitals.etco2 > 30, 'CO2 returns once the tube is in the trachea');
});

test('circuit disconnection: ventilator reads zero, apnoea, recovers on reconnecting', () => {
  const s = settle(VC(), 20);
  s.startEvent('disconnection'); s.run(20);
  assert.equal(s.vitals.airway, 'disconnected');
  assert.equal(s.vitals.vent.disconnected, true);
  assert.equal(s.vitals.vent.vte, 0);
  assert.equal(s.vitals.apnea, true);
  s.eventAction('reconnect'); s.run(30);
  assert.ok(s.vitals.vent.vte > 400 && !s.vitals.apnea, 'ventilating again');
});

// ---------- sync ----------
test('two-screen sync carries drugs, fluids and events, with event timing intact', () => {
  const control = sim(scenario('septic'), { seed: 1 });
  control.run(20);
  control.infuse('noradrenaline', 0.2); control.giveFluid('crystalloid', 1000, 20); control.startEvent('anaphylaxis', 0.5);
  control.run(120);
  const display = sim(scenario('septic'), { seed: 2 });
  display.run(37);   // a different clock
  display.importSync(JSON.parse(JSON.stringify(control.exportSync())), { stateOnly: true });
  const ev = display.events.summary()[0];
  within(ev.elapsed, 115, 125, 'event age on the display (s)');
  control.run(60); display.run(60);
  within(map(display), map(control) * 0.95, map(control) * 1.05, 'MAP');
  within(display.volume.bv, control.volume.bv - 30, control.volume.bv + 30, 'blood volume');
  assert.equal(display.pharm.summary().find((d) => d.id === 'noradrenaline').rate, 0.2);
});
