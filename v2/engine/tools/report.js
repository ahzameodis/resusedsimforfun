/* Run every scenario in the library and compare its measured vitals with its `expect` ranges.
 *   node tools/report.js            → console table
 *   node tools/report.js --md       → Markdown (used to write VALIDATION.md)
 *   node tools/report.js septic pe  → only those scenarios
 */
'use strict';
const R = require('..');

const SETTLE = 60;   // seconds simulated after warm-up before measuring

function runScenario(sc, seed) {
  const sim = new R.Sim(sc.params, { seed: seed || 11 });
  sim.run(sc.settle != null ? sc.settle : SETTLE);
  const v = sim.vitals;
  const rows = Object.entries(sc.expect || {}).map(([key, [lo, hi]]) => {
    const val = R.pick(v, key);
    const ok = val != null && !isNaN(val) && val >= lo && val <= hi;
    return { key, lo, hi, val, ok };
  });
  return { sc, v, rows, pass: rows.every((r) => r.ok) };
}
module.exports = { runScenario, SETTLE };

const fmt = (x) => (x == null || isNaN(x) ? '--' : Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));

if (require.main === module) {
  const args = process.argv.slice(2);
  const md = args.includes('--md');
  const only = args.filter((a) => !a.startsWith('--'));
  const list = R.SCENARIOS.filter((s) => !only.length || only.includes(s.id));
  const results = list.map((s) => runScenario(s));
  if (md) {
    for (const r of results) {
      console.log(`### ${r.sc.label} \`${r.sc.id}\` — ${r.pass ? 'PASS' : 'FAIL'}\n`);
      if (r.sc.notes) console.log(`${r.sc.notes}\n`);
      console.log('| Measure | Expected | Simulated | |\n|---|---|---|---|');
      for (const x of r.rows) console.log(`| ${x.key} | ${x.lo} – ${x.hi} | ${fmt(x.val)} | ${x.ok ? '✓' : '✗'} |`);
      console.log('');
    }
  } else {
    for (const r of results) {
      const bad = r.rows.filter((x) => !x.ok);
      const v = r.v, w = v.vent || {};
      console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.sc.id.padEnd(14)} HR ${fmt(v.hr)} BP ${fmt(v.abp.sys)}/${fmt(v.abp.dia)} (${fmt(v.abp.map)}) CVP ${fmt(v.cvp)} PCWP ${fmt(v.pcwp)} mPAP ${fmt(v.pap.map)} CO ${fmt(v.co)} SVR ${fmt(v.svr)} SpO2 ${fmt(v.spo2)} PaO2 ${fmt(v.pao2)} PaCO2 ${fmt(v.paco2)} Et ${fmt(v.etco2)} RR ${fmt(v.rr)} PPV ${fmt(v.ppv)} PI ${fmt(v.pi)}` +
        (v.vent ? ` | PIP ${fmt(w.pip)} Pplat ${fmt(w.pplat)} PEEPi ${fmt(w.peepi)} VTe ${fmt(w.vte)} dP ${fmt(w.dp)} P/F ${fmt(v.pf)}` : ''));
      for (const x of bad) console.log(`      ✗ ${x.key} = ${fmt(x.val)}  (expected ${x.lo}–${x.hi})`);
    }
    const n = results.filter((r) => r.pass).length;
    console.log(`\n${n}/${results.length} scenarios within expected ranges`);
  }
}
