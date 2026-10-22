/* Calibration probe: runs a list of named patients and prints one line each. */
'use strict';
const R = require('..');
const f = (x, d = 0) => (x == null || isNaN(x) ? '--' : (+x).toFixed(d));
function line(name, patch, secs, mut) {
  const sim = new R.Sim(patch, { seed: 7 });
  if (mut) mut(sim);
  sim.run(secs || 40);
  const v = sim.vitals, w = v.vent || {};
  console.log(`${name.padEnd(26)} HR ${f(v.hr).padStart(3)} P ${f(v.pulse).padStart(3)} ABP ${f(v.abp.sys).padStart(3)}/${f(v.abp.dia).padStart(3)}(${f(v.abp.map).padStart(3)}) PP ${f(v.abp.sys - v.abp.dia).padStart(3)} CVP ${f(v.cvp,1).padStart(5)} PCWP ${f(v.pcwp,1).padStart(4)} mPAP ${f(v.pap.map).padStart(3)} CO ${f(v.co,2).padStart(5)} SV ${f(v.sv).padStart(3)} SVR ${f(v.svr).padStart(5)} PPV ${f(v.ppv,1).padStart(5)} SpO2 ${f(v.spo2).padStart(3)} PaO2 ${f(v.pao2).padStart(3)} PaCO2 ${f(v.paco2,1)} Et ${f(v.etco2,1)} | PIP ${f(w.pip,1)} Pplat ${f(w.pplat,1)} PEEPi ${f(w.peepi,1)} VTe ${f(w.vte)}`);
  return sim;
}
module.exports = { line, f, R };
if (require.main === module) {
  const VC = { vent: { mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 40 }, breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 5 } };
  const m = (a, b) => R.util.deepMerge(R.util.clone(a), b);
  line('normal spont', {});
  line('normal VC', VC);
  for (const hr of [40, 60, 75, 100, 130, 150, 180, 200]) line('sinus hr ' + hr + ' baro0', { heart: { hr }, reflex: { baro: 0 } });
  line('AF 110', { heart: { rhythm: 'af', hr: 110 } });
  line('SVT 180', { heart: { rhythm: 'svt', hr: 180 } });
  line('VT 170 pulsed', { heart: { rhythm: 'vt', hr: 170 } });
  line('AVB3 escape 38', { heart: { rhythm: 'avb3', hr: 38 } });
  line('VF 20s', { heart: { rhythm: 'vf' } }, 20);
  line('PEA 20s', { heart: { rhythm: 'pea', hr: 40 } }, 20);
  for (const loss of [0.15, 0.30, 0.40]) line('haemorrhage ' + loss * 100 + '%', { volume: { bloodVolume: 4550 * (1 - loss) } }, 90);
  for (const peep of [0, 5, 10, 15, 20]) line('VC PEEP ' + peep, m(VC, { vent: { peep } }));
  for (const peep of [0, 5, 10, 15, 20]) line('VC PEEP ' + peep + ' hypovol', m(VC, { vent: { peep }, volume: { bloodVolume: 4550 * 0.78 } }));
}
