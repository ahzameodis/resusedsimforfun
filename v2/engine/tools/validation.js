/* Write VALIDATION.md: the v2.0 document's Phase 4/6 checks with the numbers this engine
 * actually produces, then every scenario against its expected ranges.
 *   node tools/validation.js > ../VALIDATION.md
 * Everything here is computed live — regenerate after any model change. */
'use strict';
const R = require('..');
const { runScenario } = require('./report');

const U = R.util;
const merge = (...o) => o.reduce((a, b) => U.deepMerge(a, U.clone(b || {})), {});
const settle = (p, s) => { const x = new R.Sim(p, { seed: 3 }); x.run(s == null ? 40 : s); return x; };
const f = (x, d = 0) => (x == null || !isFinite(x) ? '--' : (+x).toFixed(d));
const VC = (o) => merge({ vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40, pause: 0.2 }, breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } }, o);
const rows = [];
const row = (area, check, sim, expect) => rows.push(`| ${area} | ${check} | ${sim} | ${expect} |`);

// ---- haemodynamics ----
const n = settle({}, 60).vitals;
row('Normal', 'Healthy adult, room air', `${f(n.abp.sys)}/${f(n.abp.dia)} (MAP ${f(n.abp.map)}), HR ${f(n.hr)}, CO ${f(n.co, 1)}, CVP ${f(n.cvp, 1)}, PA ${f(n.pap.sys)}/${f(n.pap.dia)}`, '~120/80, dicrotic notch present (tested)');
const hr = (h, r) => settle({ heart: { rhythm: r || 'sinus', hr: h }, reflex: { baro: 0 } }).vitals;
const h75 = hr(75), h150 = hr(150, 'sinustach'), svt = hr(180, 'svt'), h40 = hr(40, 'sinusbrad');
row('Tachycardia', 'HR 75 → 150 (reflexes off)', `SV ${f(h75.sv)} → ${f(h150.sv)} mL, PP ${f(h75.abp.sys - h75.abp.dia)} → ${f(h150.abp.sys - h150.abp.dia)}, BP ${f(h150.abp.sys)}/${f(h150.abp.dia)}`, 'SV and pulse pressure fall (v2.0 prototype gave 211/186)');
row('SVT', 'SVT 180', `SV ${f(svt.sv)} mL (${f(100 * (1 - svt.sv / h75.sv))} % drop), BP ${f(svt.abp.sys)}/${f(svt.abp.dia)}`, 'SV drop at >150 bpm');
row('Bradycardia', 'HR 40 (reflexes off)', `SV ${f(h40.sv)} mL, CO ${f(h40.co, 1)} (vs ${f(h75.co, 1)} at 75)`, 'larger SV, lower CO');
const af = settle({ heart: { rhythm: 'af', hr: 100 }, reflex: { baro: 0 } }, 60);
const afb = af.beats.slice(-30), rr = afb.slice(1).map((b, i) => b.t - afb[i].t), mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const cv = (a) => Math.sqrt(mean(a.map((x) => (x - mean(a)) ** 2))) / mean(a);
const svs = af.beats.filter((b) => b.mech && af.t - b.t < 20).map((b) => b.sv);
row('AF', 'Atrial fibrillation 100', `R-R CV ${f(cv(rr), 2)}, beat-to-beat SV CV ${f(cv(svs), 2)}`, 'irregular R-R, varying SV');
for (const r of ['vf', 'asystole', 'pea']) {
  const s = settle({ heart: { rhythm: 'sinus' } }, 10); s.set({ heart: { rhythm: r, hr: 45 } }); s.run(15); const v = s.vitals;
  row('Arrest', `${R.RHYTHMS[r].label}, 15 s`, `CO ${f(v.co, 1)}, ABP ${f(v.abp.map)} mmHg, CVP ${f(v.cvp)}, MSFP ${f(v.eq.msfp, 1)}, monitor HR ${f(v.hr)}`, 'I(t) = 0, pressures fall to mean systemic filling pressure');
}
const loss = [0, 0.15, 0.3, 0.4].map((l) => settle({ volume: { bloodVolume: 4550 * (1 - l) } }, 90).vitals);
row('Haemorrhage', 'Blood loss 0 / 15 / 30 / 40 %', loss.map((v) => `${f(v.abp.sys)}/${f(v.abp.dia)} HR ${f(v.hr)}`).join(' · '), 'ATLS-like graded response via baroreflex');

// ---- ventilator ----
const vn = settle(VC(), 20).vitals.vent, vd = settle(VC({ vent: { flowPattern: 'decel' } }), 20).vitals.vent;
row('VC', 'VT 450, flow 50, C 50, R 10, PEEP 5', `PIP ${f(vn.pip, 1)}, Pplat ${f(vn.pplat, 1)}, VTe ${f(vn.vte)}`, 'Pplat = 5 + 450/50 = 14; PIP = 14 + 10·0.83 = 22.3');
row('VC decel', 'same, decelerating flow', `PIP ${f(vd.pip, 1)}, Pplat ${f(vd.pplat, 1)}`, 'v1: PIP 16, plateau 14');
const at = settle(VC({ vent: { vt: 500, flow: 60, rr: 20, pause: 0 }, lungs: { resistance: 35 } }), 40).vitals.vent;
const e = Math.exp(-2.5 / 2);
row('Auto-PEEP', 'VT 500, RR 20, R 40, C 50 (τ 2 s)', `PEEPi ${f(at.peepi, 1)} cmH2O`, `breath stacking ${f(500 * e / (1 - e) / 50, 1)}; v1 single-breath formula ${f(500 * e / 50, 1)}; v2.0 prototype 0`);
const pc = settle(merge(VC(), { vent: { mode: 'PC', pc: 15, itime: 1, rise: 0.05, rr: 12 } }), 30).vitals.vent;
row('PC', 'ΔP 15, Ti 1.0, τ 0.5 s', `VTe ${f(pc.vte)} mL`, `ΔP·C·(1 − e^−Ti/τ) = ${f(15 * 50 * (1 - Math.exp(-2)))} mL (rise time trims a little)`);

// ---- coupling ----
const co = (p) => settle(p, 60).vitals.co;
const HYPO = { volume: { bloodVolume: 4550 * 0.78 } };
const dN = 1 - co(VC({ vent: { peep: 15 } })) / co(VC({ vent: { peep: 0 } }));
const dH = 1 - co(VC(merge(HYPO, { vent: { peep: 15 } }))) / co(VC(merge(HYPO, { vent: { peep: 0 } })));
row('Heart–lung', 'PEEP 0 → 15: CO fall', `normovolaemic ${f(100 * dN)} %, hypovolaemic ${f(100 * dH)} %`, 'falls more when preload-dependent');
const rl = settle(VC({ vent: { rr: 8 } }), 60).vitals, rh = settle(VC({ vent: { rr: 8 }, lungs: { resistance: 30 } }), 60).vitals;
row('Heart–lung', 'Raise airway resistance 10 → 35 (long Te)', `PIP ${f(rl.vent.pip)} → ${f(rh.vent.pip)}, MAP ${f(rl.abp.map)} → ${f(rh.abp.map)}`, 'resistive pressure does not reach the pleura (v2.0 prototype: MAP 106 → 35)');
const ppv = (p) => settle(p, 60).vitals.ppv;
row('Heart–lung', 'Pulse-pressure variation, VT 480', `hypovolaemic ${f(ppv(VC(merge(HYPO, { vent: { vt: 480 } }))), 1)} %, normovolaemic ${f(ppv(VC({ vent: { vt: 480 } })), 1)} %`, '>13 % = fluid responsive');
const hyp = (rr) => settle(VC({ vent: { vt: 600, flow: 60, rr, pause: 0 }, lungs: { resistance: 40 }, reflex: { baro: 0 } }), 60).vitals;
const hy8 = hyp(8), hy24 = hyp(24);
row('Heart–lung', 'Dynamic hyperinflation, sedated (RR 8 → 24)', `PEEPi ${f(hy8.vent.peepi, 1)} → ${f(hy24.vent.peepi, 1)}, MAP ${f(hy8.abp.map)} → ${f(hy24.abp.map)}`, 'hypotension; recovers on disconnection (tested)');

// ---- gas exchange ----
const sh = (fio2) => settle(VC({ vent: { fio2 }, lungs: { shunt: 0.4 } }), 60).vitals;
const vq = (fio2) => settle({ lungs: { vqMismatch: 0.35 }, airway: { fio2 } }, 60).vitals;
row('Gas', '40 % shunt, FiO2 0.5 → 1.0', `PaO2 ${f(sh(50).pao2)} → ${f(sh(100).pao2)}, SpO2 ${f(sh(100).spo2)}`, 'refractory to oxygen');
row('Gas', 'V/Q mismatch, FiO2 0.21 → 0.6', `SpO2 ${f(vq(21).spo2)} → ${f(vq(60).spo2)}`, 'responds to oxygen');
const c = settle(VC(), 30); const p0 = c.gas.paco2; c.set({ vent: { rr: 7 } }); c.run(25 * 60);
row('Gas', 'Halve the ventilator rate', `PaCO2 ${f(p0)} → ${f(c.gas.paco2)} after 25 min`, '≈ doubles, over minutes');
const ar = settle(VC(), 40); const base = ar.vitals.etco2; ar.set({ heart: { rhythm: 'vf' } }); ar.run(120); const inVf = ar.vitals.etco2;
ar.set({ heart: { rhythm: 'sinus', hr: 90 } }); let peak = 0; for (let i = 0; i < 60; i++) { ar.run(0.5); peak = Math.max(peak, ar.vitals.etco2); }
row('Gas', 'EtCO2: baseline → 2 min VF → ROSC', `${f(base)} → ${f(inVf)} → peak ${f(peak)} mmHg`, 'falls toward 0, washout surge at ROSC');
const desat = (fio2) => { const s = settle({ airway: { fio2 } }, 180); s.set({ breathing: { effort: 0 } }); for (let t = 0; t < 900; t++) { s.run(1); if (s.vitals.spo2 != null && s.vitals.spo2 < 90) return t / 60; } return Infinity; };
row('Gas', 'Apnoea: time to SpO2 < 90 %', `pre-oxygenated ${f(desat(100), 1)} min, room air ${f(desat(21), 1)} min`, 'minutes vs ~1 minute');

// ---- oxygenation drives the circulation (chemoreflex) ----
const ardsRow = (label, act) => { const sim = settle(U.clone(R.scenario('v-ards-severe').params), 60); const v0 = sim.vitals; act(sim); sim.run(240); const v = sim.vitals;
  row('Heart–lung', 'Severe ARDS: ' + label + ' (4 min)', `SpO2 ${f(v0.spo2)} → ${f(v.spo2)}, HR ${f(v0.hr)} → ${f(v.hr)}, MAP ${f(v0.abp.map)} → ${f(v.abp.map)}`, 'desaturation brings sympathetic tachycardia'); };
ardsRow('FiO2 90 → 35 %', (sim) => sim.set({ vent: { fio2: 35 } }));
ardsRow('PEEP 15 → 5 (derecruitment)', (sim) => sim.set({ vent: { peep: 5 } }));
ardsRow('worsening lung injury event', (sim) => sim.startEvent('ardsWorsening', 1));
{ const sim = settle(VC(), 30); sim.startEvent('disconnection'); let peak = 0, low = 999, tPea = null, tAsy = null;
  for (let t = 5; t <= 600; t += 5) { sim.run(5); const h = sim.vitals.hr; if (h) { peak = Math.max(peak, h); if (peak > 100 && !tPea) low = Math.min(low, h); }
    if (!tPea && sim.p.heart.rhythm === 'pea') tPea = t; if (!tAsy && sim.p.heart.rhythm === 'asystole') tAsy = t; }
  row('Heart–lung', 'Paralysed patient disconnected, nothing done', `HR peak ${f(peak)} → ${f(low)}; PEA at ${(tPea / 60).toFixed(1)} min; asystole at ${tAsy ? (tAsy / 60).toFixed(1) + ' min' : '> 10 min'}`, 'tachycardia, then hypoxic bradycardia, then PEA arrest; asystole if untreated'); }

// ---- treatments and events (step D) ----
const drows = [];
const drow = (area, check, sim, expect) => drows.push(`| ${area} | ${check} | ${sim} | ${expect} |`);
const after = (p, prep, act, secs) => { const s = settle(p, prep); const before = s.vitals; act(s); s.run(secs); return { s, before, v: s.vitals }; };
const SEP = () => U.clone(R.scenario('septic').params);
const nor = [0, 0.1, 0.3].map((r) => after(SEP(), 20, (s) => s.infuse('noradrenaline', r), 300).v);
drow('Vasopressor', 'Septic shock + noradrenaline 0 / 0.1 / 0.3 mcg/kg/min (5 min)', nor.map((v) => `MAP ${f(v.abp.map)} HR ${f(v.hr)} SVR ${f(v.svr)}`).join(' · '), 'dose-dependent MAP and SVR rise, reflex slowing');
const cr = after({ volume: { bloodVolume: 4550 * 0.7 } }, 30, (s) => s.giveFluid('crystalloid', 1000, 10), 600);
const cr0 = cr.before; cr.s.run(3000);
drow('Fluids', '30 % haemorrhage + 1 L crystalloid over 10 min', `MAP ${f(cr0.abp.map)} → ${f(cr.v.abp.map)} at 10 min → ${f(cr.s.vitals.abp.map)} at 60 min; Hb ${f(cr0.hb, 1)} → ${f(cr.v.hb, 1)}`, 'transient response; ~25 % stays intravascular; haemodilution');
const ana = after({}, 20, (s) => s.startEvent('anaphylaxis'), 900).v;
const anaT = (() => { const s = settle({}, 20); s.startEvent('anaphylaxis'); s.run(300); s.bolus('adrenaline', 500, 5); s.run(600); return s.vitals; })();
drow('Event', 'Anaphylaxis 15 min: untreated vs adrenaline 0.5 mg IM at 5 min', `MAP ${f(ana.abp.map)} (BV ${f(ana.bvPct)} %, Hb ${f(ana.hb, 1)}) vs ${f(anaT.abp.map)}`, 'vasodilatory, leaky shock reversed by adrenaline');
const ten = after(VC(), 20, (s) => s.startEvent('tension'), 180);
drow('Event', 'Tension pneumothorax (ventilated), 3 min', `MAP ${f(ten.before.abp.map)} → ${f(ten.v.abp.map)}, CVP ${f(ten.v.cvp)}, SpO2 ${f(ten.v.spo2)}, PIP ${f(ten.v.vent.pip)}`, 'obstructive shock; resolves on needle decompression (tested)');
const ad = [6, 12].map((d) => { const s = settle({ heart: { rhythm: 'svt', hr: 180 } }, 10); s.bolus('adenosine', d); let pause = 0; for (let i = 0; i < 160; i++) { s.run(0.25); if (s.pe.heart.rhythm === 'avblock') pause += 0.25; } return `${d} mg: ${pause} s block → ${s.p.heart.rhythm}`; });
drow('Rhythm', 'SVT 180 + adenosine', ad.join(' · '), '6 mg often only pauses; 12 mg converts');
const atr = ['sinusbrad', 'avb3'].map((r) => { const x = after({ heart: { rhythm: r, hr: 40 }, reflex: { baro: 0 } }, 20, (s) => s.bolus('atropine', 1), 180); return `${R.RHYTHMS[r].label} ${f(x.before.hr)} → ${f(x.v.hr)}`; });
drow('Rhythm', 'Atropine 1 mg', atr.join(' · '), 'vagolytic: sinus responds, complete heart block does not');
const prop = [1, 0.78].map((bv) => { const x = after({ volume: { bloodVolume: 4550 * bv }, airway: { fio2: 100 } }, 120, (s) => s.bolus('propofol', 1500), 120); return `${bv === 1 ? 'normovolaemic' : 'hypovolaemic'} MAP ${f(x.before.abp.map)} → ${f(x.v.abp.map)}`; });
drow('Induction', 'Propofol 1.5 mg/kg (pre-oxygenated)', prop.join(' · '), 'larger fall when preload-dependent; near-apnoea');
const roc = (() => { const s = settle({ airway: { fio2: 100 } }, 180); s.bolus('rocuronium', 1.2); let a = null, lo = null; for (let t = 1; t <= 600; t++) { s.run(1); if (a == null && s.vitals.apnea) a = t; if (lo == null && s.vitals.spo2 < 90) lo = t; } return `apnoea at ${a} s; SpO2 < 90 % at ${lo == null ? '> 600' : lo} s`; })();
drow('Paralysis', 'Rocuronium 1.2 mg/kg after pre-oxygenation', roc, 'apnoea within ~1 min; minutes of safe apnoea');
const air = [['bronchospasm', 'Bronchospasm'], ['ettObstruction', 'ETT obstruction (partial)'], ['mainstem', 'Right main-bronchus intubation'], ['oesophageal', 'Oesophageal intubation'], ['disconnection', 'Circuit disconnection']]
  .map(([id, label]) => { const x = after(VC(), 30, (s) => s.startEvent(id, id === 'ettObstruction' ? 0.6 : undefined), 150); const w = x.v.vent || {}; return `${label}: PIP ${f(w.pip)}, VTe ${f(w.vte)}, EtCO2 ${f(x.v.etco2)}, SpO2 ${f(x.v.spo2)}`; });
drow('Airway', 'VC 450 × 14, PEEP 5, FiO2 0.4 (baseline PIP ~22, EtCO2 ~38), 2.5 min', air.join('<br>'), 'high PIP · high PIP · high PIP + desaturation · no CO2 + desaturation · zeros + apnoea');

// ---- resuscitation (step E) ----
const erows = [];
const erow = (area, check, sim, expect) => erows.push(`| ${area} | ${check} | ${sim} | ${expect} |`);
const BAG = { vent: { mode: 'VC', vt: 500, rr: 10, fio2: 100, peep: 5, flow: 50, pause: 0 } };
const VF = (x) => merge(U.clone(R.scenario('vf').params), BAG, { resus: { autoRhythm: false } }, x);
const cprQ = [['good', {}], ['shallow', { cprDepth: 0.5 }], ['too slow (80)', { cprRate: 80 }], ['too fast (150)', { cprRate: 150 }]].map(([lab, r]) => {
  const v = settle(VF({ resus: Object.assign({ cpr: true }, r) }), 60).vitals; return `${lab}: ART ${f(v.abp.sys)}/${f(v.abp.dia)}, CPP ${f(v.cpp)}, flow ${f(v.co, 1)} L/min, EtCO2 ${f(v.etco2)}`; });
erow('CPR', 'VF, bag 10/min FiO2 1.0, compressions 1 min', cprQ.join('<br>'), 'good CPR: CPP ≳ 15, EtCO2 ≳ 20; shallow / slow CPR: both fall');
{ const a = settle(VF({ resus: { cpr: true } }), 5); a.bolus('adrenaline', 1000); a.run(120); const b = settle(VF({ resus: { cpr: true } }), 125);
  erow('CPR', 'Adrenaline 1 mg IV during good CPR (2 min)', `CPP ${f(b.vitals.cpp)} → ${f(a.vitals.cpp)} mmHg; myocardial O2 debt ${f(100 * b.hypox / 1.45)} % → ${f(100 * a.hypox / 1.45)} %`, 'α-effect raises aortic relaxation pressure; better coronary perfusion'); }
{ const x = settle(VF(), 5); x.bolus('adrenaline', 1000); x.run(60); const y = settle(VF({ resus: { cpr: true } }), 5); y.bolus('adrenaline', 1000); y.run(60);
  erow('CPR', 'Adrenaline 1 mg in arrest: effect at 1 min', `no compressions ${f(100 * x.pharm.effect('adrenaline'))} % · with CPR ${f(100 * y.pharm.effect('adrenaline'))} %`, 'a drug needs a circulation to reach the heart'); }
const shockAt = (sec, n) => { const o = { sinus: 0, pea: 0, vf: 0 }; for (let k = 0; k < n; k++) { const s2 = new R.Sim(merge(U.clone(R.scenario('vf').params), BAG), { seed: 500 + k }); s2.run(sec); o[s2.shock(200, false).to]++; } return o; };
erow('Defibrillation', '200 J after untreated VF of 0.5 / 2 / 4 / 8 min (60 runs each): ROSC · PEA · still VF', [30, 120, 240, 480].map((sec) => { const o = shockAt(sec, 60); return `${sec / 60} min: ${Math.round(o.sinus / 0.6)} · ${Math.round(o.pea / 0.6)} · ${Math.round(o.vf / 0.6)} %`; }).join('<br>'), 'early shock usually works; after minutes of no flow, an organised rhythm without output');
{ const cyc = (n) => { let r = 0; for (let k = 0; k < 40; k++) { const s2 = new R.Sim(merge(U.clone(R.scenario('vf').params), BAG), { seed: 700 + k }); s2.run(240); s2.set({ resus: { cpr: true } });
    for (let c = 0; c < n; c++) { if (c % 2 === 0) s2.bolus('adrenaline', 1000); s2.run(120); } if (s2.shock(200, false).to === 'sinus') r++; } return Math.round(100 * r / 40); };
  erow('Defibrillation', '4 min untreated VF, then 2-min cycles of good CPR (adrenaline 1 mg every other cycle), then 200 J: ROSC (40 runs)', [0, 1, 2, 3].map((n) => `${n} cycle${n === 1 ? '' : 's'}: ${cyc(n)} %`).join(' · '), 'prolonged VF: CPR and adrenaline before the shock; keep going'); }
{ let c = 0, v = 0; for (let k = 0; k < 40; k++) { const a = new R.Sim({ heart: { rhythm: 'vt', hr: 180 } }, { seed: 900 + k }); a.run(10); if (a.shock(150, true).to === 'sinus') c++; const b = new R.Sim({ heart: { rhythm: 'vt', hr: 180 } }, { seed: 950 + k }); b.run(10); if (b.shock(150, false).to === 'vf') v++; }
  const vfs = new R.Sim(R.scenario('vf').params, { seed: 3 }); vfs.run(5); const r2 = vfs.shock(200, true);
  erow('Cardioversion', 'VT 180 with a pulse, 150 J', `synchronised: ${Math.round(100 * c / 40)} % → sinus · unsynchronised: ${Math.round(100 * v / 40)} % → VF · SYNC on VF: ${r2.delivered ? 'delivered' : 'not delivered'}`, 'synchronise for organised rhythms; a sync shock never fires on VF'); }
{ const s2 = new R.Sim(R.scenario('vf').params, { seed: 3 }); const amp = () => { const a = []; s2.step(4, (x) => a.push(x.ecg)); const m = a.reduce((p, q) => p + q, 0) / a.length; return Math.sqrt(a.reduce((p, q) => p + (q - m) ** 2, 0) / a.length); };
  const a0 = amp(); s2.run(476); const a8 = amp(); let t = 8; while (s2.p.heart.rhythm !== 'asystole' && t < 30) { s2.run(30); t += 0.5; }
  erow('Arrest', 'Untreated VF', `ECG amplitude (SD) ${f(a0, 2)} → ${f(a8, 2)} mV at 8 min; asystole at ${t.toFixed(1)} min`, 'coarse → fine VF → asystole'); }
{ const s2 = settle(VC(), 30); s2.startEvent('disconnection'); let t = 0; while (s2.p.heart.rhythm !== 'pea' && t < 600) { s2.run(5); t += 5; } s2.run(30);
  s2.eventAction('reconnect'); s2.set({ vent: { fio2: 100, rr: 10 }, resus: { cpr: true } }); let u = 0; while (s2.p.heart.rhythm === 'pea' && u < 900) { if (u % 240 === 0) s2.bolus('adrenaline', 1000); s2.run(5); u += 5; }
  s2.set({ resus: { cpr: false } }); s2.run(60);
  erow('Arrest', 'Hypoxic PEA (disconnection): 30 s later reconnect, FiO2 1.0, CPR, adrenaline 1 mg every 4 min', `PEA at ${(t / 60).toFixed(1)} min; ROSC after ${(u / 60).toFixed(1)} min of CPR; 1 min later BP ${f(s2.vitals.abp.sys)}/${f(s2.vitals.abp.dia)}, EtCO2 ${f(s2.vitals.etco2)}`, 'treat the cause + CPR + adrenaline → ROSC; CO2 washout on ROSC'); }
{ const s2 = new R.Sim({ volume: { bloodVolume: 4550 * 0.45 }, heart: { hr: 80 } }, { seed: 3 }); let t = 0; while (s2.p.heart.rhythm !== 'pea' && t < 900) { s2.run(10); t += 10; }
  erow('Arrest', '55 % blood loss, nothing done', `PEA after ${(t / 60).toFixed(1)} min`, 'profound shock → coronary hypoperfusion → PEA'); }
{ const s2 = settle({ heart: { rhythm: 'avb3', hr: 32 } }, 60), b = s2.vitals; s2.set({ resus: { pace: true, paceRate: 70, paceMA: 40 } }); s2.run(20); const v40 = s2.vitals; s2.set({ resus: { paceMA: 80 } }); s2.run(40); const v80 = s2.vitals;
  const a = settle(merge(U.clone(R.scenario('asystole').params), { resus: { autoRhythm: false } }), 5); a.set({ resus: { pace: true, paceRate: 70, paceMA: 120 } }); a.run(15);
  erow('Pacing', 'Complete heart block 32/min; threshold 65 mA; pacer 70/min', `40 mA: HR ${f(v40.hr)}, MAP ${f(v40.abp.map)} (no capture) · 80 mA: HR ${f(v80.hr)}, pulse ${f(v80.pulse)}, MAP ${f(b.abp.map)} → ${f(v80.abp.map)}<br>asystole, 120 mA: monitor HR ${f(a.vitals.hr)}, pulse ${a.vitals.pulse == null ? 'none' : f(a.vitals.pulse)}`, 'capture above threshold; pacing asystole gives electrical capture only'); }

// ---- output ----
const out = [];
out.push('# RESUS Sim v2 — engine validation\n');
out.push('> TRAINING SIMULATION — NOT A MEDICAL DEVICE · NOT FOR CLINICAL USE. Values are model outputs for teaching, not clinical reference ranges.\n');
out.push(`Generated ${new Date().toLocaleDateString('en-CA')} by \`engine/tools/validation.js\` from engine ${R.version}. Every number below is computed live from the engine — rerun the script after any model change.\n`);
out.push('Automated checks: `engine/test/` (run `node --test "test/*.test.js"` inside `engine/`). The tables below are for clinical reviewers (RTs, intensivists): each row is a physiology claim from the RESUS Sim v2.0 document (Phase 4 and Phase 6) and what the engine does.\n');
out.push('## Physiology checks (v2.0 document, Phases 4 and 6)\n');
out.push('| Area | Situation | Engine output | Expected behaviour |\n|---|---|---|---|');
out.push(...rows);
out.push('\n## Treatments and events (step D)\n');
out.push('Drugs act through onset/offset time constants and a sigmoid dose–effect; fluids redistribute; events ramp in and are resolved by their treatment. Doses are typical adult teaching values, not prescribing guidance.\n');
out.push('| Area | Situation | Engine output | Expected behaviour |\n|---|---|---|---|');
out.push(...drows);
out.push('\n## Resuscitation (step E)\n');
out.push("Compressions are a pump of fixed shape (depth, rate) acting on the same Windkessels as the heart. One state — the myocardial oxygen debt — links desaturation, low coronary perfusion, CPR and adrenaline to the rhythm: up to 1 it slows and weakens the heart, above 1 the heart fails (PEA, then asystole), and it decides how often a shock returns a circulation. Shock outcomes are drawn at random on the instructor's screen.\n");
out.push('| Area | Situation | Engine output | Expected behaviour |\n|---|---|---|---|');
out.push(...erows);
out.push('\n## Scenario library\n');
out.push('Each preset sets the patient\'s physiology; the engine produces the numbers. Expected ranges come from the v1 presets and standard clinical values. Measured after 40 s warm-up + 60 s run (arrest presets: 20 s).\n');
for (const sc of R.SCENARIOS) {
  const r = runScenario(sc);
  out.push(`### ${sc.label} (\`${sc.id}\`) — ${r.pass ? 'PASS' : 'FAIL'}\n`);
  if (sc.notes) out.push(sc.notes + '\n');
  out.push('| Measure | Expected | Engine |  |\n|---|---|---|---|');
  for (const x of r.rows) out.push(`| ${x.key} | ${x.lo} – ${x.hi} | ${f(x.val, Math.abs(x.val) < 10 ? 1 : 0)} | ${x.ok ? '✓' : '✗'} |`);
  out.push('');
}
out.push('## Known simplifications (for reviewers)\n');
out.push([
  '- Single-compartment lungs: no regional heterogeneity, no recruitment/derecruitment hysteresis on the P-V loop.',
  '- One pump-and-curve circulation per side; no valve disease. Coronary perfusion is one "myocardial oxygen debt" state (desaturation or low aortic − RA pressure), not a coronary circulation.',
  '- CPR is a compression pump of fixed shape: depth and rate only (no leaning / incomplete recoil, no feedback from a real manikin) — the instructor sets the quality the team is achieving.',
  '- Shock success depends on VF duration (oxygen debt), energy and amiodarone; no pad position, impedance or waveform type.',
  '- Hypoxic and low-flow arrests become PEA, then asystole; the engine never turns hypoxia or ischaemia into VF on its own.',
  '- After ROSC the heart recovers as the remaining oxygen debt is repaid; no prolonged post-arrest stunning, acidosis or hyperkalaemia. Adrenaline 1 mg keeps the blood pressure high for several minutes after ROSC.',
  '- Drug effects use one generic onset/offset + sigmoid model per drug; no tachyphylaxis or interactions beyond effects adding up.',
  '- Crystalloid is not excreted by the kidneys; it stays in the body (vessels or tissues) for the length of a scenario.',
  '- Pplat and PEEPtot are static (hold-manoeuvre) values each breath; real ventilators measure them only on request.',
].join('\n'));
console.log(out.join('\n'));
