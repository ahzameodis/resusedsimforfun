/* Quick look at one patient: node tools/peek.js '{"heart":{"hr":120}}' [seconds] */
'use strict';
const R = require('..');
const patch = process.argv[2] ? JSON.parse(process.argv[2]) : {};
const secs = +(process.argv[3] || 30);
const sim = new R.Sim(patch, { seed: 1 });
sim.run(secs);
const v = sim.vitals, f = (x, d = 0) => (x == null || isNaN(x) ? '--' : (+x).toFixed(d));
console.log(`HR ${f(v.hr)} pulse ${f(v.pulse)} | ABP ${f(v.abp.sys)}/${f(v.abp.dia)} (${f(v.abp.map)}) | CVP ${f(v.cvp,1)} PCWP ${f(v.pcwp,1)} PAP ${f(v.pap.sys)}/${f(v.pap.dia)} (${f(v.pap.map)})`);
console.log(`CO ${f(v.co,2)} SV ${f(v.sv)} SVR ${f(v.svr)} PPV ${f(v.ppv,1)}% | SpO2 ${f(v.spo2)} PaO2 ${f(v.pao2)} PaCO2 ${f(v.paco2,1)} EtCO2 ${f(v.etco2,1)} RR ${f(v.rr,1)} | PI ${f(v.pi,2)}`);
if (v.vent) { const w = v.vent; console.log(`vent PIP ${f(w.pip,1)} Pplat ${f(w.pplat,1)} PEEPtot ${f(w.peepTot,1)} PEEPi ${f(w.peepi,1)} VTi ${f(w.vti)} VTe ${f(w.vte)} MV ${f(w.mv,1)} RR ${f(w.rr,1)} Ti ${f(w.ti,2)} dP ${f(w.dp,1)} Cstat ${f(w.cstat)} Cdyn ${f(w.cdyn)}`); }
console.log('eq', Object.fromEntries(Object.entries(v.eq).map(([k, x]) => [k, +(+x).toFixed(2)])), 'baro', Object.fromEntries(Object.entries(v.baro).map(([k, x]) => [k, +(+x).toFixed(2)])));
