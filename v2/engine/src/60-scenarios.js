/* RESUS Sim v2 engine — scenario library.
 *
 * In v2 a preset sets the patient's PHYSIOLOGY (volume, vascular tone, contractility,
 * lung mechanics, shunt…) and the engine works out the monitor numbers. Each preset
 * carries `expect`: the ranges the measured vitals should settle into. Those ranges come
 * from v1's preset numbers (the shock CO/SVR/CVP triads) and standard clinical values,
 * and the validation tests check every preset against them — so a model change that
 * breaks a teaching scenario fails the build.
 *
 * Ventilator presets reuse v1's settings. v1's resistance was the TOTAL seen by the
 * ventilator; here lungs.resistance is the patient's airways and the ETT adds 5.
 *
 * expect keys are paths into sim.vitals ('abp.sys', 'vent.pip', 'co' …): [min, max].
 */
(function (R) {
  'use strict';
  const U = R.util;

  const SEDATED = { breathing: { effort: 0 } };
  const vent = (v, lungs, extra) => U.deepMerge(U.deepMerge({ vent: v, lungs }, SEDATED), extra || {});

  R.SCENARIOS = [
    // ---------------- haemodynamic ----------------
    { id: 'normal', group: 'hemo', label: 'Healthy / normal baseline', v1: 'Healthy / normal baseline',
      params: {},
      expect: { hr: [68, 88], 'abp.sys': [105, 135], 'abp.dia': [60, 85], 'abp.map': [80, 100], co: [4.5, 6.8], cvp: [1, 8], spo2: [95, 100], paco2: [35, 45], etco2: [32, 43], rr: [12, 16] },
      notes: 'Reference patient. Dicrotic notch on the arterial line, a/c/v waves on the CVP.' },

    { id: 'septic', group: 'hemo', label: 'Septic shock', v1: 'Septic shock',
      params: { heart: { rhythm: 'sinustach', hr: 75, contractility: 0.85 }, vessels: { svr: 330 }, volume: { venousTone: 1.10 },
        metabolism: { vo2Factor: 1.3 }, lungs: { shunt: 0.15, deadSpace: 0.12 }, breathing: { rate: 28, effort: 9 } },
      expect: { hr: [110, 135], 'abp.sys': [80, 105], 'abp.dia': [32, 52], 'abp.map': [50, 68], co: [6.5, 9.5], svr: [400, 720], cvp: [2, 9], spo2: [89, 96], etco2: [20, 32] },
      notes: 'Vasodilated, hyperdynamic: wide pulse pressure, low diastolic, high CO / low SVR, warm periphery (high PI).' },

    { id: 'cardiogenic', group: 'hemo', label: 'Cardiogenic shock', v1: 'Cardiogenic shock',
      params: { heart: { rhythm: 'sinustach', hr: 85, contractility: 0.27, rvContractility: 0.5 }, lungs: { shunt: 0.06 },
        volume: { bloodVolume: 4550 * 1.12, venousTone: 0.9 },   // chronic fluid retention + neurohormonal venoconstriction
        breathing: { rate: 26, effort: 6 } },
      expect: { hr: [105, 135], 'abp.sys': [78, 100], 'abp.map': [62, 82], co: [2.6, 4.2], svr: [1200, 2000], cvp: [13, 22], pcwp: [20, 35], spo2: [86, 94] },
      notes: 'Pump failure: narrow pulse pressure, high SVR, raised CVP and wedge, pulmonary oedema widens the shunt.' },

    { id: 'haemorrhagic', group: 'hemo', label: 'Haemorrhagic shock', v1: 'Haemorrhagic shock',
      params: { volume: { bloodVolume: 4550 * 0.67 }, heart: { rhythm: 'sinustach', hr: 80 }, breathing: { rate: 24, effort: 8 } },
      expect: { hr: [115, 145], 'abp.sys': [70, 92], co: [2.8, 4.4], svr: [1350, 2100], cvp: [-1, 4], spo2: [94, 100] },
      notes: '~33 % blood loss with full baroreflex compensation: tachycardia, narrow pulse pressure, low CVP. Ventilate with PPV and watch PPV/SVV climb.' },

    { id: 'pe', group: 'hemo', label: 'Obstructive — massive PE', v1: 'Obstructive (PE / tamponade)',
      params: { vessels: { pvr: 700 }, heart: { rhythm: 'sinustach', hr: 92, rvContractility: 0.5 }, lungs: { deadSpace: 0.40, shunt: 0.15 },
        volume: { venousTone: 0.8 }, breathing: { rate: 28, effort: 10 } },
      expect: { hr: [110, 140], 'abp.sys': [80, 105], co: [2.6, 4.3], cvp: [12, 22], 'pap.map': [28, 48], pcwp: [0, 12], etco2: [16, 30], spo2: [86, 95] },
      notes: 'RV pressure overload: high CVP and PA pressure, LOW wedge, wide PaCO2–EtCO2 gap (dead space).' },

    { id: 'tamponade', group: 'hemo', label: 'Obstructive — tamponade',
      params: { thorax: { pericardial: 14 }, heart: { rhythm: 'sinustach', hr: 75 }, volume: { venousTone: 0.9 }, breathing: { rate: 24, effort: 8 } },
      expect: { hr: [105, 140], 'abp.sys': [75, 100], co: [2.5, 4.4], cvp: [13, 22] },
      notes: 'Equalised diastolic pressures (CVP ≈ wedge), blunted y descent, pulsus paradoxus with spontaneous breaths.' },

    { id: 'tension', group: 'hemo', label: 'Tension pneumothorax (ventilated)',
      params: vent({ mode: 'VC', vt: 450, flow: 50, rr: 16, peep: 5, fio2: 50 }, { compliance: 25, resistance: 4, shunt: 0.30 },
        { thorax: { pplOffset: 14, venousObstruction: 1.5 }, heart: { hr: 85 } }),
      expect: { hr: [110, 150], 'abp.sys': [55, 90], cvp: [14, 26], spo2: [70, 90], 'vent.pip': [30, 50] },
      notes: 'Rising airway pressures, hypoxia, obstructive shock. Decompress (pplOffset → 0, venousObstruction → 1) and it recovers.' },

    { id: 'istemi', group: 'hemo', label: 'Inferior STEMI (RV involvement)', v1: 'Inferior STEMI',
      params: { heart: { rhythm: 'istemi', hr: 50, contractility: 0.8, rvContractility: 0.55 }, reflex: { baro: 0.4 }, breathing: { rate: 20, effort: 8 } },
      expect: { hr: [50, 64], 'abp.sys': [85, 112], cvp: [8, 16], co: [3.0, 4.8] },
      notes: 'Bradycardic with RV infarction: raised CVP with clear lungs — preload dependent (fluid helps, nitrates hurt).' },

    { id: 'respfail', group: 'hemo', label: 'Respiratory failure (spontaneous)', v1: 'Respiratory failure',
      params: { heart: { rhythm: 'sinustach', hr: 98 }, vessels: { svr: 1450 }, reflex: { baro: 0.5 }, lungs: { compliance: 40, resistance: 7, shunt: 0.14, vqMismatch: 0.15, deadSpace: 0.12 },
        metabolism: { vo2Factor: 1.25 }, breathing: { rate: 23, effort: 5.5 } },   // fatigued: the CO2 drive pushes it to ~31/min
      expect: { hr: [100, 125], 'abp.sys': [108, 145], spo2: [76, 88], paco2: [50, 68], etco2: [44, 62], rr: [30, 34] },
      notes: 'Rapid shallow breathing: high dead-space ventilation → hypercapnia; shunt + V/Q mismatch → hypoxaemia that partly responds to O2.' },

    { id: 'vf', group: 'arrest', label: 'Cardiac arrest — VF', v1: 'Cardiac arrest — VF',
      params: { heart: { rhythm: 'vf' }, breathing: { effort: 0 } }, settle: 20,
      expect: { co: [0, 0.05], 'abp.map': [6, 16], cvp: [6, 16] },
      notes: 'No output: arterial and venous pressures meet at mean systemic filling pressure; no pleth, no SpO2, EtCO2 falls to zero.' },

    { id: 'asystole', group: 'arrest', label: 'Cardiac arrest — asystole', v1: 'Cardiac arrest — asystole',
      params: { heart: { rhythm: 'asystole' }, breathing: { effort: 0 } }, settle: 20,
      expect: { co: [0, 0.05], 'abp.map': [6, 16] } },

    { id: 'pea', group: 'arrest', label: 'Cardiac arrest — PEA',
      params: { heart: { rhythm: 'pea', hr: 45 }, breathing: { effort: 0 } }, settle: 20,
      expect: { hr: [38, 52], co: [0, 0.05], 'abp.map': [6, 16] },
      notes: 'Organised complexes on the ECG (the monitor still counts a heart rate) with no pulse and no pleth.' },

    // ---------------- ventilator (v1 presets) ----------------
    { id: 'v-normal', group: 'vent', label: 'Normal lungs', v1: 'Normal lungs',
      params: vent({ mode: 'VC', vt: 450, flow: 50, rr: 14, peep: 5, fio2: 30 }, { compliance: 55, resistance: 3 }),
      expect: { 'vent.pip': [16, 22], 'vent.pplat': [12, 15.5], 'vent.peepi': [0, 0.5], 'vent.vte': [440, 460], spo2: [97, 100], paco2: [35, 45] } },

    { id: 'v-ards-mild', group: 'vent', label: 'ARDS — mild', v1: 'ARDS — mild',
      params: vent({ mode: 'VC', vt: 400, flow: 55, rr: 20, peep: 8, fio2: 50 }, { compliance: 45, resistance: 4, shunt: 0.18, recruitability: 0.4, ecwFrac: 0.35 }),
      expect: { 'vent.pplat': [15, 19], 'vent.dp': [8, 10], spo2: [94, 100], pf: [200, 320] } },

    { id: 'v-ards-mod', group: 'vent', label: 'ARDS — moderate', v1: 'ARDS — moderate',
      params: vent({ mode: 'VC', vt: 360, flow: 55, rr: 24, peep: 12, fio2: 70 }, { compliance: 32, resistance: 5, shunt: 0.32, recruitability: 0.5, ecwFrac: 0.3, deadSpace: 0.30 }),
      expect: { 'vent.pplat': [21, 26], 'vent.dp': [10, 13], spo2: [90, 100], pf: [100, 200], paco2: [38, 55] } },

    { id: 'v-ards-severe', group: 'vent', label: 'ARDS — severe', v1: 'ARDS — severe',
      params: vent({ mode: 'PC', pc: 18, itime: 1.0, rr: 28, peep: 15, fio2: 90 }, { compliance: 20, resistance: 7, shunt: 0.65, recruitability: 0.55, ecwFrac: 0.25, deadSpace: 0.45 }),
      expect: { 'vent.pplat': [29, 34], 'vent.vte': [280, 380], spo2: [82, 96], pf: [50, 100], paco2: [42, 70] } },

    { id: 'v-copd', group: 'vent', label: 'COPD exacerbation', v1: 'COPD exacerbation',
      params: vent({ mode: 'VC', vt: 480, flow: 70, rr: 16, peep: 6, fio2: 40 }, { compliance: 70, resistance: 21, vqMismatch: 0.25, deadSpace: 0.20 }),
      expect: { 'vent.pip': [38, 50], 'vent.pplat': [14, 20], 'vent.peepi': [1, 4], spo2: [90, 100] },
      notes: 'High compliance, high resistance: long expiratory time constant; expiratory flow still running when the next breath starts. Rate 16 (v1: 12) so the air trapping is visible.' },

    { id: 'v-asthma', group: 'vent', label: 'Status asthmaticus', v1: 'Status asthmaticus',
      params: vent({ mode: 'PC', pc: 22, itime: 0.9, rr: 14, peep: 5, fio2: 60 }, { compliance: 50, resistance: 40, vqMismatch: 0.2, deadSpace: 0.15 }),
      expect: { 'vent.peepi': [1.5, 8], 'vent.vte': [250, 450], paco2: [45, 75] },
      notes: 'Extreme resistance: small delivered VT in PC, air trapping (auto-PEEP), shark-fin capnogram.' },

    { id: 'v-prvc', group: 'vent', label: 'PRVC — volume target', v1: 'PRVC — volume target',
      params: vent({ mode: 'PRVC', vt: 420, itime: 1.0, rr: 18, peep: 8, fio2: 50 }, { compliance: 38, resistance: 6 }),
      expect: { 'vent.vte': [395, 445], 'vent.pip': [16, 28] } },

    { id: 'v-ps', group: 'vent', label: 'PS weaning trial', v1: 'PS weaning trial',
      params: { vent: { mode: 'PS', ps: 10, cycle: 25, rise: 0.15, peep: 5, fio2: 30 }, lungs: { compliance: 55, resistance: 5 }, breathing: { rate: 18, effort: 3 } },
      expect: { 'vent.rr': [17, 19], 'vent.vte': [400, 650], 'vent.pip': [14, 16.5], spo2: [96, 100], paco2: [22, 40] },
      notes: 'PS 10 on a patient with modest drive: VT ~500 at 18/min over-ventilates (PaCO2 high-20s) — a cue to wean the support.' },
  ];

  // One-line physiology summary per preset (shown under the preset button).
  const TAGS = {
    normal: 'Healthy adult · room air',
    septic: 'Low SVR · venodilated · high VO₂',
    cardiogenic: 'Weak LV + RV · fluid retention',
    haemorrhagic: '~33 % blood loss · full reflexes',
    pe: 'PVR ×7 · RV failure · dead space',
    tamponade: 'Pericardial pressure 14 mmHg',
    tension: 'Pleural +14 mmHg · ventilated',
    istemi: 'Bradycardia · RV infarct',
    respfail: 'Shunt + V/Q · rapid shallow',
    vf: 'No output', asystole: 'No output', pea: 'Organised ECG · no output',
    'v-normal': 'VC · C 55 · R 8', 'v-ards-mild': 'VC · C 45 · shunt 18 %', 'v-ards-mod': 'VC · C 32 · PEEP 12',
    'v-ards-severe': 'PC · C 20 · PEEP 15', 'v-copd': 'VC · C 70 · R 26', 'v-asthma': 'PC · R 45 · auto-PEEP',
    'v-prvc': 'PRVC · target 420', 'v-ps': 'PS 10 · patient-triggered',
  };
  R.SCENARIOS.forEach((s) => { s.tag = TAGS[s.id] || ''; });

  R.scenario = function (id) {
    const s = R.SCENARIOS.find((x) => x.id === id);
    return s ? U.clone(s) : null;
  };

  // Read a dotted path out of a vitals object ('abp.sys' → v.abp.sys).
  R.pick = function (obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  };
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
