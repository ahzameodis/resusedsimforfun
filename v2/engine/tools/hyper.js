'use strict';
const R = require('..');
const VC = (rr, baro, extra) => R.util.deepMerge({ vent: { mode: 'VC', vt: 600, flow: 60, rr, pause: 0, peep: 5, fio2: 40 }, breathing: { effort: 0 }, lungs: { compliance: 50, resistance: 40 }, reflex: { baro } }, extra || {});
for (const baro of [0, 0.5, 1]) for (const rr of [8, 16, 24, 30]) {
  const s = new R.Sim(VC(rr, baro), { seed: 3 }); s.run(60); const v = s.vitals;
  console.log(`baro ${baro} rr ${rr}: PEEPi ${v.vent.peepi.toFixed(1)} palvMean ${s.lungs.palvMean.toFixed(1)} pplMean ${s.lungs.pplMean.toFixed(1)} VTe ${v.vent.vte.toFixed(0)} | MAP ${v.abp.map.toFixed(0)} CO ${v.co.toFixed(2)} CVP ${v.cvp.toFixed(1)} mPAP ${v.pap.map.toFixed(0)} HR ${v.hr.toFixed(0)} rapTm ${s.eq.rapTm.toFixed(1)}`);
}
