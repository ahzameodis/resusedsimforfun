/* Phase 6 — haemodynamic validation (RESUS Sim v2.0 document) plus v1 shock triads. */
'use strict';
const test = require('node:test');
const { R, assert, sim, merge, scenario, record, mean, cv, within, settle, recentBeats } = require('./helpers');

const NOBARO = { reflex: { baro: 0 } };

test('normal adult: BP ~120/80, normal CO, dicrotic notch on every beat', () => {
  const s = settle({});
  const v = s.vitals;
  within(v.abp.sys, 105, 135, 'SBP'); within(v.abp.dia, 60, 85, 'DBP'); within(v.co, 4.5, 6.8, 'CO');
  // notch: after each systolic peak the pressure dips then rises again, above diastolic
  const r = record(s, 4, ['art']);
  const a = r.art, lo = Math.min(...a), hi = Math.max(...a), pp = hi - lo;
  let notches = 0;
  for (let i = 2; i < a.length - 2; i++) {
    if (!(a[i] >= a[i - 1] && a[i] > a[i + 1] && a[i] > lo + 0.8 * pp)) continue;   // systolic peak
    for (let j = i + 1; j < Math.min(i + 90, a.length - 1); j++) {                  // within 0.45 s
      if (a[j] <= a[j - 1] && a[j] < a[j + 1] && a[j] > lo + 0.2 * pp) {
        let k = j + 1; while (k < a.length - 1 && a[k + 1] >= a[k]) k++;
        if (a[k] - a[j] > 0.3) notches++;
        break;
      }
    }
  }
  assert.ok(notches >= 4, `expected a dicrotic notch on each of ~5 beats, found ${notches}`);
});

test('tachycardia / SVT: shorter filling time lowers stroke volume and pulse pressure', () => {
  const at = (heart) => settle(merge(NOBARO, { heart })).vitals;
  const v75 = at({ hr: 75 }), v150 = at({ rhythm: 'sinustach', hr: 150 }), svt = at({ rhythm: 'svt', hr: 180 });
  assert.ok(v150.sv < 0.8 * v75.sv, `SV 150 bpm ${v150.sv.toFixed(0)} vs 75 bpm ${v75.sv.toFixed(0)}`);
  assert.ok(v150.abp.sys - v150.abp.dia < v75.abp.sys - v75.abp.dia, 'pulse pressure narrows');
  assert.ok(svt.sv < 0.6 * v75.sv, `SVT 180 SV ${svt.sv.toFixed(0)} should drop by >40 %`);
  assert.ok(v150.co < 1.5 * v75.co, 'doubling the rate must not double the output (venous return limits it)');
  // the v2.0 prototype produced 211/186 at 150 bpm — check we don't
  assert.ok(v150.abp.sys < 140, `SBP at 150 bpm = ${v150.abp.sys.toFixed(0)}`);
});

test('bradycardia / heart block: larger stroke volume, lower cardiac output', () => {
  const v75 = settle(merge(NOBARO, { heart: { hr: 75 } })).vitals;
  const v40 = settle(merge(NOBARO, { heart: { rhythm: 'sinusbrad', hr: 40 } })).vitals;
  const chb = settle({ heart: { rhythm: 'avb3', hr: 38 } }).vitals;
  assert.ok(v40.sv > 1.1 * v75.sv, `SV ${v40.sv.toFixed(0)} vs ${v75.sv.toFixed(0)}`);
  assert.ok(v40.co < 0.8 * v75.co, `CO ${v40.co.toFixed(2)} vs ${v75.co.toFixed(2)}`);
  assert.ok(chb.abp.sys - chb.abp.dia > v75.abp.sys - v75.abp.dia, 'complete heart block: wide pulse pressure');
});

test('atrial fibrillation: irregularly irregular R-R and beat-to-beat stroke volume', () => {
  const af = settle(merge(NOBARO, { heart: { rhythm: 'af', hr: 100 } }), 60);
  const sr = settle(merge(NOBARO, { heart: { rhythm: 'sinus', hr: 100 } }), 60);
  const rr = (s) => { const b = s.beats.slice(-30); return b.slice(1).map((x, i) => x.t - b[i].t); };
  assert.ok(cv(rr(af)) > 0.12, `AF R-R CV ${cv(rr(af)).toFixed(3)}`);
  assert.ok(cv(rr(sr)) < 0.04, `sinus R-R CV ${cv(rr(sr)).toFixed(3)}`);
  const svs = recentBeats(af, 20).map((b) => b.sv);
  assert.ok(cv(svs) > 0.10, `AF stroke-volume CV ${cv(svs).toFixed(3)}`);
  within(af.vitals.hr, 85, 115, 'AF ventricular rate');
});

for (const rhythm of ['vf', 'asystole', 'pvt', 'pea']) {
  test(`${rhythm}: no flow, arterial and venous pressures fall to mean systemic filling pressure`, () => {
    const s = sim({ heart: { rhythm: 'sinus' } });
    s.run(10);
    s.set({ heart: { rhythm, hr: rhythm === 'pea' ? 45 : 170 } });
    s.run(15);
    const v = s.vitals;
    within(v.co, 0, 0.05, 'CO');
    within(v.eq.msfp, 7, 15, 'MSFP');
    within(v.abp.map, v.eq.msfp - 3, v.eq.msfp + 4, 'arterial pressure');
    assert.equal(v.pulse, null, 'no palpable pulse');
    assert.equal(v.spo2, null, 'no SpO2 without pulsatile flow');
    if (rhythm === 'pea') within(v.hr, 38, 52, 'PEA still shows an electrical rate');
    if (rhythm === 'vf' || rhythm === 'asystole') assert.equal(v.hr, null, 'no countable QRS');
  });
}

test('complete heart block: AV dissociation produces cannon a waves', () => {
  const range = (params) => { const s = settle(params, 20); const r = record(s, 12, ['cvp']); return Math.max(...r.cvp) - Math.min(...r.cvp); };
  const chb = range({ heart: { rhythm: 'avb3', hr: 38, atrialRate: 80 }, breathing: { effort: 0 } });
  const sr = range({ heart: { rhythm: 'sinus', hr: 75 }, breathing: { effort: 0 } });
  assert.ok(chb > 1.8 * sr, `CVP excursion CHB ${chb.toFixed(1)} vs sinus ${sr.toFixed(1)} mmHg`);
});

test('second-degree block: Mobitz I conducts 3 of 4 P waves, Mobitz II 2:1 conducts half', () => {
  for (const [rhythm, ratio] of [['avb2i', 0.75], ['avb2ii', 0.5], ['avb1', 1]]) {
    const s = sim({ heart: { rhythm, hr: 60 } });
    let nA = 0, nV = 0;
    const conduct = s.heart.conduct.bind(s.heart), fire = s.heart.fireV.bind(s.heart);
    s.heart.conduct = (...a) => { nA++; return conduct(...a); };
    s.heart.fireV = (...a) => { nV++; return fire(...a); };
    s.run(60);
    within(nV / nA, ratio - 0.04, ratio + 0.04, `${rhythm} QRS:P`);
    within(s.vitals.hr, 52, 68, `${rhythm} ventricular rate`);
  }
});

test('shock states have distinct CO / SVR / CVP triads (v1 presets, now emergent)', () => {
  const n = settle({}, 60).vitals;
  const sep = settle(scenario('septic'), 60).vitals;
  const card = settle(scenario('cardiogenic'), 60).vitals;
  const hem = settle(scenario('haemorrhagic'), 60).vitals;
  const pe = settle(scenario('pe'), 60).vitals;
  assert.ok(sep.co > n.co && sep.svr < 0.6 * n.svr, 'septic: high CO, low SVR');
  assert.ok(sep.abp.dia < 50 && sep.abp.sys - sep.abp.dia > 40, 'septic: low diastolic, wide pulse pressure');
  assert.ok(card.co < 0.75 * n.co && card.cvp > n.cvp + 8 && card.pcwp > 18, 'cardiogenic: low CO, high CVP and wedge');
  assert.ok(card.abp.sys - card.abp.dia < 30, 'cardiogenic: narrow pulse pressure');
  assert.ok(hem.co < 0.75 * n.co && hem.cvp < 4 && hem.svr > 1.25 * n.svr, 'haemorrhagic: low CO, low CVP, high SVR');
  assert.ok(pe.cvp > 11 && pe.pap.map > 28 && pe.pcwp < 12, 'PE: high CVP and PA pressure, low wedge');
});

test('graded haemorrhage: baroreflex raises HR as BP falls', () => {
  const v = [0, 0.15, 0.30, 0.40].map((loss) => settle({ volume: { bloodVolume: 4550 * (1 - loss) } }, 90).vitals);
  for (let i = 1; i < v.length; i++) {
    assert.ok(v[i].hr > v[i - 1].hr, `HR should rise with loss (step ${i})`);
    assert.ok(v[i].abp.sys < v[i - 1].abp.sys, `SBP should fall with loss (step ${i})`);
  }
  assert.ok(v[1].abp.sys > 90, `15 % loss SBP ${v[1].abp.sys.toFixed(0)} (class I–II: maintained)`);
  assert.ok(v[3].abp.sys < 80 && v[3].hr > 120, `40 % loss SBP ${v[3].abp.sys.toFixed(0)}, HR ${v[3].hr.toFixed(0)} (class IV)`);
});

test('baroreflex off: heart rate stays exactly where the instructor set it', () => {
  // 20 % loss: MAP ~45 with no reflex at all (30 % unbuffered gives MAP ~5 — an arrest, and the
  // oxygen-starved heart then slows, which is not what this test is about)
  const v = settle(merge(NOBARO, { heart: { hr: 88 }, volume: { bloodVolume: 4550 * 0.8 } }), 60).vitals;
  within(v.hr, 85, 91, 'HR');
});

test('tamponade: equalised diastolic pressures and pulsus paradoxus', () => {
  const swing = (s) => { const b = recentBeats(s, 15).map((x) => x.sys); return Math.max(...b) - Math.min(...b); };
  const tam = settle(scenario('tamponade'), 60), nor = settle({}, 60);
  const v = tam.vitals;
  assert.ok(Math.abs(v.cvp - v.pcwp) < 4, `CVP ${v.cvp.toFixed(1)} vs wedge ${v.pcwp.toFixed(1)}`);
  assert.ok(swing(tam) > 10, `tamponade systolic swing ${swing(tam).toFixed(1)} mmHg`);
  assert.ok(swing(nor) < 10, `normal systolic swing ${swing(nor).toFixed(1)} mmHg`);
});
