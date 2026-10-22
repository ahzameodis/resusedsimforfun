/* Step E — cardiac arrest, CPR, defibrillation, cardioversion and pacing. */
'use strict';
const test = require('node:test');
const { R, assert, sim, merge, scenario, within, settle, record, sd } = require('./helpers');

const BAG = { vent: { mode: 'VC', vt: 500, rr: 10, fio2: 100, peep: 5, flow: 50, pause: 0 } };
const VF = (extra) => scenario('vf', merge(BAG, { resus: { autoRhythm: false } }, extra));
const VC = merge({ vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2 }, breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } });

test('good chest compressions: arterial pulses ~80/25, ~1.2 L/min forward flow, EtCO2 ≥ 18', () => {
  const s = settle(VF({ resus: { cpr: true } }), 60), v = s.vitals;
  within(v.abp.sys, 60, 100, 'compression systolic'); within(v.abp.dia, 15, 40, 'relaxation diastolic');
  within(v.co, 1.0, 1.6, 'CPR forward flow L/min'); within(v.cpp, 12, 25, 'coronary perfusion pressure');
  assert.ok(v.etco2 >= 18, `EtCO2 ${v.etco2.toFixed(0)}`);
  assert.equal(v.spo2, null, 'no pulse oximetry signal during CPR');
});

test('CPR quality shows in the EtCO2 and the coronary perfusion pressure', () => {
  const at = (r) => settle(VF({ resus: Object.assign({ cpr: true }, r) }), 60).vitals;
  const good = at({}), shallow = at({ cprDepth: 0.5 }), slow = at({ cprRate: 80 });
  assert.ok(shallow.etco2 < 15 && shallow.etco2 < good.etco2 - 6, `EtCO2 good ${good.etco2.toFixed(0)} · shallow ${shallow.etco2.toFixed(0)}`);
  assert.ok(shallow.cpp < good.cpp - 5 && slow.cpp < good.cpp, `CPP good ${good.cpp.toFixed(0)} · shallow ${shallow.cpp.toFixed(0)} · slow ${slow.cpp.toFixed(0)}`);
});

test('adrenaline during CPR raises the coronary perfusion pressure and repays the myocardial oxygen debt', () => {
  const plain = settle(VF({ resus: { cpr: true } }), 120);
  const adr = sim(VF({ resus: { cpr: true } })); adr.bolus('adrenaline', 1000); adr.run(120);
  assert.ok(adr.vitals.cpp > plain.vitals.cpp + 10, `CPP ${plain.vitals.cpp.toFixed(0)} → ${adr.vitals.cpp.toFixed(0)}`);
  assert.ok(adr.hypox < plain.hypox, `debt without ${plain.hypox.toFixed(2)} · with adrenaline ${adr.hypox.toFixed(2)}`);
});

test('an IV drug needs a circulation: adrenaline in arrest acts only once compressions move it', () => {
  const still = sim(VF()); still.bolus('adrenaline', 1000); still.run(60);
  const cpr = sim(VF({ resus: { cpr: true } })); cpr.bolus('adrenaline', 1000); cpr.run(60);
  assert.ok(still.pharm.effect('adrenaline') < 0.5 && cpr.pharm.effect('adrenaline') > 0.9,
    `effect without CPR ${still.pharm.effect('adrenaline').toFixed(2)} · with CPR ${cpr.pharm.effect('adrenaline').toFixed(2)}`);
});

test('untreated VF coarsens to fine VF and ends in asystole', () => {
  const s = sim(scenario('vf'));
  const amp = () => sd(record(s, 4, ['ecg']).ecg);
  const early = amp();
  s.run(8 * 60); const late = amp();
  assert.ok(late < 0.75 * early, `VF amplitude ${early.toFixed(2)} → ${late.toFixed(2)} mV`);
  s.run(12 * 60);
  assert.equal(s.p.heart.rhythm, 'asystole');
  assert.ok(s.takeNotices().some((n) => n.rhythm === 'asystole'), 'the change is announced');
});

test('defibrillation: early VF usually returns a circulation; after 4 min without CPR it leaves PEA', () => {
  const trial = (sec, n) => { const out = { sinus: 0, pea: 0, vf: 0 };
    for (let k = 0; k < n; k++) { const s = sim(merge(scenario('vf'), BAG), { seed: 500 + k }); s.run(sec); out[s.shock(200, false).to]++; } return out; };
  const early = trial(30, 40), late = trial(240, 40);
  assert.ok(early.sinus >= 30, `30 s: ${JSON.stringify(early)}`);
  assert.ok(late.sinus <= 4 && late.pea >= 15, `4 min: ${JSON.stringify(late)}`);
});

test('after 4 min of untreated VF, cycles of CPR with adrenaline make a shock more and more likely to work', () => {
  const rate = (cycles) => { let rosc = 0;
    for (let k = 0; k < 20; k++) {
      const s = sim(merge(scenario('vf'), BAG), { seed: 700 + k }); s.run(240);   // 4 min no-flow
      s.set({ resus: { cpr: true } });
      for (let c = 0; c < cycles; c++) { if (c % 2 === 0) s.bolus('adrenaline', 1000); s.run(120); }   // 2-min cycles, adrenaline every other
      if (s.shock(200, false).to === 'sinus') rosc++;
    } return rosc; };
  const none = rate(0), one = rate(1), three = rate(3);
  assert.ok(none <= 2 && one > none && three >= 16, `ROSC: shock at once ${none}/20 · after 1 cycle ${one}/20 · after 3 cycles ${three}/20`);
});

test('synchronised cardioversion: converts VT; never fires on VF; an unsynchronised shock on VT can cause VF', () => {
  const vf = sim(scenario('vf')); vf.run(5);
  const r = vf.shock(200, true);
  assert.equal(r.delivered, false); assert.equal(vf.p.heart.rhythm, 'vf');
  let conv = 0, toVF = 0;
  for (let k = 0; k < 40; k++) {
    const a = sim({ heart: { rhythm: 'vt', hr: 180 } }, { seed: 900 + k }); a.run(10); if (a.shock(150, true).to === 'sinus') conv++;
    const b = sim({ heart: { rhythm: 'vt', hr: 180 } }, { seed: 950 + k }); b.run(10); if (b.shock(150, false).to === 'vf') toVF++;
  }
  assert.ok(conv >= 30, `sync conversions ${conv}/40`); assert.ok(toVF >= 3 && toVF <= 16, `R-on-T VF ${toVF}/40`);
});

test('instructor shock outcome: "always converts" and "refractory" are deterministic', () => {
  const a = sim(merge(scenario('vf'), { resus: { shockMode: 'convert' } })); a.run(600);
  assert.equal(a.shock(200, false).to, 'sinus');
  const b = sim(merge(scenario('vf'), { resus: { shockMode: 'refractory' } })); b.run(10);
  for (let i = 0; i < 5; i++) assert.equal(b.shock(360, false).to, 'vf');
});

test('hypoxic arrest: disconnection → bradycardia → PEA; reconnect, oxygen, CPR and adrenaline → ROSC', () => {
  const s = settle(VC, 30);
  s.startEvent('disconnection');
  let t = 0, minHR = 999;
  while (s.p.heart.rhythm !== 'pea' && t < 600) { s.run(5); t += 5; if (t > 120 && s.vitals.hr) minHR = Math.min(minHR, s.vitals.hr); }
  within(t, 150, 300, 'seconds from disconnection to PEA');
  assert.ok(minHR < 50, `pre-arrest bradycardia ${minHR.toFixed(0)}`);
  assert.ok(s.takeNotices().some((n) => n.rhythm === 'pea'), 'PEA announced');
  s.eventAction('reconnect'); s.set({ vent: { fio2: 100, rr: 10 }, resus: { cpr: true } });
  let u = 0; while (s.p.heart.rhythm === 'pea' && u < 720) { if (u % 240 === 0) s.bolus('adrenaline', 1000); s.run(5); u += 5; }   // adrenaline every 4 min
  assert.equal(s.p.heart.rhythm, 'sinus', `ROSC within 12 min of CPR (${u} s)`);
  assert.ok(u > 180, `not instant: ${u} s`);
  s.set({ resus: { cpr: false } }); s.run(60);
  assert.ok(s.vitals.abp.sys > 90 && s.vitals.etco2 > 30, `after ROSC SBP ${s.vitals.abp.sys.toFixed(0)}, EtCO2 ${s.vitals.etco2.toFixed(0)}`);
});

test('profound shock without hypoxaemia also ends in PEA if nothing is done', () => {
  const s = sim({ volume: { bloodVolume: 4550 * 0.45 }, heart: { hr: 80 } });
  let t = 0; while (s.p.heart.rhythm !== 'pea' && t < 900) { s.run(10); t += 10; }
  assert.equal(s.p.heart.rhythm, 'pea', `55 % blood loss: PEA after ${t} s`);
});

test('only the screen with authority changes the rhythm; a follower keeps what it is told', () => {
  const s = sim(VC, { authority: false }); s.run(30); s.startEvent('disconnection'); s.run(420);
  assert.equal(s.p.heart.rhythm, 'sinus');
  assert.ok(s.hypox > 1.4, 'the physiology still fails');
  const r = s.shock(200, false); assert.equal(r.pending, true);
});

test('transcutaneous pacing: no capture below threshold; above it the rate and pressure follow the pacer', () => {
  const s = settle({ heart: { rhythm: 'avb3', hr: 32 } }, 60), map0 = s.vitals.abp.map;
  s.set({ resus: { pace: true, paceRate: 70, paceMA: 40 } }); s.run(20);
  assert.equal(s.vitals.resus.pacing.capture, false); within(s.vitals.hr, 28, 36, 'HR without capture');
  s.set({ resus: { paceMA: 80 } }); s.run(40);
  const v = s.vitals;
  assert.ok(v.resus.pacing.capture && v.resus.pacing.mech, 'electrical and mechanical capture');
  within(v.hr, 67, 73, 'paced rate'); within(v.pulse, 67, 73, 'pulse follows the pacer');
  assert.ok(v.abp.map > map0 + 10, `MAP ${map0.toFixed(0)} → ${v.abp.map.toFixed(0)}`);
});

test('pacing asystole gives electrical capture without a pulse; a faster intrinsic rhythm inhibits the pacer', () => {
  const a = settle(scenario('asystole', { resus: { autoRhythm: false } }), 5);
  a.set({ resus: { pace: true, paceRate: 70, paceMA: 120 } }); a.run(15);
  assert.ok(a.vitals.resus.pacing.capture && !a.vitals.resus.pacing.mech);
  within(a.vitals.hr, 65, 75, 'monitor counts paced complexes'); assert.equal(a.vitals.pulse, null);
  const b = settle({}, 20); b.set({ resus: { pace: true, paceRate: 50, paceMA: 100 } }); b.run(10);
  assert.ok(b.vitals.resus.pacing.inhibited, 'demand pacing inhibited by sinus 75');
});

test('arrest bookkeeping for the debrief: CPR fraction, time to first compression, longest pause', () => {
  const s = sim(VF()); s.run(20);
  s.set({ resus: { cpr: true } }); s.run(100);
  s.set({ resus: { cpr: false } }); s.run(15);
  s.set({ resus: { cpr: true } }); s.run(45);
  const st = s.vitals.resus.stats;
  within(st.firstCPR, 19, 21, 'time to first compression');
  within(st.longestPause, 14, 16, 'longest pause');
  within(st.cprFraction, 0.80, 0.86, 'CPR fraction');
  const f = sim(VF(), { authority: false }); f.importSync(s.exportSync(), { stateOnly: true });
  assert.equal(f.resus.stats.longestPause, st.longestPause, 'stats travel with the sync message');
});
