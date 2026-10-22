
class Component extends DCLogic {
  RHYTHMS = [
    { k:'sinus',     label:'Sinus rhythm' },
    { k:'sinustach', label:'Sinus tachycardia' },
    { k:'sinusbrad', label:'Sinus bradycardia' },
    { k:'istemi',    label:'Inferior STEMI' },
    { k:'af',        label:'Atrial fibrillation' },
    { k:'svt',       label:'SVT' },
    { k:'vt',        label:'VT (monomorphic)' },
    { k:'vf',        label:'Ventricular fibrillation' },
    { k:'torsades',  label:'Torsades de pointes' },
    { k:'asystole',  label:'Asystole' },
  ];
  // sv = stroke volume (mL), cvp = central venous pressure (mmHg),
  // ppv = respiratory pulse-pressure/pleth variation (%). CO = HR·SV/1000,
  // SVR = 80·(MAP−CVP)/CO — the shock states differ in this triad.
  PRESETS = [
    { label:'Healthy / normal baseline', accent:'#12B981', rhythm:'sinus',     hr:78,  rr:14, spo2:98, sys:122, dia:78, etco2:38, sv:75, cvp:8,  ppv:8  },
    { label:'Cardiogenic shock',         accent:'#F5A623', rhythm:'sinustach', hr:118, rr:26, spo2:90, sys:88,  dia:72, etco2:30, sv:30, cvp:18, ppv:10 },
    { label:'Cardiac arrest — VF',       accent:'#F0483E', rhythm:'vf',        hr:0,   rr:0,  spo2:0,  sys:0,   dia:0,  etco2:18, sv:0,  cvp:0,  ppv:0  },
    { label:'Cardiac arrest — asystole', accent:'#F0483E', rhythm:'asystole',  hr:0,   rr:0,  spo2:0,  sys:0,   dia:0,  etco2:8,  sv:0,  cvp:0,  ppv:0  },
    { label:'Inferior STEMI',            accent:'#F5A623', rhythm:'istemi',    hr:52,  rr:20, spo2:94, sys:102, dia:64, etco2:36, sv:72, cvp:10, ppv:8  },
    { label:'Respiratory failure',       accent:'#67DCFF', rhythm:'sinustach', hr:112, rr:32, spo2:82, sys:128, dia:82, etco2:55, sv:68, cvp:8,  ppv:10 },
    { label:'Haemorrhagic shock',        accent:'#F0483E', rhythm:'sinustach', hr:128, rr:24, spo2:95, sys:84,  dia:66, etco2:28, sv:28, cvp:2,  ppv:22 },
    { label:'Septic shock',              accent:'#587DFF', rhythm:'sinustach', hr:122, rr:28, spo2:93, sys:92,  dia:40, etco2:26, sv:62, cvp:5,  ppv:12 },
    { label:'Obstructive (PE / tamponade)', accent:'#587DFF', rhythm:'sinustach', hr:120, rr:26, spo2:90, sys:94, dia:76, etco2:24, sv:30, cvp:17, ppv:20 },
  ];
  VITAL_DEF = [
    { key:'hr',    label:'Heart rate',     min:0, max:220, color:'#22e34a' },
    { key:'rr',    label:'Resp rate',      min:0, max:60,  color:'#cfd4d8' },
    { key:'spo2',  label:'SpO₂',           min:0, max:100, color:'#67DCFF' },
    { key:'sys',   label:'Systolic BP',    min:0, max:260, color:'#ff7b7b' },
    { key:'dia',   label:'Diastolic BP',   min:0, max:160, color:'#ff7b7b' },
    { key:'etco2', label:'ETCO₂',          min:0, max:100, color:'#e8e8e8' },
    { key:'cvp',   label:'CVP',            min:0, max:30,  color:'#ffd60a' },
    { key:'sv',    label:'Stroke volume',  min:0, max:150, color:'#c98bff' },
  ];
  HEMO_DEFAULTS = { sv:75, cvp:8, ppv:8 };

  VENT_MODES = [
    { k:'VC',   label:'Volume control' },
    { k:'PC',   label:'Pressure control' },
    { k:'PRVC', label:'PRVC' },
    { k:'PS',   label:'Pressure support' },
    { k:'CPAP', label:'CPAP' },
  ];
  VENT_PARAMS = {
    vRR:    { label:'Rate',              min:4,  max:40,  step:1,    unit:'bpm' },
    vVt:    { label:'Tidal volume',      min:200,max:800, step:10,   unit:'mL' },
    vTgt:   { label:'Target volume',     min:200,max:800, step:10,   unit:'mL' },
    vFlow:  { label:'Insp. flow',        min:20, max:90,  step:5,    unit:'L/min' },
    vPc:    { label:'Pressure control',  min:5,  max:35,  step:1,    unit:'cmH₂O' },
    vItime: { label:'Insp. time',        min:0.4,max:2.0, step:0.1,  unit:'s' },
    vRise:  { label:'Rise time',         min:0.05,max:0.6,step:0.05, unit:'s' },
    vPs:    { label:'Pressure support',  min:0,  max:30,  step:1,    unit:'cmH₂O' },
    vCycle: { label:'Flow cycle',        min:5,  max:60,  step:5,    unit:'%' },
    vPeep:  { label:'PEEP',              min:0,  max:24,  step:1,    unit:'cmH₂O' },
    vFio2:  { label:'FiO₂',              min:21, max:100, step:1,    unit:'%' },
    vComp:  { label:'Compliance',        min:12, max:80,  step:1,    unit:'mL/cmH₂O' },
    vRaw:   { label:'Resistance',        min:4,  max:40,  step:1,    unit:'cmH₂O/L/s' },
    vPause: { label:'Insp. pause',       min:0,  max:1.5, step:0.1,  unit:'s' },
  };
  MODE_PARAMS = {
    VC:   ['vRR','vVt','vFlow','vPause','vPeep','vFio2'],
    PC:   ['vRR','vPc','vItime','vRise','vPeep','vFio2'],
    PRVC: ['vRR','vTgt','vItime','vPeep','vFio2'],
    PS:   ['vPs','vCycle','vRise','vPeep','vFio2'],
    CPAP: ['vPeep','vFio2'],
  };
  VENT_PRESETS = [
    { label:'Normal lungs',            accent:'#12B981', vMode:'VC',   vVt:450, vFlow:50, vRR:14, vPeep:5,  vFio2:30, vComp:55, vRaw:8  },
    { label:'ARDS — mild',             accent:'#F5A623', vMode:'VC',   vVt:400, vFlow:55, vRR:20, vPeep:8,  vFio2:50, vComp:45, vRaw:9  },
    { label:'ARDS — moderate',         accent:'#F5A623', vMode:'VC',   vVt:360, vFlow:55, vRR:24, vPeep:12, vFio2:70, vComp:32, vRaw:10 },
    { label:'ARDS — severe',           accent:'#F0483E', vMode:'PC',   vPc:18, vItime:1.0, vRR:28, vPeep:15, vFio2:90, vComp:20, vRaw:12 },
    { label:'COPD exacerbation',       accent:'#587DFF', vMode:'VC',   vVt:480, vFlow:70, vRR:12, vPeep:6,  vFio2:40, vComp:55, vRaw:26 },
    { label:'Status asthmaticus',      accent:'#F0483E', vMode:'PC',   vPc:22, vItime:0.9, vRR:12, vPeep:5,  vFio2:60, vComp:50, vRaw:36 },
    { label:'PRVC — volume target',    accent:'#67DCFF', vMode:'PRVC', vTgt:420, vItime:1.0, vRR:18, vPeep:8, vFio2:50, vComp:38, vRaw:11 },
    { label:'PS weaning trial',        accent:'#12B981', vMode:'PS',   vPs:10, vCycle:25, vRise:0.15, vPeep:5, vFio2:30, vComp:55, vRaw:10 },
  ];
  VENT_DEFAULTS = { vMode:'VC', vFlowPat:'const', vRR:14, vVt:450, vTgt:450, vFlow:50, vPause:0.2, vPc:15, vItime:1.0, vRise:0.15, vPs:12, vCycle:25, vPeep:5, vFio2:40, vComp:50, vRaw:10, vHeight:170 };

  // ---------- v2 physiology mode ----------
  // The instructor sets the patient's physiology; the engine (window.ResusEngine) computes
  // every number. Flat so it syncs over MQTT like the rest of `live`. `epoch` increments when
  // a whole new patient is loaded (preset / profile) so every screen re-settles its engine.
  PHYS_DEFAULT = { epoch:0, preset:'normal', weight:70, hr:75, atrialRate:80, contractility:1, rvContractility:1, svr:1150, pvr:100,
                   bvPct:100, venousTone:1, pericardial:0, pplOffset:0, venousObstruction:1, baro:1,
                   compliance:60, resistance:4, shunt:0.03, vq:0, deadSpace:0.05, recruit:0, ecwFrac:0.45,
                   spRate:14, effort:9, o2:21, vo2Factor:1, hb:13.5, ventilated:false, paCath:false,
                   autoArrest:true, shockMode:'auto', paceThreshold:65 };
  // [key, label, min, max, step, unit, pct] — pct: stored as a fraction, shown as %
  PHYS_CIRC = [
    ['hr','Resting heart rate',20,220,1,'bpm'], ['contractility','LV contractility',0.1,1.5,0.05,'× normal'],
    ['rvContractility','RV contractility',0.1,1.5,0.05,'× normal'], ['svr','Arteriolar tone (SVR)',200,2500,10,'dyn·s/cm⁵'],
    ['bvPct','Blood volume',40,140,1,'% of normal'], ['venousTone','Venous capacitance',0.8,1.2,0.01,'× (>1 venodilated)'],
    ['pvr','Pulmonary vascular resistance',50,1200,10,'dyn·s/cm⁵'], ['pericardial','Pericardial pressure',0,25,0.5,'mmHg'],
    ['pplOffset','Pleural pressure (pneumothorax)',0,25,0.5,'mmHg'], ['baro','Baroreflex gain',0,1,0.05,'× normal'],
  ];
  PHYS_LUNG = [
    ['compliance','Respiratory compliance',10,100,1,'mL/cmH₂O'], ['resistance','Airway resistance',1,50,0.5,'cmH₂O/L/s · +5 ETT'],
    ['shunt','Shunt',0,0.7,0.01,'%',1], ['vq','Low V/Q units',0,0.5,0.01,'%',1], ['deadSpace','Alveolar dead space',0,0.6,0.01,'%',1],
    ['recruit','Recruitability with PEEP',0,1,0.05,'%',1], ['spRate','Spontaneous rate',0,40,1,'/min'],
    ['effort','Inspiratory effort',0,15,0.5,'cmH₂O'], ['o2','FiO₂ (not ventilated)',21,100,1,'%'],
  ];
  PHYS_ACCENT = { normal:'#12B981', septic:'#587DFF', cardiogenic:'#F5A623', haemorrhagic:'#F0483E', pe:'#587DFF', tamponade:'#587DFF',
                  tension:'#F0483E', istemi:'#F5A623', respfail:'#67DCFF', vf:'#F0483E', asystole:'#F0483E', pea:'#F0483E',
                  'v-normal':'#12B981', 'v-ards-mild':'#F5A623', 'v-ards-mod':'#F5A623', 'v-ards-severe':'#F0483E', 'v-copd':'#587DFF',
                  'v-asthma':'#F0483E', 'v-prvc':'#67DCFF', 'v-ps':'#12B981' };

  // ---------- v2 step E ----------
  // alarm limits, shared by every screen (instructor sets them)
  ALARM_DEFAULT = { hrLo:50, hrHi:120, spo2Lo:90, sysLo:90, sysHi:180, mapLo:65, etco2Lo:25, etco2Hi:50, rrLo:8, rrHi:30, pipHi:35 };
  // [low key, high key, label, unit, step, min, max]
  ALARM_ROWS = [ ['hrLo','hrHi','Heart rate','bpm',5,20,220], ['spo2Lo',null,'SpO₂','%',1,70,99], ['sysLo','sysHi','Systolic BP','mmHg',5,50,250],
    ['mapLo',null,'MAP','mmHg',5,40,120], ['etco2Lo','etco2Hi','EtCO₂','mmHg',1,5,80], ['rrLo','rrHi','Resp rate','/min',1,2,60], [null,'pipHi','Peak airway pressure','cmH₂O',1,15,60] ];
  // chest compressions and the transcutaneous pacer: settings every screen's engine runs from
  RESUS_DEFAULT = { cpr:false, cprQ:'good', pace:false, paceRate:70, paceMA:0 };
  CPR_Q = { good:{label:'Good', rate:110, depth:1}, shallow:{label:'Shallow', rate:110, depth:0.5}, slow:{label:'Too slow', rate:80, depth:1}, fast:{label:'Too fast', rate:150, depth:1} };
  SHOCK_MODES = [['auto','Physiology decides'],['convert','Shocks always work'],['refractory','Refractory VF']];
  PROCS = [['suction','Suction / change tube'],['reconnect','Reconnect circuit'],['withdraw','Withdraw tube 2 cm'],['reintubate','Re-intubate'],
    ['decompress','Needle decompression'],['drain','Pericardiocentesis'],['control','Control the bleeding'],['lyse','Thrombolysis']];

  // ---------- scripted scenario timelines ----------
  // what a step waits for, and what it does when it fires (one order each)
  SCRIPT_WHEN = [['time','At a time (T+ from Start)'],['after','After the previous step'],['spo2','SpO₂ falls below'],['sbp','Systolic BP falls below'],
    ['shock','A shock is delivered'],['treat','A treatment is given'],['rhythm','A rhythm is reached']];
  SCRIPT_ACTS = [['event','Start an event'],['rhythm','Set the rhythm'],['phys','Change a physiology setting'],['shockMode','Set the shock outcome'],['note','Add a note to the log']];
  SCRIPT_ORDERS = ['rhythm','phys','shockMode','note'];   // order kinds only the instructor's screen (or its script) may send
  // Calibrated on the engine (values within the Controller's own ranges): untreated, the septic patient's SBP is
  // ~72 by 8 min, so it decompensates at ~8:30, loses the pulse at ~15 min and the engine declares PEA at ~18 min.
  // 2 L of crystalloid, or noradrenaline, keeps SBP 82–97 and the script waits at step 6. The VF script makes
  // every shock fail until amiodarone has been given; the next shock then works.
  SCRIPT_EXAMPLES = [
    { name:'Septic shock — deteriorates without treatment', scenario:'septic', steps:[
      { when:{k:'time', t:0}, act:{k:'note', text:'Urosepsis. Untreated, the sepsis worsens every 2 min; 30 s of systolic below 75 tips the patient into decompensation, then arrest. Fluids or a vasopressor hold it off.'} },
      { when:{k:'time', t:120}, act:{k:'phys', key:'svr', v:250} },
      { when:{k:'time', t:240}, act:{k:'phys', key:'bvPct', v:85} },
      { when:{k:'time', t:360}, act:{k:'phys', key:'contractility', v:0.55} },
      { when:{k:'time', t:480}, act:{k:'phys', key:'shunt', v:0.3} },
      { when:{k:'sbp', v:75, hold:30}, act:{k:'note', text:'Decompensating — systolic below 75 without effective treatment'} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'contractility', v:0.35} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'svr', v:200} },
      { when:{k:'sbp', v:62, hold:60}, act:{k:'phys', key:'contractility', v:0.2} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'bvPct', v:70} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'venousTone', v:1.2} },
      { when:{k:'rhythm', v:'@arrest'}, act:{k:'note', text:'Cardiac arrest from untreated septic shock'} },
    ]},
    { name:'VF arrest — refractory, ROSC after amiodarone', scenario:'vf', steps:[
      { when:{k:'time', t:0}, act:{k:'shockMode', v:'refractory'} },
      { when:{k:'time', t:0}, act:{k:'note', text:'Witnessed VF arrest. Every shock fails until amiodarone has been given; the next shock after it restores a circulation.'} },
      { when:{k:'treat', v:'drug:amiodarone'}, act:{k:'shockMode', v:'convert'} },
      { when:{k:'rhythm', v:'@pulse'}, act:{k:'note', text:'ROSC after amiodarone and defibrillation — post-resuscitation care'} },
      { when:{k:'after', t:0}, act:{k:'shockMode', v:'auto'} },
    ]},
    // From "Cardiogenic Shock Simulation V2" (inferior STEMI, RV-predominant shock, iatrogenic deterioration).
    // Calibrated on the engine for a 59-year-old man: Phase I 85/50, HR 36, CVP 16, wedge 4 (dry lungs),
    // SpO₂ 93–96 % — stable untreated; atropine → HR ~62. Phase II perfusing VT 150 at ~67/51 (the document's
    // 180/min leaves too little stroke volume per beat for a palpable pulse in the engine; at 150 the pulse holds
    // even with push-dose adrenaline and 1.25 L of fluid on board, ~86/70 at 165). Phase III complete heart block ~40,
    // 82–122 systolic at ROSC depending on the oxygen debt the arrest left (checked at 0 and the maximum 0.5, with and
    // without the fluid load); unsupported it sags to the 60s by ~7 min; noradrenaline 0.05 + dobutamine 5 hold
    // ~92–100 at 8 min; pacing at 70 lifts CO to ~3.9 L/min. A weaker post-ROSC heart re-arrests from that debt.
    // Trap 2 (any-time steps): the engine's phenylephrine and vasopressin raise SVR only, and at this output even PVR
    // 1200 (the slider maximum) can't outweigh that — phenylephrine 100 mcg still lifts SBP from ~87 to ~91. So the
    // trap also takes RV contractility to 0.25: SBP falls to ~68 at once, and with the drug acting peaks ~78
    // (100 mcg) / ~86 (200 mcg) / 72–84 (vasopressin 0.01–0.03 U/min) before settling ~64; ~64 without the drug,
    // no arrest (0.2 arrests in ~8 min). After atropine (~113) it falls to 77–100. Phenylephrine infusions
    // ≥ 0.5 mcg/kg/min and vasopressin 0.06 U/min end near or a little above the untreated SBP. Left in place it makes
    // Phase II's VT pulseless and ROSC weak (~72 sagging to 50, or re-arrest), so Phase II sets PVR / RV back.
    { name:'Cardiogenic shock — RV infarct, VT/VF, ROSC in heart block', scenario:'istemi', patient:{ name:'Ibrahim Naseer', age:'59', sex:'M' }, steps:[
      // Phase I — arrival and phenotyping: bradycardic inferior STEMI with RV infarction; cold, dry lungs, plethoric IVC
      { when:{k:'time', t:0}, act:{k:'note', text:'Phase I — RV-infarct cardiogenic shock (inferior STEMI, HR 36). Phase II starts as soon as 1 L of fluid has been ordered, or at T+7:00. Phenylephrine or vasopressin at any point drops the BP (Trap 2).'} },
      { when:{k:'time', t:0}, act:{k:'note', text:'Cues if asked: cool, mottled to the knees, lungs clear, T 35.9 °C, GCS 15. V4R: ST elevation. POCUS: dilated, poorly contractile RV, D-shaped septum, underfilled LV, no effusion, A-lines, plethoric IVC.'} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'hr', v:36} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'baro', v:0} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'rvContractility', v:0.35} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'svr', v:2500} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'bvPct', v:110} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'venousTone', v:0.9} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'spRate', v:33} },
      { when:{k:'time', t:0}, act:{k:'phys', key:'shunt', v:0.08} },
      // Trap 2 — pressor by habit, any time: a pure vasoconstrictor raises PVR and the ischaemic RV fails further
      { when:{k:'treat', v:'drug:phenylephrine', any:true}, act:{k:'phys', key:'pvr', v:1200} },
      { when:{k:'after', t:0, any:true}, act:{k:'phys', key:'rvContractility', v:0.25} },
      { when:{k:'after', t:0, any:true}, act:{k:'note', text:'Trap 2 — pressor by habit: phenylephrine is a pure vasoconstrictor. PVR rises and the ischaemic RV fails further, so the BP falls. Reward phenotype-based inotrope / inodilator selection. PVR 1200 and RV contractility 0.25 hold until Phase II starts (to the end, if it already has).'} },
      { when:{k:'treat', v:'drug:vasopressin', any:true}, act:{k:'phys', key:'pvr', v:1200} },
      { when:{k:'after', t:0, any:true}, act:{k:'phys', key:'rvContractility', v:0.25} },
      { when:{k:'after', t:0, any:true}, act:{k:'note', text:'Trap 2 — pressor by habit: vasopressin is a pure vasoconstrictor. PVR rises and the ischaemic RV fails further, so the BP falls. Reward phenotype-based inotrope / inodilator selection. PVR 1200 and RV contractility 0.25 hold until Phase II starts (to the end, if it already has).'} },
      // Phase II — an aggressive fluid load (≥ 1 L) over-distends the RV, or 7 min pass: perfusing VT, then VF
      { when:{k:'treat', v:'vol:1000', by:420}, act:{k:'note', text:'Phase II — wide-complex tachycardia, still perfusing (drowsy, thready pulse). Cardioversion won’t hold: the ischaemic substrate regenerates VT.'} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'svr', v:1200} },
      // Trap 2's PVR / RV changes end here, so the VT keeps its pulse (no change when the trap hasn't fired)
      { when:{k:'after', t:0}, act:{k:'phys', key:'pvr', v:100} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'rvContractility', v:0.35} },
      { when:{k:'after', t:0}, act:{k:'phys', key:'hr', v:150} },
      { when:{k:'after', t:0}, act:{k:'rhythm', v:'vt'} },
      { when:{k:'after', t:0}, act:{k:'shockMode', v:'refractory'} },
      { when:{k:'after', t:150}, act:{k:'rhythm', v:'vf'} },
      { when:{k:'after', t:0}, act:{k:'note', text:'Pulse lost — VF. ROSC comes 1 min after the 3rd shock, once amiodarone and adrenaline 1 mg have been given.'} },
      // the ROSC physiology is set while still in VF, where it has no effect: escape rate 40, stunned LV
      { when:{k:'shock', n:3}, act:{k:'phys', key:'hr', v:40} },
      { when:{k:'treat', v:'drug:amiodarone'}, act:{k:'phys', key:'contractility', v:0.7} },
      { when:{k:'treat', v:'dose:adrenaline:3'}, act:{k:'note', text:'3 shocks, amiodarone and adrenaline 1 mg are in — ROSC in 1 min.'} },
      { when:{k:'after', t:60}, act:{k:'phys', key:'svr', v:1100} },
      { when:{k:'after', t:0}, act:{k:'rhythm', v:'avb3'} },
      { when:{k:'after', t:0}, act:{k:'shockMode', v:'auto'} },
      // Phase III — ROSC into complete heart block; the shock is unresolved however the BP looks
      { when:{k:'after', t:0}, act:{k:'note', text:'Phase III — ROSC: complete heart block ~40, inferior ST elevation persists. Lactate 6.8 mmol/L if drawn. Expected: pacing, post-arrest care, primary PCI.'} },
      { when:{k:'after', t:240}, act:{k:'note', text:'Repeat lactate 12.1 mmol/L — rising despite ROSC: the shock is unresolved, whatever the BP.'} },
      { when:{k:'after', t:240}, act:{k:'note', text:'End of scenario — transfer for primary PCI. Debrief the traps: fluids, pressor by habit, reflex cardioversion, anchoring on BP, losing reperfusion.'} },
    ]},
  ];

  DEFAULT = { name:'Sarah Allan', age:'58', sex:'F', simType:'hemo', rhythm:'sinus', hr:78, rr:14, spo2:98, sys:122, dia:78, etco2:38, sv:75, cvp:8, ppv:8,
              vMode:'VC', vFlowPat:'const', vRR:14, vVt:450, vTgt:450, vFlow:50, vPause:0.2, vPc:15, vItime:1.0, vRise:0.15, vPs:12, vCycle:25, vPeep:5, vFio2:40, vComp:50, vRaw:10, vHeight:170,
              engineMode:'manual', phys:{ ...this.PHYS_DEFAULT }, alarmLim:{ ...this.ALARM_DEFAULT }, resus:{ ...this.RESUS_DEFAULT } };

  constructor(props){
    super(props);
    const r = this.parseHash();
    const sid = r.sid || this.genId();
    this.state = { view:r.view, sid, live:this.loadLive(sid), profiles:this.loadProfiles(), clock:this.timeStr() };
    this._cid = Math.random().toString(36).slice(2,10);   // tags our MQTT publishes so we can drop their echoes
    this._refs = {
      root:(el)=>{this.root=el;}, qr:(el)=>{this.qrBox=el; if(el) this.mkQr();},
      dispC:(el)=>{this.dispCanvas=el;}, dispW:(el)=>{this.dispWrap=el;},
      prevC:(el)=>{this.prevCanvas=el;}, prevW:(el)=>{this.prevWrap=el;},
      dispVC:(el)=>{this.dispVentCanvas=el;}, dispVW:(el)=>{this.dispVentWrap=el;},
      prevVC:(el)=>{this.prevVentCanvas=el;}, prevVW:(el)=>{this.prevVentWrap=el;},
      pvC:(el)=>{this.pvCanvas=el;}, pvW:(el)=>{this.pvWrap=el;}, fvC:(el)=>{this.fvCanvas=el;}, fvW:(el)=>{this.fvWrap=el;},
      trC:(el)=>{this.trCanvas=el;}, trW:(el)=>{this.trWrap=el;},
    };
    if (!r.sid) this.setHash(r.view, sid);
  }

  // ---------- session / storage ----------
  genId(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let s=''; for(let i=0;i<7;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
  liveKey(id){ return 'resussim:'+id; }
  loadLive(id){ try{ const v=JSON.parse(localStorage.getItem(this.liveKey(id))); if(v) return this.normLive(v); }catch(e){} const d={...this.DEFAULT}; this.saveLive(id,d); return d; }
  // fill fields a v1 (or older v2) session never had
  normLive(v){ return {...this.VENT_DEFAULTS, ...this.HEMO_DEFAULTS, simType:'hemo', engineMode:'manual', ...v, phys:{...this.PHYS_DEFAULT, ...((v&&v.phys)||{})},
    alarmLim:{...this.ALARM_DEFAULT, ...((v&&v.alarmLim)||{})}, resus:{...this.RESUS_DEFAULT, ...((v&&v.resus)||{})}}; }
  saveLive(id,live){ try{ localStorage.setItem(this.liveKey(id), JSON.stringify(live)); }catch(e){} }
  loadProfiles(){ try{ return JSON.parse(localStorage.getItem('resussim:profiles'))||[]; }catch(e){ return []; } }
  saveProfilesLS(p){ try{ localStorage.setItem('resussim:profiles', JSON.stringify(p)); }catch(e){} }

  setLive(patch){ this.setState(s=>{ const live={...s.live,...patch}; this.saveLive(s.sid,live); return {live}; }); }
  // patch computed from the latest state (not this.state, which may not have rendered yet)
  updLive(fn){ this.setState(s=>{ const live={...s.live,...fn(s.live)}; this.saveLive(s.sid,live); return {live}; }); }

  // ---------- routing ----------
  parseHash(){
    const h=(location.hash||'').replace(/^#/,''); const [v,q]=h.split('?');
    const view=['home','control','display','trainee'].includes(v)?v:'home';
    let sid=null; if(q){ const m=q.match(/s=([^&]+)/); if(m) sid=decodeURIComponent(m[1]); }
    return { view, sid };
  }
  setHash(view,sid){ location.hash = view+'?s='+encodeURIComponent(sid); }
  nav(view){ this.setHash(view, this.state.sid); }

  componentDidMount(){
    this._onHash=()=>{ const r=this.parseHash(); const sid=r.sid||this.state.sid; this.setState({view:r.view, sid, live:this.loadLive(sid)}); };
    window.addEventListener('hashchange', this._onHash);
    // same-browser sync runs controller → display only: a display re-saves what it receives, and
    // a controller applying that copy would roll itself back to an older state
    this._onStorage=(e)=>{ if(e.key===this.cmdKey(this.state.sid)&&e.newValue){ this.onCmd(e.newValue); } if(e.key===this.liveKey(this.state.sid) && !this.isPublisher()){ try{ this.setState({live:this.normLive(JSON.parse(e.newValue))}); }catch(x){} } if(e.key===this.engKey(this.state.sid)&&e.newValue){ this.onEngineMsg(e.newValue); } if(e.key==='resussim:profiles'){ this.setState({profiles:this.loadProfiles()}); } };
    window.addEventListener('storage', this._onStorage);
    this._clk=setInterval(()=>{ this.setState({clock:this.timeStr()}); this.tick1s(); },1000);
    this._onUnload=()=>{ if(this._dDirty) this.saveD(); }; window.addEventListener('beforeunload', this._onUnload);
    this.mkQr();
    this.connectMqtt();
    const dpr=Math.min(window.devicePixelRatio||1,2); this._dpr=dpr;
    const loop=(now)=>{ this.drawAll(now/1000); this._raf=requestAnimationFrame(loop); }; this._raf=requestAnimationFrame(loop);
    // a hidden tab gets no animation frames: keep the patient alive (catching up in larger steps)
    this._bg=setInterval(()=>{ if(document.hidden && this._sim && this.state.view!=='home') this.stepEngine(performance.now()/1000, 60); }, 1000);
    window.__resussim=this;   // debugging handle (console / automated checks)
  }
  // only the instructor's device (home / controller) writes the shared state; displays and the
  // trainee console follow it, and the trainee sends orders on the command topic instead
  isPublisher(){ const v=this.state.view; return v!=='display' && v!=='trainee'; }
  componentDidUpdate(pp,ps){
    this._scrBusy=0;   // a fired script step's order has rendered: the script may evaluate its next step
    if(!ps||ps.sid!==this.state.sid||ps.view!==this.state.view) this.mkQr();
    if(ps && ps.sid!==this.state.sid){ this.subTopic(this.state.sid); if(this.isPublisher()) this.pubLive(); }
    else if(this.isPublisher() && JSON.stringify(this.state.live)!==this._lastMsg) this.pubLive();
  }
  componentWillUnmount(){ window.removeEventListener('beforeunload',this._onUnload); window.removeEventListener('hashchange',this._onHash); window.removeEventListener('storage',this._onStorage); clearInterval(this._clk); clearInterval(this._bg); cancelAnimationFrame(this._raf); clearTimeout(this._mqttWait); try{ this._mqtt&&this._mqtt.end(true); }catch(e){} }

  // ---------- realtime cross-device sync (public MQTT-over-WebSocket) ----------
  topicFor(sid){ return 'resussim/v1/'+sid+'/state'; }
  connectMqtt(){
    if(!window.mqtt){ this._sync='connecting'; this.forceUpdate(); this._mqttTries=(this._mqttTries||0)+1; if(this._mqttTries<=100){ clearTimeout(this._mqttWait); this._mqttWait=setTimeout(()=>this.connectMqtt(),150); } else { this._sync='off'; this.forceUpdate(); } return; }
    this._sync='connecting'; this.forceUpdate();
    try{
      this._mqtt = window.mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId:'resussim_'+Math.random().toString(16).slice(2), connectTimeout:8000, reconnectPeriod:3000, clean:true });
      this._mqtt.on('connect', ()=>{ this._sync='live'; this._subbed=null; this.subTopic(this.state.sid); if(this.isPublisher()) this.pubLive(); this.forceUpdate(); });
      this._mqtt.on('reconnect', ()=>{ this._sync='connecting'; this.forceUpdate(); });
      this._mqtt.on('offline', ()=>{ this._sync='off'; this.forceUpdate(); });
      this._mqtt.on('error', ()=>{ this._sync='off'; this.forceUpdate(); });
      this._mqtt.on('message', (t,payload)=>{ const s=payload.toString(); if(!s) return; if(t===this.engTopic(this.state.sid)){ this.onEngineMsg(s); return; } if(t===this.cmdTopic(this.state.sid)){ this.onCmd(s); return; }
        try{
          const obj=JSON.parse(s); if(!obj) return;
          // the broker echoes our own publishes back; an echo of an OLDER change arriving after a
          // newer local one used to roll the state back (e.g. while dragging a slider) — ignore them
          if(obj._src===this._cid) return;
          delete obj._src;
          const live=this.normLive(obj); this._lastMsg=JSON.stringify(live); this.saveLive(this.state.sid,live); this.setState({live});
        }catch(e){} });
    }catch(e){ this._sync='off'; this.forceUpdate(); }
  }
  subTopic(sid){ if(!this._mqtt) return; if(this._subbed===sid) return; const ts=(x)=>[this.topicFor(x), this.engTopic(x), this.cmdTopic(x)]; if(this._subbed) try{ this._mqtt.unsubscribe(ts(this._subbed)); }catch(e){} try{ this._mqtt.subscribe(ts(sid),{qos:0}); this._subbed=sid; }catch(e){} }
  pubLive(){ if(!this._mqtt||this._sync!=='live') return; try{ this._lastMsg=JSON.stringify(this.state.live); this._mqtt.publish(this.topicFor(this.state.sid), JSON.stringify({...this.state.live, _src:this._cid}), {retain:true, qos:0}); }catch(e){} }

  // ---------- v2 physiology engine ----------
  // Every screen runs its own engine from the shared settings (`live`), so waveforms are
  // generated locally and never streamed. The controller also publishes the engine's slow
  // state (reflexes, gas stores) ~1 Hz on a second topic; displays take only that state
  // (stateOnly), so a late message can never undo a newer setting.
  eng(){ return window.ResusEngine || null; }
  physMode(){ return this.state.live.engineMode==='physio' && !!this.eng(); }
  engTopic(sid){ return 'resussim/v1/'+sid+'/engine'; }
  engKey(sid){ return this.liveKey(sid)+':engine'; }
  bvNormal(l){ return ((l.sex==='M')?75:65)*((l.phys&&l.phys.weight)||70); }
  engineParams(l){
    const ph={...this.PHYS_DEFAULT, ...(l.phys||{})}, rs={...this.RESUS_DEFAULT, ...(l.resus||{})}, cq=this.CPR_Q[rs.cprQ]||this.CPR_Q.good;
    let mode=l.vMode||'VC'; if(mode==='VAC')mode='VC'; if(mode==='PAC')mode='PC';
    return {
      patient:{ sex:l.sex==='M'?'M':'F', age:+l.age||45, heightCm:+l.vHeight||170, weightKg:ph.weight },
      heart:{ rhythm:l.rhythm||'sinus', hr:ph.hr, atrialRate:ph.atrialRate, contractility:ph.contractility, rvContractility:ph.rvContractility },
      vessels:{ svr:ph.svr, pvr:ph.pvr },
      volume:{ bloodVolume:this.bvNormal(l)*ph.bvPct/100, venousTone:ph.venousTone },
      thorax:{ pplOffset:ph.pplOffset, pericardial:ph.pericardial, venousObstruction:ph.venousObstruction },
      lungs:{ compliance:ph.compliance, resistance:ph.resistance, shunt:ph.shunt, vqMismatch:ph.vq, deadSpace:ph.deadSpace, recruitability:ph.recruit, ecwFrac:ph.ecwFrac },
      metabolism:{ vo2Factor:ph.vo2Factor, hb:ph.hb },
      reflex:{ baro:ph.baro },
      breathing:{ rate:ph.spRate, effort:ph.effort },
      airway:{ fio2:ph.o2 },
      resus:{ cpr:!!rs.cpr, cprRate:cq.rate, cprDepth:cq.depth, pace:!!rs.pace, paceRate:+rs.paceRate, paceMA:+rs.paceMA, paceThreshold:+ph.paceThreshold,
        autoRhythm:ph.autoArrest!==false, shockMode:ph.shockMode||'auto' },
      vent: ph.ventilated ? { mode, rr:+l.vRR, vt:mode==='PRVC'?+l.vTgt:+l.vVt, flow:+l.vFlow, flowPattern:l.vFlowPat==='decel'?'decel':'const',
        pause:+l.vPause, pc:+l.vPc, itime:+l.vItime, rise:+l.vRise, ps:+l.vPs, cycle:+l.vCycle, peep:+l.vPeep, fio2:+l.vFio2 } : { mode:'off' },
    };
  }
  // create / reload / update this screen's engine to match `live` (cheap when nothing changed)
  syncEngine(){
    if(!this.physMode()){ this._sim=null; return; }
    const R=this.eng(), l=this.state.live, ep=(l.phys&&l.phys.epoch)||0;
    const params=this.engineParams(l), key=JSON.stringify(params);
    if(!this._sim){
      this._sim=new R.Sim(params,{seed:(Math.random()*1e9)|0, authority:this.isPublisher()}); this._simEpoch=ep; this._simKey=key; this.resetBufs(); this._engT=null;
      if(this._pendingEng){ const s=this._pendingEng; this._pendingEng=null; this.onEngineMsg(s); }
      return;
    }
    if(ep!==this._simEpoch){ this._sim.load(params); this._simEpoch=ep; this._simKey=key; this.resetBufs(); return; }
    if(key!==this._simKey){ this._sim.set(params); this._simKey=key; }
  }
  pubEngine(){
    if(!this._sim) return;
    let s; try{ const m=this._sim.exportSync(); m.epoch=this._simEpoch; s=JSON.stringify(m); }catch(e){ return; }
    try{ localStorage.setItem(this.engKey(this.state.sid), s); }catch(e){}
    if(this._mqtt && this._sync==='live'){ try{ this._mqtt.publish(this.engTopic(this.state.sid), s, {retain:true, qos:0}); }catch(e){} }
  }
  onEngineMsg(s){
    if(this.isPublisher()) return;                      // the controller is the source of slow state
    this._engHeard=Date.now();
    if(!this._sim){ this._pendingEng=s; return; }
    try{ const m=JSON.parse(s); if(m.epoch!==this._simEpoch) return; this._sim.importSync(m,{stateOnly:true}); }catch(e){}
  }
  // ring buffers at the engine's 200 Hz: monitor 6 s, ventilator 10 s (sweep display)
  resetBufs(){
    const mk=(sec)=>({ a:new Float32Array(sec*200), n:sec*200, w:0, filled:0 });
    this._buf={ ecg:mk(6), art:mk(6), pleth:mk(6), cvp:mk(6), pap:mk(6), co2:mk(6), paw:mk(10), flow:mk(10), vol:mk(10) };
    this._loopCur=[]; this._loopPrev=[]; this._loopBreath=null; this._scale={};
  }
  pushSample(s){
    const B=this._buf;
    for(const k in B){ const b=B[k]; b.a[b.w]=s[k]; b.w=(b.w+1)%b.n; if(b.filled<b.n) b.filled++; }
    const bs=this._sim.lungs.breathStart;
    if(bs!==this._loopBreath){ this._loopBreath=bs; if(this._loopCur.length>20) this._loopPrev=this._loopCur; this._loopCur=[]; }
    if(this._loopCur.length<3000 && (this._loopCur.length===0 || (this._sim.t*200|0)%2===0)) this._loopCur.push([s.paw,s.vol,s.flow]);
  }
  stepEngine(t, cap){
    const sim=this._sim; if(!sim) return;
    const last=this._engT; this._engT=t; if(last==null){ this._frameDt=0.016; return; }
    const dt=Math.min(cap||0.25,Math.max(0,t-last)); this._frameDt=Math.min(dt,0.25);   // ≤0.25 s/frame keeps real time down to 4 fps
    sim.step(dt, this._push||(this._push=(s)=>this.pushSample(s)));
    // the engine converts rhythms itself (adenosine → sinus): the controller writes that back to the shared state
    const notes=sim.takeNotices();
    if(this.isPublisher()) for(const n of notes){ if(n.type==='rhythm'){ this.setLive({rhythm:n.rhythm, phys:{...this.state.live.phys, hr:n.hr||this.state.live.phys.hr}});
      this.log('Patient', n.text||(((this.eng().RHYTHMS[n.rhythm]||{}).label||n.rhythm)+(n.reason?' after '+n.reason:''))); } }
    if(this.isPublisher() && t-(this._engPubT||0)>1){ this._engPubT=t; this.pubEngine(); }
    if(this.isPublisher()) this.scrTick();
  }

  // ---------- v2 step D: orders (fluids, drugs, procedures, ventilator) ----------
  // The trainee console sends orders on resussim/v1/<sid>/cmd; the controller applies them to its
  // engine (or to the shared ventilator settings), checks the instructor's locks, logs them and
  // publishes the result. The instructor's own buttons go through the same path, so the activity
  // log is a complete timeline for the debrief.
  cmdTopic(sid){ return 'resussim/v1/'+sid+'/cmd'; }
  cmdKey(sid){ return this.liveKey(sid)+':cmd'; }
  sendCmd(cmd){
    const m={...cmd, id:this._cid+'-'+(this._cmdN=(this._cmdN||0)+1)+'-'+Date.now().toString(36), src:this._cid,
      role:(this.isPublisher()&&cmd.role==='script')?'script':this.state.view==='trainee'?'trainee':'instructor'};
    if(this.isPublisher()){ this.onCmd(JSON.stringify(m)); return; }
    const s=JSON.stringify(m);
    try{ localStorage.setItem(this.cmdKey(this.state.sid), s); }catch(e){}
    if(this._mqtt && this._sync==='live'){ try{ this._mqtt.publish(this.cmdTopic(this.state.sid), s, {qos:1}); }catch(e){} }
    const perm={treat:true, ...(this.state.live.trainee||{})};
    if(this._sim && cmd.kind!=='vent' && perm.treat){ this.applyCmd(m); }   // show it at once; the controller's state then confirms it
  }
  onCmd(s){
    if(this.state.view!=='control') return;
    let m; try{ m=JSON.parse(s); }catch(e){ return; }
    if(!m || !m.id) return;
    this._seen=this._seen||[]; if(this._seen.includes(m.id)) return; this._seen.push(m.id); if(this._seen.length>300) this._seen.shift();
    const who=m.role==='trainee'?'Trainee':m.role==='script'?'Script':'Instructor', perm={vent:true, treat:true, ...(this.state.live.trainee||{})};
    if(m.role==='trainee' && this.SCRIPT_ORDERS.includes(m.kind)) return;
    if(m.role==='trainee' && ((m.kind==='vent' && !perm.vent) || (m.kind!=='vent' && !perm.treat))){ this.log(who,'Blocked (locked): '+this.cmdText(m)); return; }
    const res=this.applyCmd(m), via=m.via?' — '+m.via:'';
    if(res!==false){ this.log(who, this.cmdText(m)+(typeof res==='string'?res:'')+via); this.scrRecord(m); }
    else if(m.role==='script') this.log(who, 'Could not apply: '+this.cmdText(m)+via);
    this.pubEngine();
  }
  // apply an order to this screen; returns false when it could not apply, or a note to log
  applyCmd(m){
    const R=this.eng(), sim=this._sim, l=this.state.live;
    if(m.kind==='vent'){
      if(this.physMode() && !l.phys.ventilated) return false;
      const patch={};
      for(const k in (m.patch||{})){ if(k==='vMode'){ if(this.VENT_MODES.some(x=>x.k===m.patch.vMode)) patch.vMode=m.patch.vMode; }
        else if(k==='vFlowPat'){ patch.vFlowPat=m.patch.vFlowPat==='decel'?'decel':'const'; }
        else if(this.VENT_PARAMS[k]) patch[k]=this.vClamp(k,+m.patch[k]); }
      if(!Object.keys(patch).length) return false;
      if(this.isPublisher()) this.setLive(patch);
      return true;
    }
    // resuscitation orders change shared state or need the instructor's engine: other screens wait for it
    if(['cpr','pace','bag','shock'].includes(m.kind) && !this.isPublisher()) return true;
    if(['cpr','pace','bag'].includes(m.kind) && !this.physMode()) return false;
    if(m.kind==='cpr'){ this.setLive({resus:{...this.resusSt(), cpr:!!m.on}}); return true; }
    if(m.kind==='pace'){ const p=m.patch||{}, np={...this.resusSt()};
      if('pace' in p) np.pace=!!p.pace;
      if('paceRate' in p) np.paceRate=Math.max(30,Math.min(180,Math.round(+p.paceRate)||70));
      if('paceMA' in p) np.paceMA=Math.max(0,Math.min(200,Math.round(+p.paceMA)||0));
      m.res=np; this.setLive({resus:np}); return true; }
    if(m.kind==='bag'){ const ph=l.phys; m.wasVent=!!ph.ventilated;
      if(ph.ventilated) this.setLive({vFio2:100});
      // 7 mL/kg predicted body weight, 10 breaths/min, 100 % oxygen
      else this.setLive({phys:{...ph, ventilated:true}, vMode:'VC', vVt:Math.round(7*this.pbw()/10)*10, vRR:10, vFio2:100, vPeep:5, vFlow:50, vPause:0, vFlowPat:'const'});
      return true; }
    // rhythm, physiology settings, shock outcome and notes: the instructor's shared state (scripts send these)
    if(this.SCRIPT_ORDERS.includes(m.kind)){
      if(!this.isPublisher()) return false;
      if(m.kind==='note') return !!String(m.text||'').trim();
      if(m.kind==='rhythm'){ const ok=(R&&R.RHYTHMS[m.rhythm]&&!R.RHYTHMS[m.rhythm].hidden)||(!R&&this.RHYTHMS.some(x=>x.k===m.rhythm)); if(!ok) return false;
        if(m.rhythm===l.rhythm) return ' — no change'; this.setLive({rhythm:m.rhythm}); return true; }
      // functional updates: two steps firing before React re-renders must not overwrite each other
      if(m.kind==='phys'){ if(!this.physRow(m.key)||!isFinite(+m.value)) return false; const v=this.physClamp(m.key,+m.value); m.value=v;
        this.updLive(s=>({phys:{...s.phys, [m.key]:v}})); return true; }
      if(m.kind==='shockMode'){ if(!this.SHOCK_MODES.some(x=>x[0]===m.mode)) return false; this.updLive(s=>({phys:{...s.phys, shockMode:m.mode}})); return true; }
    }
    if(!sim || !R) return false;
    if(m.kind==='shock'){ const r=sim.shock(m.J, !!m.sync); m.delivered=!!r.delivered;
      if(!r.delivered) return ' — NOT delivered: no R wave to synchronise to';
      this.setLive({lastShock:{id:m.id, J:m.J, sync:!!m.sync}});
      return r.changed?'':' — no change in rhythm'; }
    if(m.kind==='bolus'){ const D=R.DRUGS[m.drug], b=D&&(D.bolus||[])[m.i]; if(!b) return false; sim.bolus(m.drug, b.dose, b.absorb); return true; }
    if(m.kind==='infuse'){ const r=sim.infuse(m.drug, m.rate); if(r==null) return false; m.rate=r; return true; }
    if(m.kind==='fluid'){ sim.giveFluid(m.fluid, m.mL, m.minutes); return true; }
    if(m.kind==='action'){ const n=sim.eventAction(m.action); if(m.action==='decompress' && this.isPublisher() && l.phys.pplOffset>0) this.patchPhys({pplOffset:0, venousObstruction:1});
      if(m.action==='drain' && this.isPublisher() && l.phys.pericardial>0) this.patchPhys({pericardial:0});
      return n>0 || (m.action==='decompress' && l.phys.pplOffset>0) || (m.action==='drain' && l.phys.pericardial>0) ? true : ' — no effect'; }
    if(m.kind==='event'){ if(!this.isPublisher()) return false; sim.startEvent(m.event, m.sev); return true; }
    if(m.kind==='endEvent'){ if(!this.isPublisher()) return false; return sim.endEvent(m.key)>0; }
    return false;
  }
  procLabel(id){ const R=this.eng(); if(!R) return id; for(const k in R.EVENTS){ const a=(R.EVENTS[k].actions||[]).find(x=>x.id===id); if(a) return a.label; } return id; }
  cmdText(m){
    const R=this.eng(), D=R&&m.drug?R.DRUGS[m.drug]:null;
    if(m.kind==='vent') return 'Ventilator: '+Object.keys(m.patch||{}).map(k=>k==='vMode'?'mode '+((this.VENT_MODES.find(x=>x.k===m.patch.vMode)||{}).label||m.patch.vMode)
      : k==='vFlowPat'?(m.patch.vFlowPat==='decel'?'decelerating flow':'constant flow') : (this.VENT_PARAMS[k]?this.VENT_PARAMS[k].label+' '+m.patch[k]+' '+this.VENT_PARAMS[k].unit:k)).join(', ');
    if(m.kind==='bolus') return (D?D.label:m.drug)+' '+(((D&&D.bolus)||[])[m.i]||{}).label;
    if(m.kind==='infuse') return (D?D.label:m.drug)+(+m.rate>0?' infusion '+m.rate+' '+D.rate.unit:' infusion stopped');
    if(m.kind==='fluid') return m.fluid==='blood'?'Packed red cells, 1 unit':'Crystalloid '+m.mL+' mL over '+m.minutes+' min';
    if(m.kind==='action') return this.procLabel(m.action);
    if(m.kind==='event'){ const E=R&&R.EVENTS[m.event]; return 'Event: '+(E?E.label:m.event)+' ('+(m.sev>=0.95?'severe':m.sev>=0.6?'moderate':'mild')+')'; }
    if(m.kind==='endEvent') return 'Event ended: '+m.label;
    if(m.kind==='cpr') return m.on?'CPR started':'CPR paused';
    if(m.kind==='pace'){ const p=m.res||m.patch||{}; return p.pace===false?'Pacer off':'Pacer on · '+p.paceRate+'/min · '+p.paceMA+' mA'; }
    if(m.kind==='bag') return m.wasVent?'FiO₂ 100 %':'Bag-mask ventilation · '+Math.round(7*this.pbw()/10)*10+' mL × 10/min · 100 % O₂';
    if(m.kind==='shock') return (m.sync?'Synchronised cardioversion ':'Defibrillation ')+m.J+' J';
    if(m.kind==='rhythm') return 'Rhythm set: '+(((R&&R.RHYTHMS[m.rhythm])||this.RHYTHMS.find(x=>x.k===m.rhythm)||{}).label||m.rhythm);
    if(m.kind==='phys'){ const row=this.physRow(m.key); return row?'Physiology: '+row[1]+' '+this.physDisp(row,+m.value)+' '+row[5]:'Physiology: '+m.key; }
    if(m.kind==='shockMode') return 'Shock outcome: '+(((this.SHOCK_MODES.find(x=>x[0]===m.mode))||[0,m.mode])[1]).toLowerCase();
    if(m.kind==='note') return 'Note: '+m.text;
    return m.kind;
  }
  log(who, text){ if(this.isPublisher()) this.dpush(who, text); this.setState(s=>{ const live={...s.live, log:[{t:this.timeStr(), who, text}].concat(s.live.log||[]).slice(0,40)}; this.saveLive(s.sid,live); return {live}; }); }

  timeStr(){ return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}); }

  // ---------- QR ----------
  mkQr(){ const el=this.qrBox; if(!el||!window.QRCode) return; el.innerHTML=''; const url=this.displayUrl(); try{ new window.QRCode(el,{text:url,width:el.clientWidth||160,height:el.clientHeight||160,correctLevel:window.QRCode.CorrectLevel.M}); }catch(e){ el.textContent='QR unavailable'; } }
  displayUrl(){ return location.origin+location.pathname+location.search+'#display?s='+encodeURIComponent(this.state.sid); }

  // ---------- sim type ----------
  simType(){ return this.state.live.simType||'hemo'; }
  simMeta(){ const t=this.simType(); if(t==='vent') return {name:'Ventilator',icon:'wind'}; if(t==='both') return {name:'Combined',icon:'layout-grid'}; return {name:'Hemodynamic',icon:'heart-pulse'}; }

  // ---------- hemo derived ----------
  arrest(r){ return r==='vf'||r==='asystole'; }
  perfusing(){ const r=this.state.live.rhythm; return !(r==='vf'||r==='asystole'||r==='torsades'); }
  fmt(v){ return (v===0||v==null||isNaN(v))?'--':String(v); }
  hrDisp(){ const l=this.state.live; if(this.arrest(l.rhythm)||l.rhythm==='torsades') return '--'; return this.fmt(l.hr); }

  // ---------- derived hemodynamics (CO = HR·SV/1000, MAP = CVP + CO·SVR/80) ----------
  mapNum(){ const l=this.state.live; return (l.sys>0)? (l.sys+2*l.dia)/3 : 0; }
  ppNum(){ const l=this.state.live; return (l.sys>0)? (l.sys-l.dia) : 0; }
  coNum(){ const l=this.state.live; if(!this.perfusing()||!(l.sys>0)) return 0; const sv=(l.sv!=null?+l.sv:75); return Math.max(0, (+l.hr||0)*sv/1000); }
  svrNum(){ const co=this.coNum(); if(co<=0) return 0; const cvp=(this.state.live.cvp!=null?+this.state.live.cvp:8); const s=80*(this.mapNum()-cvp)/co; return s>0?s:0; }
  // vascular tone 0..1 from SVR — shapes the arterial upstroke and dicrotic notch
  vascTone(){ const s=this.svrNum(); if(s<=0) return 0.5; return Math.max(0,Math.min(1,(s-500)/1300)); }

  // ---------- ventilator model ----------
  pbw(){ const h=+this.state.live.vHeight||170; const base=(this.state.live.sex==='M')?50:45.5; return Math.max(30, base+0.91*(h-152.4)); }
  ventModel(){
    const l=this.state.live;
    let mode=l.vMode||'VC'; if(mode==='VAC')mode='VC'; if(mode==='PAC')mode='PC';
    const pat=(l.vFlowPat==='decel')?'decel':'const';   // VC inspiratory flow pattern
    const RR=Math.max(+l.vRR||14,4);
    const P=60/RR;
    const PEEP=+l.vPeep||5;
    const FiO2=+l.vFio2||40;
    const C=Math.max(+l.vComp||50,8);        // mL/cmH2O
    const Raw=Math.max(+l.vRaw||10,2);        // cmH2O per L/s
    const CL=C/1000;                          // L/cmH2O
    const tau=Math.max(Raw*CL,0.08);          // s (time constant R*C)
    const rise=Math.max(+l.vRise||0.15,0.03);
    let Ti, TiFlow, pause=0, VT, Pset=0, Fset=0, F0=0;  // F0 = peak insp flow (L/s)
    if(mode==='VC'){
      VT=+l.vVt||450; Fset=Math.max(+l.vFlow||50,10);
      pause=Math.max(0, Math.min(+l.vPause||0, 1.5));
      // a descending ramp delivers the same VT at the set PEAK flow over ~2x the time
      TiFlow=(pat==='decel') ? (VT/1000)/((Fset/60)/2) : (VT/1000)/(Fset/60);
      const maxTi=P*0.9;
      if(TiFlow+pause>maxTi){ pause=Math.min(pause,maxTi*0.4); TiFlow=Math.max(maxTi-pause,0.15); }
      // peak inspiratory flow that preserves VT over TiFlow after any capping
      F0=(pat==='decel') ? (2*(VT/1000)/TiFlow) : ((VT/1000)/TiFlow);
      Ti=TiFlow+pause;
    } else if(mode==='PC'){
      Pset=+l.vPc||15; Ti=Math.min(+l.vItime||1.0, P*0.85); TiFlow=Ti;
      VT=Pset*C*(1-Math.exp(-Ti/tau));
    } else if(mode==='PRVC'){
      const tgt=+l.vTgt||450; Ti=Math.min(+l.vItime||1.0, P*0.85); TiFlow=Ti;
      Pset=Math.max(5,Math.min(40, tgt/Math.max(C*(1-Math.exp(-Ti/tau)),1)));
      VT=Pset*C*(1-Math.exp(-Ti/tau));
    } else if(mode==='PS'){
      Pset=+l.vPs||12; const cyc=Math.max((+l.vCycle||25)/100,0.05);
      Ti=Math.min(Math.max(tau*Math.log(1/cyc),0.25), P*0.7); TiFlow=Ti;
      VT=Pset*C*(1-Math.exp(-Ti/tau));
    } else { Pset=0; Ti=P*0.35; TiFlow=Ti; VT=0; }
    const Te=Math.max(P-Ti,0.1);
    // air-trapping: gas remaining at end-expiration -> intrinsic (auto) PEEP
    const residual = mode==='CPAP'?0 : VT*Math.exp(-Te/tau);
    const autoPEEP = residual/C;
    const totalPEEP = PEEP+autoPEEP;
    const plateau = totalPEEP+VT/C;          // end-insp alveolar pressure (insp-hold value)
    const MV = VT*RR/1000;

    const TRIG=0.09;        // PS patient-trigger window (s)
    const TRIGDIP=2.2;      // trigger deflection depth (cmH2O)
    // Airway-pressure scalar: inspiration rises over total PEEP; expiration is
    // held flat at the SET PEEP (auto-PEEP is alveolar and shows on the flow trace).
    const paw=(tt)=>{ const u=((tt%P)+P)%P;
      if(mode==='CPAP') return PEEP+0.8*Math.sin(2*Math.PI*u/P);
      if(mode==='VC'){
        if(u<TiFlow){ const x=u/TiFlow; const elastic=(pat==='decel')?VT*(1-(1-x)*(1-x)):x*VT; const fnow=(pat==='decel')?F0*(1-x):F0; return totalPEEP+elastic/C+fnow*Raw; }
        if(u<Ti) return totalPEEP+VT/C;                          // inspiratory pause -> plateau
        return PEEP; }                                            // expiration held at set PEEP
      if(u<Ti){ let p=PEEP+Pset*Math.min(1,u/rise);              // PC / PRVC / PS pressure square
        if(mode==='PS'&&u<TRIG) p=PEEP - TRIGDIP*Math.sin(Math.PI*u/TRIG) + Pset*Math.min(1,Math.max(0,u-TRIG*0.5)/rise);
        return p; }
      return PEEP; };
    const flow=(tt)=>{ const u=((tt%P)+P)%P;
      if(mode==='CPAP') return 6*Math.sin(2*Math.PI*u/P);
      if(mode==='VC'){
        if(u<TiFlow) return ((pat==='decel')?F0*(1-u/TiFlow):F0)*60;   // square or descending ramp
        if(u<Ti) return 0;                                             // pause: no flow
        const te=u-Ti; return -((VT/1000)/tau)*Math.exp(-te/tau)*60; }
      if(u<Ti){ let f=(Pset/Raw)*Math.exp(-u/tau);                     // decelerating insp flow
        if(mode==='PS'&&u<TRIG) f*=Math.min(1,u/(TRIG*0.6));           // ramp in from trigger
        return f*60; }
      const te=u-Ti; return -((VT/1000)/tau)*Math.exp(-te/tau)*60; };
    const vol=(tt)=>{ const u=((tt%P)+P)%P;
      if(mode==='CPAP') return 40+25*Math.sin(2*Math.PI*u/P);
      if(mode==='VC'){ if(u<TiFlow){ const x=u/TiFlow; return (pat==='decel')?VT*(1-(1-x)*(1-x)):x*VT; } if(u<Ti) return VT; const te=u-Ti; return VT*Math.exp(-te/tau); }
      if(u<Ti) return Pset*C*(1-Math.exp(-u/tau));
      const te=u-Ti; return VT*Math.exp(-te/tau); };

    // PIP: peak of the inspiratory airway-pressure waveform (exact for either VC pattern)
    let PIP;
    if(mode==='VC'){ PIP=totalPEEP; const stp=Math.max(TiFlow/40,0.005); for(let u=0;u<=TiFlow+1e-6;u+=stp){ const x=u/TiFlow; const elastic=(pat==='decel')?VT*(1-(1-x)*(1-x)):x*VT; const fnow=(pat==='decel')?F0*(1-x):F0; const p=totalPEEP+elastic/C+fnow*Raw; if(p>PIP)PIP=p; } }
    else if(mode==='CPAP'){ PIP=PEEP; }
    else { PIP=PEEP+(Pset||0); }

    const inspPeak = mode==='VC'?(F0*60):((Pset||0)/Raw*60);
    const expPeak = (VT/1000)/tau*60;
    const flowScale = Math.min(160, Math.max(50, Math.max(inspPeak,expPeak)*1.15));
    const volScale = Math.max(200, Math.ceil((VT*1.25)/100)*100);
    const pawScale = Math.min(80, Math.max(30, Math.ceil((PIP+8)/10)*10));

    return {mode,pat,P,Ti,TiFlow,Te,PEEP,totalPEEP,autoPEEP,FiO2,VT,PIP,plateau,MV,ieRatio:Te/Ti,RR,paw,flow,vol,flowScale,volScale,pawScale};
  }

  // ---------- actions ----------
  applyPreset(p){ const {label,accent,sub,script,...rest}=p;
    // a saved physiology profile is a whole new patient: bump the epoch so every screen re-settles
    if(rest.phys) rest.phys={...this.PHYS_DEFAULT, ...rest.phys, epoch:((this.state.live.phys&&this.state.live.phys.epoch)||0)+1};
    if(!this.state.live.runT0) rest.runT0=Date.now();
    this.setLive(rest); this.log('Instructor','Preset: '+label);
    if(script && script.steps && script.steps.length) this.scrLoadDef(script); }   // its script, ready to start
  clamp(k,v){ const d=this.VITAL_DEF.find(x=>x.key===k); return Math.max(d.min,Math.min(d.max,v)); }
  setVital(k,v){ this.setLive({ [k]:this.clamp(k,Math.round(v)) }); }
  bump(k,d){ this.setVital(k,(this.state.live[k]||0)+d); }
  worsen(){ const l=this.state.live; this.setLive({ hr:this.clamp('hr',l.hr+8), rr:this.clamp('rr',l.rr+3), spo2:this.clamp('spo2',l.spo2-4), sys:this.clamp('sys',l.sys-10), dia:this.clamp('dia',l.dia-6), sv:this.clamp('sv',(+l.sv||75)-6), cvp:this.clamp('cvp',(+l.cvp||8)+2) }); }
  improve(){ const l=this.state.live; this.setLive({ hr:this.clamp('hr',l.hr-8), rr:this.clamp('rr',l.rr-3), spo2:this.clamp('spo2',l.spo2+4), sys:this.clamp('sys',l.sys+10), dia:this.clamp('dia',l.dia+6), sv:this.clamp('sv',(+l.sv||75)+6), cvp:this.clamp('cvp',(+l.cvp||8)-2) }); }

  vClamp(k,v){ const d=this.VENT_PARAMS[k]; if(!d) return v; const st=d.step||1; let x=Math.round(v/st)*st; x=Math.max(d.min,Math.min(d.max,x)); return +x.toFixed(2); }
  setV(k,v){ this.setLive({ [k]:this.vClamp(k,v) }); }
  bumpV(k,dir){ const d=this.VENT_PARAMS[k]; const st=d.step||1; this.setV(k,(+this.state.live[k]||d.min)+dir*st); }
  vDisp(k){ const d=this.VENT_PARAMS[k]; const v=+this.state.live[k]; return (d.step&&d.step<1)?v.toFixed(1):String(Math.round(v)); }

  // ---------- trainee console: staged ventilator settings ----------
  draftVal(k){ const d=this.state.draft; return d&&d[k]!=null?d[k]:this.state.live[k]; }
  setDraft(k,v){ const val=(k==='vMode'||k==='vFlowPat')?v:this.vClamp(k,v); this.setState(s=>({draft:{...(s.draft||{}), [k]:val}})); }
  bumpDraft(k,dir){ const d=this.VENT_PARAMS[k]; this.setDraft(k,(+this.draftVal(k)||d.min)+dir*(d.step||1)); }
  draftPatch(){ const d=this.state.draft||{}, l=this.state.live, patch={}; for(const k in d) if(d[k]!==l[k]) patch[k]=d[k]; return patch; }
  applyDraft(){ const patch=this.draftPatch(); if(Object.keys(patch).length) this.sendCmd({kind:'vent', patch}); this.setState({draft:null}); }

  // ---------- physiology-mode actions ----------
  setEngineMode(m){
    if(m==='physio' && !this.eng()) return;
    const l=this.state.live, patch={engineMode:m};
    if(m==='manual' && l.engineMode==='physio'){
      // hand over seamlessly: manual mode starts from the lungs and numbers the engine shows now
      const ph=l.phys;
      patch.vComp=Math.max(12,Math.min(80,Math.round(ph.compliance)));
      patch.vRaw=Math.max(4,Math.min(40,Math.round(ph.resistance+5)));
      const V=this._sim&&this._sim.vitals, r=(x)=>(x==null||!isFinite(x))?0:Math.round(x);
      if(V){
        const pulse=V.pulse!=null;
        Object.assign(patch,{ hr:r(V.hr), rr:r(V.rr), etco2:r(V.etco2), spo2:pulse?r(V.spo2):0, sys:pulse?r(V.abp.sys):0, dia:pulse?r(V.abp.dia):0,
          cvp:pulse?Math.max(0,r(V.cvp)):0, sv:pulse?r(V.sv):0 });
      }
      // rhythms that only the engine draws fall back to the closest v1 picture
      const v1map={ pvt:'vt', pea:'sinusbrad', avb1:'sinus', avb2i:'sinusbrad', avb2ii:'sinusbrad', avb3:'sinusbrad' };
      if(v1map[l.rhythm]) patch.rhythm=v1map[l.rhythm];
    }
    this.setLive(patch);
  }
  physRow(k){ return this.PHYS_CIRC.concat(this.PHYS_LUNG).find(r=>r[0]===k); }
  physClamp(k,v){ const d=this.physRow(k); if(!d) return v; const [,,min,max,step]=d; let x=Math.round(v/step)*step; x=Math.max(min,Math.min(max,x)); return +x.toFixed(3); }
  setPhys(k,v){ const ph={...this.state.live.phys}; ph[k]=this.physClamp(k,v); this.setLive({phys:ph}); }
  patchPhys(patch){ this.setLive({phys:{...this.state.live.phys, ...patch}}); }
  bumpPhys(k,dir){ const d=this.physRow(k); this.setPhys(k,(+this.state.live.phys[k]||0)+dir*d[4]); }
  physDisp(row,v){ const [,,,,step,,pct]=row; if(pct) return String(Math.round(v*100)); return step<1 ? (+v).toFixed(step<0.1?2:1) : String(Math.round(v)); }
  // load an engine scenario: its physiology goes into `phys`, its ventilator into the v1 vent keys
  applyPhysPreset(id, who){
    const R=this.eng(); const sc=R&&R.scenario(id); if(!sc) return;
    const U=R.util, P=U.deepMerge(U.clone(R.DEFAULTS), sc.params), l=this.state.live;
    const bvRef=((P.patient.sex==='M')?75:65)*P.patient.weightKg;
    const phys={ ...l.phys, epoch:(l.phys.epoch||0)+1, preset:id,
      hr:P.heart.hr, atrialRate:P.heart.atrialRate, contractility:P.heart.contractility, rvContractility:P.heart.rvContractility,
      svr:P.vessels.svr, pvr:P.vessels.pvr, bvPct:Math.round(100*(P.volume.bloodVolume!=null?P.volume.bloodVolume:bvRef)/bvRef), venousTone:P.volume.venousTone,
      pericardial:P.thorax.pericardial, pplOffset:P.thorax.pplOffset, venousObstruction:P.thorax.venousObstruction, baro:P.reflex.baro,
      compliance:P.lungs.compliance, resistance:P.lungs.resistance, shunt:P.lungs.shunt, vq:P.lungs.vqMismatch, deadSpace:P.lungs.deadSpace,
      recruit:P.lungs.recruitability, ecwFrac:P.lungs.ecwFrac, spRate:P.breathing.rate, effort:P.breathing.effort, o2:P.airway.fio2,
      vo2Factor:P.metabolism.vo2Factor, hb:P.metabolism.hb, ventilated:P.vent.mode!=='off' };
    const patch={ phys, rhythm:P.heart.rhythm };
    if(P.vent.mode!=='off'){ const v=P.vent; Object.assign(patch,{ vMode:v.mode, vRR:v.rr, vFlow:v.flow, vFlowPat:v.flowPattern, vPause:v.pause, vPc:v.pc,
      vItime:v.itime, vRise:v.rise, vPs:v.ps, vCycle:v.cycle, vPeep:v.peep, vFio2:v.fio2 }); patch[v.mode==='PRVC'?'vTgt':'vVt']=v.vt; }
    if(!l.runT0) patch.runT0=Date.now();
    patch.resus={...this.RESUS_DEFAULT, cprQ:(l.resus&&l.resus.cprQ)||'good'};   // a new patient: compressions and pacer off
    this.setLive(patch);
    this.log(who||'Instructor','Scenario: '+sc.label);
  }
  physAction(a){
    const l=this.state.live, ph=l.phys, ml=500/this.bvNormal(l)*100;
    if(a==='bolus') this.sendCmd({kind:'fluid', fluid:'crystalloid', mL:500, minutes:10});
    if(a==='bleed') this.patchPhys({ bvPct:Math.max(40, Math.round(ph.bvPct-ml)) });
    if(a==='decompress') this.sendCmd({kind:'action', action:'decompress'});
    if(a==='bleed') this.log('Instructor','Blood loss 500 mL');
    if(a==='pacath'){ this.patchPhys({ paCath:!ph.paCath }); this.log('Instructor', ph.paCath?'PA catheter removed':'PA catheter inserted'); }
    if(a==='disconnect') this.patchPhys({ ventilated:false });
  }

  doSaveProfile(){ const name=(window.prompt('Name this profile:','')||'').trim(); if(!name) return; const l=this.state.live;
    const keys=['simType','engineMode','phys','rhythm','hr','rr','spo2','sys','dia','etco2','cvp','sv','ppv','vMode','vFlowPat','vRR','vVt','vTgt','vFlow','vPause','vPc','vItime','vRise','vPs','vCycle','vPeep','vFio2','vComp','vRaw'];
    const p={label:name}; keys.forEach(k=>p[k]=l[k]);
    const sd=this.scr().def; if(sd.steps.length) p.script={ name:sd.name, scenario:sd.scenario, patient:sd.patient||null, steps:sd.steps.map(s=>({when:{...s.when}, act:{...s.act}})) };
    const profiles=[...this.state.profiles,p]; this.saveProfilesLS(profiles); this.setState({profiles}); }
  delProfile(i){ const profiles=this.state.profiles.filter((_,j)=>j!==i); this.saveProfilesLS(profiles); this.setState({profiles}); }
  newSession(){ const sid=this.genId(); this.setState({sid, live:this.loadLive(sid)}); this.setHash('home',sid); }
  copyLink(){ try{ navigator.clipboard.writeText(this.displayUrl()); }catch(e){} }
  toggleFull(){ const el=this.root||document.documentElement; if(!document.fullscreenElement){ (el.requestFullscreen||(()=>{})).call(el); } else { document.exitFullscreen&&document.exitFullscreen(); } }

  // ---------- hemo waveforms ----------
  g(x,c,w){ return Math.exp(-((x-c)*(x-c))/(2*w*w)); }
  // noise that depends only on time, so redrawing the same stretch of trace gives the same pixels
  hnoise(x){ const s=Math.sin(x*12.9898+78.233)*43758.5453; return s-Math.floor(s)-0.5; }
  ecg(t,hr,r){
    if(r==='vf') return 0.5*Math.sin(t*18.3)+0.35*Math.sin(t*27.7+1)+0.25*Math.sin(t*41.1+2)+0.06*this.hnoise(t*40);
    if(r==='asystole') return 0.015*Math.sin(t*1.7)+0.006*this.hnoise(t*30);
    if(r==='torsades'){ return Math.sin(t*17)*(0.22+0.78*Math.abs(Math.sin(t*1.15))); }
    const rate = r==='vt'?Math.max(hr,150) : hr; const P=60/Math.max(rate,20), u=(t%P)/P, g=this.g.bind(this);
    if(r==='vt') return 0.82*Math.sin(2*Math.PI*u)+0.16*Math.sin(4*Math.PI*u+0.6);
    if(r==='svt') return 1.0*g(u,0.37,0.015)-0.20*g(u,0.425,0.017)+0.18*g(u,0.70,0.06);
    if(r==='af') return 0.05*Math.sin(t*33)+0.03*Math.sin(t*51)-0.09*g(u,0.335,0.013)+1.0*g(u,0.37,0.015)-0.22*g(u,0.408,0.017)+0.20*g(u,0.62,0.05);
    if(r==='istemi') return 0.09*g(u,0.17,0.026)-0.06*g(u,0.335,0.011)+0.92*g(u,0.368,0.014)-0.08*g(u,0.402,0.014)+0.32*g(u,0.50,0.075)+0.34*g(u,0.585,0.05);
    return 0.10*g(u,0.18,0.028)-0.09*g(u,0.335,0.013)+1.0*g(u,0.37,0.015)-0.22*g(u,0.408,0.017)+0.24*g(u,0.62,0.05);
  }
  pleth(t,hr){ const P=60/Math.max(hr,20),u=(t%P)/P,g=this.g.bind(this); const up=1/(1+Math.exp(-(u-0.11)/0.028)); const down=Math.exp(-Math.max(0,u-0.15)/0.16); return (0.98*up*down + 0.30*g(u,0.42,0.055) - 0.07*g(u,0.30,0.02)); }
  // arterial line: systolic upstroke, dicrotic notch (aortic valve closure) + dicrotic
  // wave, diastolic runoff. tone 0..1 (from SVR): high tone -> slower upstroke, more
  // prominent dicrotic notch, slower decay; low tone (vasodilated) -> steep spike.
  art(t,hr,tone){ const P=60/Math.max(hr,20),u=(t%P)/P,g=this.g.bind(this); tone=(tone==null)?0.5:tone;
    const kUp=0.014+0.012*tone; const up=1/(1+Math.exp(-(u-0.085)/kUp));
    const decay=0.10+0.07*tone; const down=Math.exp(-Math.max(0,u-0.135)/decay);
    const sysComp=up*down;
    const notchPos=0.34; const notch=-(0.05+0.10*tone)*g(u,notchPos,0.011);
    const dicrotic=(0.09+0.11*tone)*g(u,notchPos+0.055,0.03);
    const foot=-0.05*g(u,0.29,0.013);
    return sysComp+notch+dicrotic+foot; }
  // central venous pressure: a (atrial kick) · c (tricuspid bulge) · x descent ·
  // v (venous filling) · y descent, referenced to the cardiac cycle
  cvpWave(t,hr){ const P=60/Math.max(hr,20),u=(t%P)/P,g=this.g.bind(this);
    return 0.55*g(u,0.28,0.03) + 0.32*g(u,0.44,0.024) - 0.42*g(u,0.55,0.04) + 0.58*g(u,0.75,0.05) - 0.40*g(u,0.88,0.04); }
  resp(t,rr){ if(rr<=0) return 0; const P=60/rr,u=(t%P)/P; const s=Math.sin(2*Math.PI*u); return Math.sign(s)*Math.pow(Math.abs(s),0.85); }

  sizeCanvas(canvas,wrap){ if(!canvas||!wrap) return null; const w=wrap.clientWidth,h=wrap.clientHeight; if(!w||!h) return null; const dpr=this._dpr; if(canvas._w!==w||canvas._h!==h){ canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px'; canvas._w=w; canvas._h=h; } const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx,w,h}; }
  grid(ctx,w,h){ ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1; for(let x=0;x<=w;x+=Math.max(30,w/26)){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); } for(let y=0;y<=h;y+=Math.max(30,h/12)){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); } }
  lane(ctx,top,bot,w,color,fn,amp,base,t){ const px=1,pps=150; ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.8; ctx.lineJoin='round'; for(let x=0;x<=w;x+=px){ const tt=t-(w-x)/pps; let v=fn(tt); let y=base-v*amp; if(y<top+2)y=top+2; if(y>bot-2)y=bot-2; if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke(); }
  laneR(ctx,top,bot,w,color,fn,vmin,vmax,t){ const pad=8,H=(bot-top)-pad*2,px=1,pps=90; if(vmin<0&&vmax>0){ const zr=(0-vmin)/(vmax-vmin), zy=(bot-pad)-zr*H; ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,zy); ctx.lineTo(w,zy); ctx.stroke(); } ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.8; ctx.lineJoin='round'; for(let x=0;x<=w;x+=px){ const tt=t-(w-x)/pps; let v=fn(tt); let r=(v-vmin)/(vmax-vmin); if(r<0)r=0; if(r>1)r=1; const y=(bot-pad)-r*H; if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke(); }

  drawMon(canvas,wrap,t){
    const s=this.sizeCanvas(canvas,wrap); if(!s) return; const {ctx,w,h}=s; const l=this.state.live;
    ctx.clearRect(0,0,w,h); this.grid(ctx,w,h);
    const band=h/5, perf=this.perfusing(), spo2=l.spo2, sys=l.sys;
    const rr=+l.rr||0, ppv=(+l.ppv||0)/100;
    const respPhase=(tt)=> rr>0 ? Math.sin(2*Math.PI*((tt%(60/rr))/(60/rr))) : 0;

    // 1 — ECG
    this.lane(ctx,0,band,w,'#22e34a',(tt)=>this.ecg(tt,l.hr,l.rhythm),band*0.48,band*0.60,t);

    // 2 — plethysmograph (SpO2), with respiratory amplitude variation
    const plethFn=(perf&&spo2>0)?(tt)=>{ let v=this.pleth(tt,l.hr); if(rr>0) v*=(1+0.5*ppv*respPhase(tt)); return v; }:()=>0.02*Math.sin(t*2);
    this.lane(ctx,band,band*2,w,'#67DCFF',plethFn,band*0.42,band*1.82,t);

    // 3 — arterial line: amplitude scales with pulse pressure, shape with vascular
    //     tone (SVR), systolic height swings with respiration (SVV / pulsus)
    const tone=this.vascTone();
    const ppAmp=Math.max(0.34,Math.min(1.35,this.ppNum()/42));   // relative pulse pressure
    const artFn=(perf&&sys>0)?(tt)=>{ let v=this.art(tt,l.hr,tone); if(rr>0) v*=(1+ppv*respPhase(tt)); return v; }:()=>0.02*Math.sin(t*2);
    this.lane(ctx,band*2,band*3,w,'#ff7b7b',artFn,band*0.66*ppAmp,band*3-band*0.14,t);

    // 4 — central venous pressure: mean level rises with CVP; a/c/v waves + x/y descents
    const cvpVal=(l.cvp!=null?+l.cvp:8);
    const cvpFrac=Math.max(0.16,Math.min(0.86,cvpVal/26));
    const cvpBase=band*4 - band*0.10 - cvpFrac*(band*0.78);
    const cvpFn=perf?(tt)=>this.cvpWave(tt,l.hr):()=>0.01*Math.sin(t*1.6);
    this.lane(ctx,band*3,band*4,w,'#ffd60a',cvpFn,band*0.16,cvpBase,t);

    // 5 — respiration
    const respFn=(rr>0)?(tt)=>this.resp(tt,rr):()=>0.015*Math.sin(t*2);
    this.lane(ctx,band*4,band*5,w,'#cfd4d8',respFn,band*0.30,band*4.5,t);
  }
  drawVent(canvas,wrap,t){
    const s=this.sizeCanvas(canvas,wrap); if(!s) return; const {ctx,w,h}=s;
    ctx.clearRect(0,0,w,h); this.grid(ctx,w,h);
    const m=this.ventModel(); const band=h/3;
    this.laneR(ctx,0,band,w,'#67DCFF',(tt)=>m.paw(tt),0,m.pawScale,t);
    this.laneR(ctx,band,band*2,w,'#22e34a',(tt)=>m.flow(tt),-m.flowScale,m.flowScale,t);
    this.laneR(ctx,band*2,band*3,w,'#c98bff',(tt)=>m.vol(tt),0,m.volScale,t);
    ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font='11px ui-monospace,monospace';
    ctx.fillText('Paw  cmH2O', 10, 15);
    ctx.fillText('Flow  L/min', 10, band+15);
    ctx.fillText('Volume  mL', 10, band*2+15);
  }
  // ---------- physiology-mode drawing (sweep from the engine's ring buffers) ----------
  // scale ranges ease toward a monitor-style "nice" range (~0.6 s) instead of jumping
  bufRange(b){ let lo=Infinity, hi=-Infinity; const n=b.filled; for(let i=0;i<n;i++){ const v=b.a[i]; if(v<lo)lo=v; if(v>hi)hi=v; } return n?[lo,hi]:[0,1]; }
  physScale(k, dt){
    const [mn,mx]=this.bufRange(this._buf[k]); let lo, hi;
    const up=(x,s)=>Math.ceil(x/s)*s, dn=(x,s)=>Math.floor(x/s)*s;
    if(k==='ecg'){ lo=-0.7; hi=1.5; }
    else if(k==='art'){ lo=0; hi=Math.max(60, up(mx+15,30)); }
    else if(k==='cvp'){ lo=Math.min(0, dn(mn-2,5)); hi=Math.max(20, up(mx+3,5)); }
    else if(k==='pap'){ lo=0; hi=Math.max(40, up(mx+5,10)); }
    else if(k==='co2'){ lo=0; hi=Math.max(50, up(mx+5,10)); }
    else if(k==='paw'){ lo=Math.min(0, dn(mn,5)); hi=Math.max(30, up(mx+5,10)); }
    else if(k==='flow'){ const m=Math.max(40, up(Math.max(Math.abs(mn),Math.abs(mx))*1.15,10)); lo=-m; hi=m; }
    else if(k==='vol'){ lo=Math.min(0, dn(mn,100)); hi=Math.max(200, up(mx*1.2,100)); }
    else { const span=Math.max(mx-mn, 0.8), mid=(mx+mn)/2; lo=mid-span*0.6; hi=mid+span*0.6; }   // pleth: auto-gain
    const s=this._scale[k];
    if(!s) return (this._scale[k]={lo,hi,want:0});
    if(k==='pleth'){ const a=Math.min(1,(dt||0.016)/2.5); s.lo+=(lo-s.lo)*a; s.hi+=(hi-s.hi)*a; return s; }   // slow auto-gain
    // fixed 'nice' scales: grow at once so nothing clips, shrink only after 4 s — no pumping with each breath
    if(hi>s.hi+1e-6||lo<s.lo-1e-6){ s.hi=Math.max(s.hi,hi); s.lo=Math.min(s.lo,lo); s.want=0; }
    else if(hi<s.hi-1e-6||lo>s.lo+1e-6){ s.want+=dt||0.016; if(s.want>4){ s.hi=hi; s.lo=lo; s.want=0; } }
    else s.want=0;
    return s;
  }
  laneSweep(ctx,top,bot,w,color,k,label,dt){
    const b=this._buf[k], s=this.physScale(k,dt), pad=6, H=(bot-top)-pad*2, n=b.n, gap=Math.max(2,Math.round(n*0.025));
    ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=1.8; ctx.lineJoin='round';
    let pen=false;
    for(let x=0;x<w;x++){
      const i=Math.floor(x/w*n);
      if(b.filled<n && i>=b.w){ pen=false; continue; }                       // not written yet
      if((i-b.w+n)%n<gap){ pen=false; continue; }                             // erase bar ahead of the sweep
      let r=(b.a[i]-s.lo)/(s.hi-s.lo); r=r<0?0:(r>1?1:r);
      const y=(bot-pad)-r*H; if(!pen){ ctx.moveTo(x,y); pen=true; } else ctx.lineTo(x,y);
    }
    ctx.stroke();
    if(label && (bot-top)>=34){ ctx.fillStyle=color; ctx.globalAlpha=0.8; ctx.font='11px ui-monospace,monospace'; ctx.fillText(label,10,top+14); ctx.globalAlpha=1; }
  }
  drawMonPhys(canvas,wrap,dt,labels){
    const s=this.sizeCanvas(canvas,wrap); if(!s) return; const {ctx,w,h}=s;
    ctx.clearRect(0,0,w,h); this.grid(ctx,w,h);
    const lanes=[['ecg','#22e34a','ECG II'],['pleth','#67DCFF','SpO₂ pleth'],['art','#ff7b7b','ART'],['cvp','#ffd60a','CVP']];
    if(this.state.live.phys.paCath) lanes.push(['pap','#ffa94d','PAP']);
    lanes.push(['co2','#e8e8e8','CO₂']);
    const band=h/lanes.length;
    lanes.forEach(([k,c,lab],i)=>{ const sc=this._scale[k]; const rng=(k==='ecg'||k==='pleth'||!sc)?'':'  '+Math.round(sc.lo)+'–'+Math.round(sc.hi);
      this.laneSweep(ctx,band*i,band*(i+1),w,c,k,labels?lab+rng:'',dt); });
  }
  drawVentPhys(canvas,wrap,dt,labels){
    const s=this.sizeCanvas(canvas,wrap); if(!s) return; const {ctx,w,h}=s;
    ctx.clearRect(0,0,w,h); this.grid(ctx,w,h);
    const band=h/3, f=this._scale.flow;
    if(f && f.lo<0){ const zy=band*2-6-((0-f.lo)/(f.hi-f.lo))*(band-12); ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,zy); ctx.lineTo(w,zy); ctx.stroke(); }
    this.laneSweep(ctx,0,band,w,'#67DCFF','paw',labels?'Paw  cmH2O':'',dt);
    this.laneSweep(ctx,band,band*2,w,'#22e34a','flow',labels?'Flow  L/min':'',dt);
    this.laneSweep(ctx,band*2,band*3,w,'#c98bff','vol',labels?'Volume  mL':'',dt);
  }
  // pressure–volume and flow–volume loops: current breath bright, previous breath faded
  drawLoop(canvas,wrap,xi,yi,xr,yr,xl,yl){
    const s=this.sizeCanvas(canvas,wrap); if(!s) return; const {ctx,w,h}=s;
    ctx.clearRect(0,0,w,h);
    const m=24, X=(v)=>m+(v-xr[0])/(xr[1]-xr[0])*(w-m-10), Y=(v)=>h-m-(v-yr[0])/(yr[1]-yr[0])*(h-m-12);
    ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(m,h-m); ctx.lineTo(w-6,h-m); ctx.moveTo(m,8); ctx.lineTo(m,h-m);
    if(yr[0]<0){ ctx.moveTo(m,Y(0)); ctx.lineTo(w-6,Y(0)); } ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.45)'; ctx.font='10.5px ui-monospace,monospace'; ctx.fillText(yl,m+6,16); ctx.fillText(xl,w-ctx.measureText(xl).width-8,h-8);
    const path=(pts,alpha)=>{ if(pts.length<2) return; ctx.globalAlpha=alpha; ctx.strokeStyle='#c98bff'; ctx.lineWidth=1.8; ctx.beginPath(); pts.forEach((p,i)=>{ const x=X(p[xi]), y=Y(p[yi]); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }); ctx.stroke(); ctx.globalAlpha=1; };
    path(this._loopPrev,0.4); path(this._loopCur,1);
  }
  drawLoops(){
    const pts=this._loopCur.concat(this._loopPrev); if(!pts.length) return;
    let pmax=1, vmax=1, fmax=1; for(const p of pts){ if(p[0]>pmax)pmax=p[0]; if(p[1]>vmax)vmax=p[1]; if(Math.abs(p[2])>fmax)fmax=Math.abs(p[2]); }
    const ps=Math.max(30,Math.ceil((pmax+5)/10)*10), vs=Math.max(200,Math.ceil(vmax*1.15/100)*100), fs=Math.max(40,Math.ceil(fmax*1.15/10)*10);
    this.drawLoop(this.pvCanvas,this.pvWrap,0,1,[0,ps],[0,vs],'Paw cmH2O','Volume mL');
    this.drawLoop(this.fvCanvas,this.fvWrap,1,2,[0,vs],[-fs,fs],'Volume mL','Flow L/min');
  }

  drawAll(t){ const v=this.state.view, st=this.simType();
    const phys=this.physMode() && !!this._sim && (v==='display'||v==='control'||v==='trainee');
    if(phys) this.stepEngine(t);
    const dt=this._frameDt||0.016;
    if(v==='display'){
      if(st!=='vent'){ if(phys) this.drawMonPhys(this.dispCanvas,this.dispWrap,dt,true); else this.drawMon(this.dispCanvas,this.dispWrap,t); }
      if(st!=='hemo'){ if(phys){ this.drawVentPhys(this.dispVentCanvas,this.dispVentWrap,dt,true); this.drawLoops(); } else this.drawVent(this.dispVentCanvas,this.dispVentWrap,t); }
    }
    if(v==='trainee'){ if(phys){ this.drawVentPhys(this.dispVentCanvas,this.dispVentWrap,dt,true); this.drawLoops(); this.drawEcgStrip(this.trCanvas,this.trWrap,dt); } else this.drawVent(this.dispVentCanvas,this.dispVentWrap,t); }
    if(v==='display') this.audioTick();
    if(v==='control'){
      if(st!=='vent'){ if(phys) this.drawMonPhys(this.prevCanvas,this.prevWrap,dt,false); else this.drawMon(this.prevCanvas,this.prevWrap,t); }
      if(st!=='hemo'){ if(phys) this.drawVentPhys(this.prevVentCanvas,this.prevVentWrap,dt,false); else this.drawVent(this.prevVentCanvas,this.prevVentWrap,t); }
    }
  }

  // Alarm latch: switch on when `on`, off only when `off` (hysteresis), so values at a limit don't flicker.
  latch(key, on, off){ const a=this._alarms||(this._alarms={}); if(on) a[key]=true; else if(off) a[key]=false; return !!a[key]; }

  // ======================= step E: alarms, resuscitation, debrief =======================
  resusSt(){ return {...this.RESUS_DEFAULT, ...(this.state.live.resus||{})}; }
  setRhythm(k){
    const l=this.state.live; if(k===l.rhythm) return;
    this.setLive({rhythm:k});
    const R=this.eng(), lab=(R&&R.RHYTHMS[k]&&this.physMode()?R.RHYTHMS[k].label:((this.RHYTHMS.find(r=>r.k===k)||{}).label))||k;
    this.log('Instructor','Rhythm set: '+lab);
  }
  // Only the instructor's engine decides rhythm changes (shock outcomes, arrest, ROSC). Followers draw
  // the defibrillator artefact when the controller reports a shock in `live.lastShock`.
  afterSync(){
    const sim=this._sim; if(!sim) return;
    sim.authority=this.isPublisher();
    const ls=this.state.live.lastShock, id=ls&&ls.id;
    if(this._shockSeen===undefined){ this._shockSeen=id; return; }
    if(id && id!==this._shockSeen){ this._shockSeen=id; if(!this.isPublisher()) sim.heart.shockT=sim.t; }
  }

  // the monitored numbers in either mode — physiology: measured by the engine; manual: as set
  nums(V){
    const l=this.state.live;
    if(V){ const w=V.vent, vOn=!!(l.phys&&l.phys.ventilated);
      return { hr:V.hr, spo2:V.spo2, sys:V.abp.sys, dia:V.abp.dia, map:V.abp.map, etco2:V.etco2, rr:V.rr, cvp:V.cvp, pip:vOn&&w?w.pip:null,
        apnea:!!V.apnea, rhythm:l.rhythm, vent:vOn, cpr:!!(V.resus&&V.resus.cpr) }; }
    const perf=this.perfusing(), m=this.simType()!=='hemo'?this.ventModel():null, sys=l.sys>0?+l.sys:null;
    return { hr:perf&&+l.hr>0?+l.hr:null, spo2:perf&&+l.spo2>0?+l.spo2:null, sys, dia:sys?+l.dia:null, map:sys?this.mapNum():null,
      etco2:+l.etco2||0, rr:+l.rr||0, cvp:perf&&l.cvp!=null?+l.cvp:null, pip:m?m.PIP:null, apnea:false, rhythm:l.rhythm, vent:!!m, cpr:false };
  }

  // Alarms: limit alarms (medium, yellow) with hysteresis; arrest rhythms, apnoea, airway loss and
  // extreme values are high priority (red) and LATCH — they stay on the bar, marked resolved, until
  // someone acknowledges them, so a brief run of VF is never missed.
  alarmEval(n, ventAlarm, hemo, vent){
    const L={...this.ALARM_DEFAULT, ...(this.state.live.alarmLim||{})}, out=[], ok=(x)=>x!=null&&isFinite(x);
    const push=(a)=>{ if(!out.some(b=>b.text===a.text)) out.push(a); };
    if(hemo){
      const RA={ vf:['VF · SHOCKABLE',2], pvt:['PULSELESS VT · SHOCKABLE',2], torsades:['TORSADES',2], asystole:['ASYSTOLE',2], pea:['PEA · NO PULSE',2], vt:['V-TACH',2],
                 svt:['SVT',1], af:['ATRIAL FIB',1], istemi:['ST ELEVATION',1], avb3:['COMPLETE HEART BLOCK',1], avb2ii:['MOBITZ II',1], avb2i:['MOBITZ I',1] };
      const r=RA[n.rhythm]; if(r) push({id:'rh:'+n.rhythm, text:r[0], prio:r[1]});
      if(n.apnea) push({id:'apnea', text:'APNOEA', prio:2});
      const lim=(id,label,val,lo,hi,m,xlo,xhi)=>{ const has=ok(val);
        const low=this.latch('al:'+id+'lo', has&&lo!=null&&val<lo, !has||lo==null||val>=lo+m);
        const xl=this.latch('al:'+id+'xl', has&&xlo!=null&&val<xlo, !has||xlo==null||val>=xlo+m);
        const high=this.latch('al:'+id+'hi', has&&hi!=null&&val>hi, !has||hi==null||val<=hi-m);
        const xh=this.latch('al:'+id+'xh', has&&xhi!=null&&val>xhi, !has||xhi==null||val<=xhi-m);
        if(low||xl) push({id:id+'lo', text:label+' '+Math.round(val)+' LOW', prio:xl?2:1});
        if(high||xh) push({id:id+'hi', text:label+' '+Math.round(val)+' HIGH', prio:xh?2:1}); };
      lim('hr','HR',n.hr,L.hrLo,L.hrHi,3,40,150);
      lim('spo2','SpO₂',n.spo2,L.spo2Lo,null,2,85,null);
      lim('sys','SBP',n.sys,L.sysLo,L.sysHi,4,70,null);
      lim('map','MAP',n.map,L.mapLo,null,3,50,null);
      lim('et','EtCO₂',!n.apnea&&(n.etco2>0||n.vent)?n.etco2:null,L.etco2Lo,L.etco2Hi,2,null,null);
      lim('rr','RR',n.apnea?null:n.rr,L.rrLo,L.rrHi,2,null,null);
    }
    if(vent && ventAlarm) push({id:'v:'+ventAlarm, text:ventAlarm, prio:['DISCONNECT','EXTUBATED','NO CO₂','APNOEA'].includes(ventAlarm)?2:1});
    const lat=this._latched||(this._latched={}), act=new Set(out.map(a=>a.id));
    for(const a of out) if(a.prio===2) lat[a.id]={id:a.id, text:a.text, prio:2};
    for(const id in lat) if(!act.has(id)) out.push({id, text:lat[id].text, prio:2, resolved:true});
    const ack=this._acked||(this._acked=new Set());
    for(const id of Array.from(ack)) if(!act.has(id)) ack.delete(id);
    out.sort((a,b)=>(b.prio-a.prio)||((a.resolved?1:0)-(b.resolved?1:0)));
    this._alarmNow=out;
    this._alarmPrio=out.filter(a=>!a.resolved&&!ack.has(a.id)).reduce((m,a)=>Math.max(m,a.prio),0);
    return out;
  }
  ackAlarms(){
    const act=(this._alarmNow||[]).filter(a=>!a.resolved);
    for(const id in (this._latched||{})) if(!act.some(a=>a.id===id)) delete this._latched[id];
    const ack=this._acked||(this._acked=new Set()); act.forEach(a=>ack.add(a.id));
    this._alarmPrio=0; this.forceUpdate();
  }
  silence(){ this._silenceUntil=Date.now()<(this._silenceUntil||0)?0:Date.now()+120000; this.forceUpdate(); }

  // ---- monitor sound (Display only; a browser allows audio only after a tap) ----
  // Pulse tone on every detected pulse, its pitch falling a semitone per 1 % SpO2 (as bedside
  // monitors do); alarm tones: high priority = 5-pulse burst every 10 s, medium = 3 pulses every 20 s.
  audio(){ if(!this._ac){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; try{ this._ac=new AC(); }catch(e){ return null; } }
    if(this._ac.state==='suspended') this._ac.resume(); return this._ac; }
  tone(freq, start, dur, vol, type){ const ac=this._ac; if(!ac) return;
    const o=ac.createOscillator(), g=ac.createGain(); o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(vol,start+0.01); g.gain.setValueAtTime(vol,start+Math.max(0.02,dur-0.02)); g.gain.linearRampToValueAtTime(0,start+dur);
    o.connect(g); g.connect(ac.destination); o.start(start); o.stop(start+dur+0.03); }
  toggleSound(){ const on=!this.state.sndOn; if(on){ if(!this.audio()) return; this._lastAlarmTone=null; } this.setState({sndOn:on}); }
  audioTick(){
    const ac=this._ac; if(!this.state.sndOn||!ac) return;
    const now=ac.currentTime, l=this.state.live;
    if(this.state.pulseTone!==false){
      let beat=false, spo2=null;
      if(this.physMode()&&this._sim){ const pt=this._sim.pulseT, last=pt.length?pt[pt.length-1]:null;
        if(last!=null && last!==this._lastPulseT){ beat=this._lastPulseT!=null; this._lastPulseT=last; } spo2=this._sim.vitals.spo2; }
      else if(this.perfusing() && +l.hr>0 && +l.spo2>0){ const T=60/+l.hr; if(!this._lastBeep || now-this._lastBeep>=T){ beat=!!this._lastBeep; this._lastBeep=now; } spo2=+l.spo2; }
      if(beat && spo2!=null) this.tone(880*Math.pow(2,(Math.min(100,spo2)-100)/12), now+0.01, 0.07, 0.10, 'sine');
    }
    const pr=this._alarmPrio||0, silenced=Date.now()<(this._silenceUntil||0);
    if(pr && !silenced){ const period=pr===2?10:20;
      if(this._lastAlarmTone==null || now-this._lastAlarmTone>=period){ this._lastAlarmTone=now;
        if(pr===2) [0,0.14,0.28,0.56,0.70].forEach(d=>this.tone(880,now+d,0.11,0.16,'triangle'));
        else [0,0.22,0.44].forEach(d=>this.tone(622,now+d,0.16,0.13,'triangle')); } }
    else this._lastAlarmTone=null;
  }

  // ---- defibrillator (trainee): charge, then shock — as on a real manual defibrillator ----
  charge(){ const J=this.state.defJ||200, sync=!!this.state.defSync; clearTimeout(this._chgT);
    this.setState({chg:{phase:'charging', J, sync}});
    this._chgT=setTimeout(()=>this.setState(s=>s.chg?{chg:{...s.chg, phase:'ready', t:Date.now()}}:null), 3000); }

  // ---- debrief: full timeline + 5-second trends, kept on the instructor's device ----
  loadD(){ const sid=this.state.sid; if(this._dSid===sid) return; this._dSid=sid;
    const rd=(k)=>{ try{ return JSON.parse(localStorage.getItem(this.liveKey(sid)+':'+k))||[]; }catch(e){ return []; } };
    this._dlog=rd('dlog'); this._trend=rd('trend'); }
  saveD(){ if(!this._dSid) return; this._dDirty=false;
    try{ localStorage.setItem(this.liveKey(this._dSid)+':dlog', JSON.stringify(this._dlog.slice(-3000))); localStorage.setItem(this.liveKey(this._dSid)+':trend', JSON.stringify(this._trend.slice(-4000))); }catch(e){} }
  dpush(who,text){ this.loadD(); this._dlog.push({ms:Date.now(), who, text}); this._dDirty=true; }
  tick1s(){
    if(!this.isPublisher() || this.state.view!=='control') return;
    this.loadD(); const now=Date.now();
    if(now-(this._trendT||0)>=5000){ this._trendT=now;
      const V=this.physMode()&&this._sim?this._sim.vitals:null, n=this.nums(V), r=(x)=>(x==null||!isFinite(x))?null:Math.round(x);
      this._trend.push({ms:now, hr:r(n.hr), spo2:r(n.spo2), sys:r(n.sys), dia:r(n.dia), map:r(n.map), etco2:r(n.etco2), rr:r(n.rr), cvp:r(n.cvp), pip:r(n.pip), cpr:n.cpr?1:0, rh:n.rhythm});
      if(this._trend.length>4000) this._trend.splice(0,this._trend.length-4000); this._dDirty=true; }
    if(this._dDirty && now-(this._dSaveT||0)>=15000){ this._dSaveT=now; this.saveD(); }
    if(this._scr && this._scr.run.status==='running' && now-(this._scrSaveT||0)>=5000){ this._scrSaveT=now; this.scrSave(); }
  }
  newRun(){
    if(!window.confirm('Start a new debrief record? The timeline and trends recorded so far will be cleared.')) return;
    this.loadD(); this._dlog=[]; this._trend=[]; this._trendT=0; this.saveD();
    if(this._sim && this.eng()) this._sim.resus.stats=this.eng().Resus.newStats();
    this.setLive({runT0:Date.now(), log:[]});
  }
  mmss(sec){ sec=Math.max(0,Math.round(sec||0)); return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'); }
  tPlus(ms,t0){ return 'T+'+this.mmss((ms-t0)/1000); }
  debriefStats(){
    this.loadD(); const l=this.state.live, t0=l.runT0||(this._trend[0]&&this._trend[0].ms)||(this._dlog[0]&&this._dlog[0].ms)||Date.now();
    const S=this.physMode()&&this._sim?this._sim.vitals.resus.stats:null;
    const rows=[['Run time', this.mmss((Date.now()-t0)/1000)], ['Timeline entries', String(this._dlog.filter(e=>e.ms>=t0-1000).length)], ['Trend samples', this._trend.length+' · every 5 s']];
    if(S && S.arrests){
      rows.push(['Arrests · ROSC', S.arrests+' · '+S.roscs], ['Time without a pulse', this.mmss(S.arrestT)],
        ['First compression after', S.firstCPR==null?'—':this.mmss(S.firstCPR)], ['CPR fraction', S.cprFraction==null?'—':Math.round(S.cprFraction*100)+' %'],
        ['Longest pause in CPR', this.mmss(S.longestPause)], ['Shocks delivered', String(S.shocks)]);
    }
    const adr=this._dlog.filter(e=>e.ms>=t0-1000 && /Adrenaline 1 mg/.test(e.text));
    if(adr.length) rows.push(['Adrenaline 1 mg', adr.map(e=>this.tPlus(e.ms,t0)).join(', ')]);
    const sc=this.scr(); if(sc.run.status!=='ready'){ const fired=(l)=>l.filter(s=>sc.run.fired[s.id]!=null).length;
      const seq=sc.def.steps.filter(s=>!s.when.any), any=sc.def.steps.filter(s=>s.when.any);
      rows.push(['Scenario script', (sc.def.name||'untitled')+' · '+fired(seq)+' of '+seq.length+' steps'+(any.length?' · any time: '+fired(any)+' of '+any.length+' fired':'')+' · T+'+this.mmss(sc.run.t)]); }
    return {t0, rows};
  }
  download(name, mime, text){
    try{ const b=new Blob([text],{type:mime}), u=URL.createObjectURL(b), a=document.createElement('a');
      a.href=u; a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); },1500); }catch(e){}
  }
  fileStamp(){ const d=new Date(), p=(x)=>String(x).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes()); }
  exportCsv(){
    const {t0}=this.debriefStats(), q=(s)=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
    const rows=['time_s,clock,hr,spo2,sys,dia,map,etco2,rr,cvp,pip,cpr,rhythm'].concat(this._trend.filter(p=>p.ms>=t0-1000).map(p=>[Math.round((p.ms-t0)/1000), new Date(p.ms).toLocaleTimeString(), p.hr, p.spo2, p.sys, p.dia, p.map, p.etco2, p.rr, p.cvp, p.pip, p.cpr, p.rh].map(x=>x==null?'':x).join(',')));
    rows.push('', 'time_s,clock,who,entry'); this._dlog.filter(e=>e.ms>=t0-1000).forEach(e=>rows.push([Math.round((e.ms-t0)/1000), q(new Date(e.ms).toLocaleTimeString()), q(e.who), q(e.text)].join(',')));
    this.download('ResusSim-trends-'+this.state.sid+'-'+this.fileStamp()+'.csv', 'text/csv', rows.join('\n'));
  }
  // A standalone HTML report: summary, trend charts (CPR shaded, timeline entries marked) and the timeline.
  exportDebrief(){
    const {t0, rows}=this.debriefStats(), l=this.state.live, tr=this._trend.filter(p=>p.ms>=t0-1000), lg=this._dlog.filter(e=>e.ms>=t0-1000);
    const esc=(s)=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const tEnd=Math.max(Date.now(), t0+60000), span=(tEnd-t0)/60000, W=960, PL=44, PR=12;
    const X=(ms)=>PL+(ms-t0)/60000/span*(W-PL-PR);
    const chart=(title, H, lo, hi, series, numbers)=>{
      const Y=(v)=>6+H-(Math.max(lo,Math.min(hi,v))-lo)/(hi-lo)*H;
      let s='<svg viewBox="0 0 '+W+' '+(H+30)+'" width="100%" role="img" aria-label="'+esc(title)+'">';
      let st=null; tr.forEach((p,i)=>{ if(p.cpr&&st==null) st=p.ms; if(st!=null&&(!p.cpr||i===tr.length-1)){ s+='<rect x="'+X(st).toFixed(1)+'" y="6" width="'+Math.max(2,X(p.ms)-X(st)).toFixed(1)+'" height="'+H+'" fill="#F5A623" opacity="0.16"/>'; st=null; } });
      for(let k=0;k<=4;k++){ const v=lo+(hi-lo)*k/4, y=Y(v).toFixed(1); s+='<line x1="'+PL+'" x2="'+(W-PR)+'" y1="'+y+'" y2="'+y+'" stroke="#e5e8ec"/><text x="'+(PL-6)+'" y="'+(+y+3.5)+'" font-size="10" text-anchor="end" fill="#6b7480">'+Math.round(v)+'</text>'; }
      const step=span<=10?1:span<=30?5:span<=90?10:30;
      for(let m=0;m<=span+1e-9;m+=step){ const x=(PL+m/span*(W-PL-PR)).toFixed(1); s+='<text x="'+x+'" y="'+(H+22)+'" font-size="10" text-anchor="middle" fill="#6b7480">'+m+' min</text>'; }
      lg.forEach((e,i)=>{ const x=X(e.ms).toFixed(1); s+='<line x1="'+x+'" x2="'+x+'" y1="6" y2="'+(H+6)+'" stroke="#587DFF" stroke-dasharray="3 3" opacity="0.45"/>'; if(numbers) s+='<text x="'+x+'" y="'+(i%2?14:24)+'" font-size="9" text-anchor="middle" fill="#587DFF">'+(i+1)+'</text>'; });
      series.forEach(([key,color,width])=>{ let d='', pen=false; tr.forEach(p=>{ const v=p[key]; if(v==null){ pen=false; return; } d+=(pen?'L':'M')+X(p.ms).toFixed(1)+' '+Y(v).toFixed(1); pen=true; });
        if(d) s+='<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+(width||1.8)+'" stroke-linejoin="round"/>'; });
      return '<h3>'+esc(title)+'</h3>'+s+'</svg>';
    };
    const hasPip=tr.some(p=>p.pip!=null);
    const sc=this.physMode()&&this.eng()?this.eng().scenario((l.phys||{}).preset):null;
    const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ResusSim debrief</title>'
      +'<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1d232b;background:#fff;margin:0;padding:24px 16px;max-width:1000px;margin-inline:auto;line-height:1.45}'
      +'h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px}h3{font-size:13px;margin:18px 0 2px;color:#3d4652}.sub{color:#6b7480;font-size:13px}'
      +'table{border-collapse:collapse;width:100%;font-size:13px}td,th{text-align:left;padding:5px 8px;border-bottom:1px solid #e5e8ec;vertical-align:top}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7480}'
      +'.kv td:first-child{color:#6b7480;width:42%}.mono{font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap}.warn{margin-top:28px;padding:8px 12px;border-radius:8px;background:#FFF4E5;color:#8a4b00;font-size:12px;font-weight:600}'
      +'.key{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#6b7480;margin-top:6px}.key span::before{content:"";display:inline-block;width:14px;height:3px;margin-right:6px;vertical-align:middle;background:var(--c)}</style></head><body>'
      +'<h1>ResusSim debrief</h1><div class="sub">'+esc(l.name||'Patient')+' · '+esc(l.age||'')+' '+esc(l.sex||'')+(sc?' · '+esc(sc.label):'')+' · started '+esc(new Date(t0).toLocaleString())+' · session '+esc(this.state.sid)+'</div>'
      +'<h2>Summary</h2><table class="kv">'+rows.map(([k,v])=>'<tr><td>'+esc(k)+'</td><td class="mono">'+esc(v)+'</td></tr>').join('')+'</table>'
      +'<h2>Trends</h2><div class="key"><span style="--c:#F5A623">chest compressions (shaded)</span><span style="--c:#587DFF">timeline entry (numbered below)</span></div>'
      +chart('Heart rate (bpm)',110,0,200,[['hr','#12a33a']],true)
      +chart('SpO₂ (%)',90,50,100,[['spo2','#1c8fd1']])
      +chart('Blood pressure (mmHg) — systolic, mean, diastolic',120,0,200,[['sys','#d64545'],['map','#8f1d1d',2.4],['dia','#e88a8a']])
      +chart('EtCO₂ (mmHg)',90,0,80,[['etco2','#4a4f57']])
      +(hasPip?chart('Peak airway pressure (cmH₂O)',80,0,50,[['pip','#1c8fd1']]):'')
      +'<h2>Timeline</h2><table><tr><th>#</th><th>Time</th><th>Clock</th><th>Who</th><th>Entry</th></tr>'
      +lg.map((e,i)=>'<tr><td class="mono">'+(i+1)+'</td><td class="mono">'+this.tPlus(e.ms,t0)+'</td><td class="mono">'+esc(new Date(e.ms).toLocaleTimeString())+'</td><td>'+esc(e.who)+'</td><td>'+esc(e.text)+'</td></tr>').join('')+'</table>'
      +'<div class="warn">Training simulation — not a medical device, not a clinical record. All patient data is fictional.</div></body></html>';
    this.download('ResusSim-debrief-'+this.state.sid+'-'+this.fileStamp()+'.html', 'text/html', html);
  }

  // ECG strip on the trainee's defibrillator panel (no rhythm label — they read it themselves)
  drawEcgStrip(canvas,wrap,dt){ const s=this.sizeCanvas(canvas,wrap); if(!s) return; const {ctx,w,h}=s;
    ctx.clearRect(0,0,w,h); this.grid(ctx,w,h); this.laneSweep(ctx,0,h,w,'#22e34a','ecg','ECG II',dt); }

  // Bindings for alarms (both modes), the resuscitation panels, alarm limits and the debrief card.
  stepEBindings(out){
    const l=this.state.live, phys=this.physMode(), V=phys&&this._sim?this._sim.vitals:null, R=this.eng();
    const rs=this.resusSt(), ph={...this.PHYS_DEFAULT, ...(l.phys||{})}, L={...this.ALARM_DEFAULT, ...(l.alarmLim||{})};
    const chip=(on,c)=>({ color:on?'#fff':c, bg:on?c:'transparent', border:c });
    const f=(x,d)=>(x==null||!isFinite(x))?'--':(+x).toFixed(d||0);
    // ---- alarms
    const al=this.alarmEval(this.nums(V), out.ventAlarm, out.showHemo, out.showVent), top=al[0];
    const pal=top?(top.resolved?['#cfd4d8','#151a21']:top.prio===2?['#F0483E','#3a0d0d']:['#F5A623','#2a2113']):['#fff','transparent'];
    out.hasAlert=!!top; out.alertText=top?top.text+(top.resolved?' · resolved':''):''; out.alertColor=pal[0]; out.alertBg=pal[1];
    out.alarmMore=al.slice(1,4).map(a=>a.text+(a.resolved?' ✓':'')).join(' · ')+(al.length>4?' · +'+(al.length-4):'');
    const silenced=Date.now()<(this._silenceUntil||0);
    out.alarmCanAck=al.some(a=>a.resolved)||(this._alarmPrio||0)>0; out.ackAlarms=()=>this.ackAlarms();
    out.alarmCanSilence=al.length>0||silenced; out.silence=()=>this.silence();
    out.silenceLabel=silenced?'Silenced '+this.mmss((this._silenceUntil-Date.now())/1000):'Silence 2 min';
    out.sndOn=!!this.state.sndOn; out.toggleSound=()=>this.toggleSound();
    out.soundLabel=this.state.sndOn?'Sound on':'Sound off'; out.soundIcon=this.state.sndOn?'volume-2':'volume-x';
    out.soundColor=this.state.sndOn?'#12B981':'var(--neutral-300)';
    out.pulseTone=this.state.pulseTone!==false; out.togglePulseTone=()=>this.setState({pulseTone:this.state.pulseTone===false});
    // ---- alarm limits (instructor; shared with every screen)
    const setLim=(k,v,mn,mx)=>this.setLive({alarmLim:{...L, [k]:Math.max(mn,Math.min(mx,v))}});
    out.alarmRows=this.ALARM_ROWS.map(([lo,hi,label,unit,st,mn,mx])=>({ label, unit, hasLo:!!lo, hasHi:!!hi, lo:lo?String(L[lo]):'', hi:hi?String(L[hi]):'',
      loDec:()=>lo&&setLim(lo,L[lo]-st,mn,hi?L[hi]-st:mx), loInc:()=>lo&&setLim(lo,L[lo]+st,mn,hi?L[hi]-st:mx),
      hiDec:()=>hi&&setLim(hi,L[hi]-st,lo?L[lo]+st:mn,mx), hiInc:()=>hi&&setLim(hi,L[hi]+st,lo?L[lo]+st:mn,mx) }));
    out.resetAlarmLimits=()=>this.setLive({alarmLim:{...this.ALARM_DEFAULT}});
    // ---- debrief (instructor)
    if(this.state.view==='control'){ const d=this.debriefStats(); out.dbRows=d.rows.map(([k,v])=>({k,v})); }
    else out.dbRows=[];
    out.exportDebrief=()=>this.exportDebrief(); out.exportCsv=()=>this.exportCsv(); out.newRun=()=>this.newRun();
    out.addNote=()=>{ const t=(window.prompt('Note for the debrief timeline:','')||'').trim(); if(t) this.log('Instructor','Note: '+t); };
    // ---- resuscitation (physiology mode)
    const RV=V&&V.resus, pz=RV&&RV.pacing, S=RV&&RV.stats, q=this.CPR_Q[rs.cprQ]||this.CPR_Q.good;
    let line='', lc='#F5A623';
    if(phys&&rs.cpr) line='CPR '+this.mmss(S?S.cycleT:0)+' · '+q.rate+'/min';
    if(phys&&rs.pace){ const pl='PACER '+rs.paceRate+'/min '+rs.paceMA+' mA · '+(!pz?'':pz.inhibited?'inhibited':!pz.capture?'NO CAPTURE':pz.mech?'capture':'NO PULSE');
      line=line?line+'   '+pl:pl; if(!rs.cpr) lc=pz&&pz.capture&&pz.mech?'#67DCFF':'#F5A623'; }
    out.resusLine=line; out.resusColor=lc; out.hasResusLine=!!line;
    out.cprOn=!!rs.cpr; out.cprBtnLabel=rs.cpr?'Pause CPR':'Start CPR';
    out.cprBtnBg=rs.cpr?'#F5A623':'#F0483E'; out.cprBtnFg=rs.cpr?'#1a1204':'#fff';
    out.toggleCPR=()=>this.sendCmd({kind:'cpr', on:!rs.cpr});
    out.cprQChips=Object.keys(this.CPR_Q).map(k=>({ label:this.CPR_Q[k].label, ...chip((rs.cprQ||'good')===k,'#D2870D'),
      onClick:()=>{ if((rs.cprQ||'good')===k) return; this.setLive({resus:{...rs, cprQ:k}}); this.log('Instructor','CPR quality: '+this.CPR_Q[k].label.toLowerCase()); } }));
    const vOn=!!ph.ventilated;
    out.bagLabel=vOn?(+l.vFio2>=100?'FiO₂ 100 % — on':'FiO₂ 100 %'):'Bag-mask ventilate · 10/min · O₂';
    out.bag=()=>{ if(!(vOn&&+l.vFio2>=100)) this.sendCmd({kind:'bag'}); };
    const J=this.state.defJ||200, sync=!!this.state.defSync;
    out.energyChips=[120,150,200,360].map(j=>({ label:j+' J', ...chip(J===j,'#F0483E'), onClick:()=>this.setState({defJ:j}) }));
    out.syncChips=[{ label:sync?'SYNC on':'SYNC off', ...chip(sync,'#D2870D'), onClick:()=>this.setState({defSync:!sync}) }];
    out.shockNow=()=>this.sendCmd({kind:'shock', J, sync});
    out.shockNowLabel=(sync?'Cardiovert ':'Shock ')+J+' J';
    const cg=this.state.chg;
    out.chgIdle=!cg; out.chgCharging=!!cg&&cg.phase==='charging'; out.chgReady=!!cg&&cg.phase==='ready';
    out.chgLabel=cg?(cg.phase==='charging'?'Charging '+cg.J+' J…':'Charged '+cg.J+' J'+(cg.sync?' · SYNC':'')+' — stand clear'):'';
    out.charge=()=>this.charge(); out.disarm=()=>{ clearTimeout(this._chgT); this.setState({chg:null}); };
    out.shockArmed=()=>{ const c=this.state.chg; if(!c||c.phase!=='ready') return; this.sendCmd({kind:'shock', J:c.J, sync:c.sync}); this.setState({chg:null}); };
    out.shockModeChips=this.SHOCK_MODES.map(([k,label])=>({ label, ...chip((ph.shockMode||'auto')===k,'var(--action)'),
      onClick:()=>{ if((ph.shockMode||'auto')!==k){ this.patchPhys({shockMode:k}); this.log('Instructor','Shock outcome: '+label.toLowerCase()); } } }));
    out.autoArrestChips=[{ label:ph.autoArrest!==false?'Patient can arrest and recover on their own':'Rhythm changes only when you set them', ...chip(ph.autoArrest!==false,'#12B981'),
      onClick:()=>this.patchPhys({autoArrest:ph.autoArrest===false}) }];
    out.paceChips=[{ label:rs.pace?'Pacer on':'Pacer off', ...chip(!!rs.pace,'#0E9468'), onClick:()=>this.sendCmd({kind:'pace', patch:{pace:!rs.pace}}) }];
    const pr=(k,label,unit,st,mn,mx)=>({ label, unit, disp:String(rs[k]),
      inc:()=>this.sendCmd({kind:'pace', patch:{pace:rs.pace, [k]:Math.min(mx,(+rs[k]||0)+st)}}), dec:()=>this.sendCmd({kind:'pace', patch:{pace:rs.pace, [k]:Math.max(mn,(+rs[k]||0)-st)}}) });
    out.paceRows=[pr('paceRate','Rate','/min',5,30,180), pr('paceMA','Output','mA',5,0,200)];
    out.paceThrDisp=String(ph.paceThreshold); out.paceThrInc=()=>this.patchPhys({paceThreshold:Math.min(150,(+ph.paceThreshold||65)+5)}); out.paceThrDec=()=>this.patchPhys({paceThreshold:Math.max(20,(+ph.paceThreshold||65)-5)});
    out.paceStatus=!rs.pace?'Pacer off.':!pz?'Starting…':pz.inhibited?'Inhibited — the patient’s own rate is above the pacing rate.':!pz.capture?'No capture — output below the threshold ('+Math.round(pz.threshold)+' mA now).':pz.mech?'Electrical and mechanical capture — check the pulse.':'Electrical capture but NO pulse (PEA / asystole).';
    out.resusReadout=V?[
      ['Coronary perfusion', f(V.cpp)+' mmHg'], ['Myocardial O₂ debt', f(Math.min(100,V.hypox/1.45*100))+' %'],
      ['CPR flow', rs.cpr?f(RV.cprCO,1)+' L/min':'—'], ['Time without pulse', S?this.mmss(S.arrestT):'—'],
      ['CPR fraction', S&&S.cprFraction!=null?Math.round(S.cprFraction*100)+' %':'—'], ['Longest pause', S?this.mmss(S.longestPause):'—'],
    ].map(([k,v])=>({k,v})):[];
    out.bolusArrest=R?[['adrenaline',3],['amiodarone',0],['amiodarone',1],['atropine',1]].filter(([id,i])=>R.DRUGS[id]&&R.DRUGS[id].bolus&&R.DRUGS[id].bolus[i])
      .map(([id,i])=>({ label:R.DRUGS[id].label+' '+R.DRUGS[id].bolus[i].label, onClick:()=>this.sendCmd({kind:'bolus', drug:id, i}) })):[];
    out.setTrCanvas=this._refs.trC; out.setTrWrap=this._refs.trW;
    out.tResusOpen=!!out.tTreatOpen;
    return out;
  }

  // Treatments, events, trainee locks, activity log and the trainee console (step D).
  stepDBindings(out, phys, chip){
    const R=this.eng(), l=this.state.live, sim=phys?this._sim:null, tr=sim?sim.treatments():null;
    const perm={vent:true, treat:true, ...(l.trainee||{})};
    const fmtRate=(D,r)=>{ const st=D.rate.step; return (+r).toFixed(st<0.1?2:st<1?1:0); };
    const mmss=(sec)=>{ sec=Math.max(0,Math.round(sec)); return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'); };
    // fluids
    out.fluidBtns=[['Crystalloid 250 mL','5 min','crystalloid',250,5],['Crystalloid 500 mL','10 min','crystalloid',500,10],['Crystalloid 1 L','15 min','crystalloid',1000,15],['Packed red cells','1 unit · 15 min','blood',300,15]]
      .map(([label,sub,fluid,mL,minutes])=>({ label, sub, onClick:()=>this.sendCmd({kind:'fluid', fluid, mL, minutes}) }));
    // push doses and induction drugs, by group
    const bol=(ids)=>R?ids.filter(id=>R.DRUGS[id]&&R.DRUGS[id].bolus).flatMap(id=>R.DRUGS[id].bolus.map((b,i)=>({ label:R.DRUGS[id].label+' '+b.label, onClick:()=>this.sendCmd({kind:'bolus', drug:id, i}) }))):[];
    out.bolusPressor=bol(['adrenaline','phenylephrine']);
    out.bolusInduction=bol(['propofol','ketamine','etomidate','fentanyl','midazolam','rocuronium','suxamethonium']);
    out.bolusRhythm=bol(['atropine','adenosine','salbutamol']);
    // infusions: −/+ in clinically sized steps
    const STEP={ noradrenaline:0.02, adrenaline:0.02, vasopressin:0.01, phenylephrine:0.2, dobutamine:2.5, gtn:10, propofol:10 };
    out.infRows=R?Object.keys(R.DRUGS).filter(id=>R.DRUGS[id].rate).map(id=>{ const D=R.DRUGS[id], st=tr&&tr.drugs.find(d=>d.id===id), rate=st?st.rate:0, step=STEP[id]||D.rate.step;
      return { label:D.label, unit:D.rate.unit, disp:fmtRate(D,rate), on:rate>0, color:rate>0?'#12B981':'var(--text-subtle)',
        inc:()=>this.sendCmd({kind:'infuse', drug:id, rate:+Math.min(D.rate.max, rate+step).toFixed(4)}),
        dec:()=>this.sendCmd({kind:'infuse', drug:id, rate:+Math.max(0, rate-step).toFixed(4)}),
        stop:()=>this.sendCmd({kind:'infuse', drug:id, rate:0}) }; }):[];
    // procedures — each resolves the events it treats
    out.procBtns=this.PROCS.map(([action,label])=>({ label, onClick:()=>this.sendCmd({kind:'action', action}) }));
    // on board
    const ob=[];
    if(tr){
      for(const d of tr.drugs){ const D=R.DRUGS[d.id]; ob.push(d.infusing?D.label+' '+fmtRate(D,d.rate)+' '+d.unit+' · effect '+Math.round(d.effect*100)+' %':D.label+' · acting '+Math.round(d.effect*100)+' %'); }
      for(const b of tr.bags) ob.push(b.label+' · '+Math.round(b.left)+' of '+b.total+' mL to run');
    }
    out.onBoard=ob.map(t=>({t})); out.hasOnBoard=ob.length>0; out.noOnBoard=ob.length===0;
    out.bvLine=tr?'Blood volume '+Math.round(tr.bvPct)+' % · Hb '+tr.hb.toFixed(1)+' g/dL · given '+Math.round(tr.given)+' mL · lost '+Math.round(tr.lost)+' mL':'';
    // events (instructor)
    const sev=this.state.evSev||0.7;
    out.sevChips=[[0.4,'Mild'],[0.7,'Moderate'],[1,'Severe']].map(([k,label])=>({ label, ...chip(sev===k,'var(--action)'), onClick:()=>this.setState({evSev:k}) }));
    const evs=(g)=>R?Object.keys(R.EVENTS).filter(id=>R.EVENTS[id].group===g).map(id=>({ label:R.EVENTS[id].label, onClick:()=>this.sendCmd({kind:'event', event:id, sev:this.state.evSev||0.7}) })):[];
    out.evCirc=evs('Circulation'); out.evAirway=evs('Airway & ventilator');
    out.activeEvents=tr?tr.events.map(e=>{ const a=(e.actions||[])[0];
      return { label:e.label, sub:Math.round(100*e.level/Math.max(e.sev,0.01))+' % developed · '+mmss(e.elapsed)+(e.ending?' · resolving':''), color:e.ending?'#12B981':'#F0483E',
        hasAct:!!a&&!e.ending, actLabel:a?a.label:'', onAct:()=>a&&this.sendCmd({kind:'action', action:a.id}),
        canEnd:!e.ending, onEnd:()=>this.sendCmd({kind:'endEvent', key:e.uid, label:e.label}) }; }):[];
    out.hasActiveEvents=out.activeEvents.length>0; out.noActiveEvents=!out.hasActiveEvents;
    // trainee console link + locks (instructor)
    out.traineeChips=[['vent','Ventilator'],['treat','Treatments & procedures']].map(([k,label])=>({ label:label+(perm[k]?' · trainee may use':' · locked'),
      ...chip(perm[k],perm[k]?'#12B981':'#F0483E'), onClick:()=>this.setLive({trainee:{...perm, [k]:!perm[k]}}) }));
    out.copyTraineeLink=()=>{ try{ navigator.clipboard.writeText(location.origin+location.pathname+location.search+'#trainee?s='+encodeURIComponent(this.state.sid)); }catch(e){} };
    out.goTrainee=()=>this.nav('trainee');
    // activity log
    const whoC={ Trainee:'#12B981', Patient:'#F5A623', Instructor:'var(--action)', Script:'#8E5BD6' };
    out.logRows=(l.log||[]).slice(0,16).map(e=>({ t:e.t, who:e.who, text:e.text, color:whoC[e.who]||'var(--text-muted)' }));
    out.hasLog=out.logRows.length>0; out.noLog=!out.hasLog;
    out.clearLog=()=>this.setLive({log:[]});
    // ---- trainee console
    out.isTrainee=this.state.view==='trainee';
    if(!out.isTrainee) return;
    const draft=this.state.draft||{};
    let dm=this.draftVal('vMode')||'VC'; if(dm==='VAC')dm='VC'; if(dm==='PAC')dm='PC';
    out.tModeChips=this.VENT_MODES.map(md=>({ label:md.label, ...chip(dm===md.k,'var(--brand-cyan)'), onClick:()=>this.setDraft('vMode',md.k) }));
    out.tFlowPatChips=[['const','Constant'],['decel','Decelerating']].map(([k,label])=>({ label, ...chip((this.draftVal('vFlowPat')||'const')===k,'var(--brand-cyan)'), onClick:()=>this.setDraft('vFlowPat',k) }));
    out.tShowFlowPat=dm==='VC';
    out.tVentRows=(this.MODE_PARAMS[dm]||[]).map(k=>{ const d=this.VENT_PARAMS[k], v=+this.draftVal(k), changed=draft[k]!=null&&draft[k]!==l[k];
      return { label:d.label, unit:d.unit, min:d.min, max:d.max, step:d.step||1, value:v, disp:(d.step&&d.step<1)?v.toFixed(1):String(Math.round(v)),
        color:changed?'#F5A623':'var(--brand-cyan)', onInput:(e)=>this.setDraft(k,+e.target.value), inc:()=>this.bumpDraft(k,1), dec:()=>this.bumpDraft(k,-1) }; });
    const pending=Object.keys(this.draftPatch()).length;
    out.tHasDraft=pending>0; out.tDraftLabel=pending?pending+' change'+(pending>1?'s':'')+' not yet applied':'';
    out.tApply=()=>this.applyDraft(); out.tCancel=()=>this.setState({draft:null});
    const notIntubated=phys&&!l.phys.ventilated;
    out.tVentOpen=perm.vent&&!notIntubated; out.tVentClosed=!out.tVentOpen;
    out.tVentNote=!perm.vent?'The instructor has locked the ventilator controls.':notIntubated?'The patient is not intubated — no ventilator is connected.':'';
    out.tTreatOpen=perm.treat&&phys; out.tTreatClosed=!out.tTreatOpen;
    out.tTreatNote=!phys?'Treatments need the instructor to run Physiology mode.':'The instructor has locked treatments and procedures.';
    const heard=phys?(this._engHeard&&Date.now()-this._engHeard<5000):this._sync==='live';
    out.tLinkLabel=heard?'Instructor console connected':'Waiting for the instructor console…';
    out.tLinkColor=heard?'#12B981':'#F5A623';
    // the script's own entries are the instructor's scenario mechanics: not shown to the team
    out.tOrders=out.logRows.filter(g=>g.who!=='Script').slice(0,8); out.tHasOrders=out.tOrders.length>0;
    out.miniTiles=[['HR',out.hrDisp,'#22e34a'],['SpO₂',out.spo2Disp,'#67DCFF'],['BP',out.bpDisp,'#ff7b7b'],['ETCO₂',out.etco2Disp,'#e8e8e8']].map(([k,v,c])=>({k,v,c}));
  }

  // ======================= scripted scenario timelines =======================
  // A script is an ordered list of steps. Each step waits — once every step before it has fired — for its
  // condition: a time from Start, a delay after the previous step, or a trigger (SpO₂ or systolic BP below a
  // limit for a while, a shock, a treatment, a rhythm). It then sends ONE order through
  // sendCmd → onCmd → applyCmd → log(), like the buttons, so it lands in Activity and the debrief.
  // An any-time step (when.any) is skipped by that order: it is armed from Start and fires once, whenever its
  // condition holds, until the script finishes (when every step in order has fired).
  // Only the instructor's Controller runs it. Its clock is the patient's (engine time): it stops while this
  // screen's engine does (Home, manual mode) and catches up with it in a hidden tab.
  scrKey(sid){ return this.liveKey(sid)+':script'; }
  // arm: the next step in order's trigger state; anyArm: each any-time step's own (keyed by step id)
  scrRunNew(){ return { status:'ready', t:0, fired:{}, arm:null, anyArm:{}, shocks:0, given:{} }; }
  scrId(){ return 's'+Math.random().toString(36).slice(2,9); }
  scr(){
    const sid=this.state.sid; if(this._scr && this._scr.sid===sid) return this._scr;
    let v=null; try{ v=JSON.parse(localStorage.getItem(this.scrKey(sid))); }catch(e){}
    const def={ name:'', scenario:'', steps:[], ...((v&&v.def)||{}) }, run={ ...this.scrRunNew(), ...((v&&v.run)||{}), waitEpoch:null };
    if(run.status==='running') run.status='paused';   // reopened: what happened in between is unknown — resume by hand
    return (this._scr={ sid, def, run });
  }
  scrSave(){ const S=this._scr; if(!S) return; try{ localStorage.setItem(this.scrKey(S.sid), JSON.stringify({def:S.def, run:S.run})); }catch(e){} }
  scrChanged(){ this.scrSave(); this.forceUpdate(); }
  scrLoadDef(def){ const S=this.scr();
    S.def={ name:def.name||'', scenario:def.scenario||'', patient:def.patient?{...def.patient}:null,
      steps:(def.steps||[]).map(s=>({ id:this.scrId(), when:{...s.when}, act:{...s.act} })) };
    S.run=this.scrRunNew(); S.base=null; this.setState({scrEd:null, scrEdErr:''}); this.scrChanged(); }
  scrLoadExample(i){ const x=this.SCRIPT_EXAMPLES[i], S=this.scr(); if(!x) return;
    if(S.def.steps.length && !window.confirm('Replace the current script with “'+x.name+'”?')) return;
    this.scrLoadDef(x); }

  scrStart(){
    const S=this.scr(), r=S.run; if(!S.def.steps.length || r.status==='running') return;
    if(r.status==='paused'){ r.status='running'; S.base=null; this.log('Script','Script resumed at T+'+this.mmss(r.t)); this.scrChanged(); return; }
    const R=this.eng(), sc=S.def.scenario&&R?R.scenario(S.def.scenario):null;
    S.run=this.scrRunNew(); S.run.status='running'; S.base=null;
    this.log('Script','Script started: '+(S.def.name||'untitled')+' · '+S.def.steps.length+' steps');
    // the script's patient (name, age, sex — sex sets the normal blood volume the script was calibrated on)
    const pt=S.def.patient; if(pt) this.setLive({ name:pt.name||this.state.live.name, age:pt.age||this.state.live.age, sex:pt.sex||this.state.live.sex });
    // a fresh patient first: the clock starts once this screen's engine has loaded it
    if(sc){ S.run.waitEpoch=((this.state.live.phys&&this.state.live.phys.epoch)||0)+1; S.run.waitSince=Date.now(); this.applyPhysPreset(S.def.scenario, 'Script'); }
    this.scrChanged();
  }
  scrPause(){ const r=this.scr().run; if(r.status!=='running') return; r.status='paused'; this.log('Script','Script paused at T+'+this.mmss(r.t)); this.scrChanged(); }
  scrReset(){ const S=this.scr(), was=S.run.status!=='ready'; S.run=this.scrRunNew(); S.base=null; if(was) this.log('Script','Script reset'); this.scrChanged(); }

  // every engine step on the instructor's Controller: advance the clock, fire the next step when it is due
  scrTick(){
    const S=this.scr(), r=S.run;
    if(r.status!=='running' || this.state.view!=='control' || !this._sim || !this.physMode()) return;
    const sim=this._sim;
    if(r.waitEpoch!=null){ if(this._simEpoch!==r.waitEpoch && Date.now()-(r.waitSince||0)<5000) return; r.waitEpoch=null; S.base=null; }
    // the script's clock is the patient's: re-baseline whenever the engine is rebuilt or reloaded (warm-up)
    if(S.base==null || S.baseSim!==sim || S.baseEp!==this._simEpoch){ S.base=sim.t; S.baseSim=sim; S.baseEp=this._simEpoch; }
    else { const d=sim.t-S.base; S.base=sim.t; if(d>0 && d<120) r.t+=d; }
    if(this._scrBusy && performance.now()-this._scrBusy<1500) return;   // the last step's order has not rendered yet
    const steps=S.def.steps;
    if(this.scrFinished(S)){ r.status='done'; this.log('Script','Script finished at T+'+this.mmss(r.t)); this.scrChanged(); return; }
    // any-time steps first, each with its own arm: hold timer, and shocks counted from Start
    const arms=r.anyArm||(r.anyArm={});
    for(let j=0;j<steps.length;j++){ const st=steps[j]; if(!st.when.any || r.fired[st.id]!=null) continue;
      const a=arms[st.id]||(arms[st.id]={ shocks:0, since:null, above:null });
      if(this.scrMet(st,j,a)){ this.scrFire(st,j,a); return; } }
    const i=steps.findIndex(s=>!s.when.any && r.fired[s.id]==null); if(i<0) return;
    const st=steps[i];
    if(!r.arm || r.arm.id!==st.id) r.arm={ id:st.id, shocks:r.shocks, since:null, above:null };
    if(this.scrMet(st,i,r.arm)) this.scrFire(st,i,r.arm);
  }
  // finished once every step in order has fired; any-time steps don't keep it running (unless there is nothing else)
  scrFinished(S){ const all=S.def.steps, seq=all.filter(s=>!s.when.any); return (seq.length?seq:all).every(s=>S.run.fired[s.id]!=null); }
  // a trigger with "or at the latest T+…" fires on whichever comes first; a.why records which
  scrMet(st,i,a){
    const w=st.when, r=this._scr.run;
    if(this.scrCond(st,i,a)){ a.why=null; return true; }
    if(w.by!=null && w.k!=='time' && w.k!=='after' && r.t>=+w.by){ a.why='by'; return true; }
    return false;
  }
  scrCond(st,i,a){
    const w=st.when, r=this._scr.run;
    if(w.k==='time') return r.t>=(+w.t||0);
    if(w.k==='after'){ const p=this.scrPrevT(i); return p!=null && r.t>=p+(+w.t||0); }
    if(w.k==='spo2'||w.k==='sbp'){
      // "below for N s": a brief excursion back above the limit (< 3 s — a breath, a beat) doesn't restart the count
      const x=this.scrVital(w.k);
      if(x!=null && x<+w.v){ if(a.since==null) a.since=r.t; a.above=null; return r.t-a.since>=Math.max(2,+w.hold||0); }
      if(a.since!=null){ if(a.above==null) a.above=r.t; if(r.t-a.above>=3) a.since=null; }
      return false;
    }
    if(w.k==='shock') return r.shocks-a.shocks>=Math.max(1,+w.n||1);   // shocks delivered since this step was armed
    if(w.k==='treat'){ const v=String(w.v||'');                        // given at any time since Start
      return v.startsWith('vol:') ? (r.vol||0)>=+v.slice(4) : (r.given[v]||0)>0; }
    if(w.k==='rhythm') return this.scrRhythmIs(this.state.live.rhythm, w.v);
    return false;
  }
  // "the previous step": for a step in order, the step in order before it (any-time steps are skipped, as by the
  // pointer); for an any-time step, the step directly above it, whenever that fires — so any-time steps chain
  scrPrevIdx(i){ const s=this._scr.def.steps; if(!s[i]) return -1; if(s[i].when.any) return i-1; let j=i-1; while(j>=0 && s[j].when.any) j--; return j; }
  // when it fired (Start = 0), or null while it hasn't
  scrPrevT(i){ const S=this._scr, j=this.scrPrevIdx(i); if(j<0) return 0; const t=S.run.fired[S.def.steps[j].id]; return t==null?null:t; }
  // SpO₂ as the monitor reads it (no pleth signal = no reading); systolic from the arterial line, 0 without a pulse
  scrVital(k){ const V=this._sim&&this._sim.vitals; if(!V) return null;
    if(k==='spo2') return V.spo2!=null?V.spo2:null;
    return V.pulse==null?0:(V.abp.sys!=null?V.abp.sys:null); }
  scrRhythmIs(rh,v){ const R=this.eng(), d=R&&R.RHYTHMS[rh];
    if(v==='@arrest') return !!d && !d.mech;
    if(v==='@pulse') return !!d && !!d.mech;
    return rh===v; }
  scrFire(st,i,arm){
    const r=this._scr.run, a=st.act, w=st.when, why=arm&&arm.why;
    const cmd={ role:'script', via:'script step '+(i+1)+(w.any?' (any time)':'')+' · '+(why==='by'?'T+'+this.mmss(w.by)+' (latest)':this.scrWhenText(w,true)) };
    r.fired[st.id]=Math.round(r.t*10)/10; this._scrBusy=performance.now();
    if(w.any){ if(r.anyArm) delete r.anyArm[st.id]; } else r.arm=null;
    if(a.k==='event') Object.assign(cmd, {kind:'event', event:a.ev, sev:+a.sev||0.7});
    else if(a.k==='rhythm') Object.assign(cmd, {kind:'rhythm', rhythm:a.v});
    else if(a.k==='phys') Object.assign(cmd, {kind:'phys', key:a.key, value:+a.v});
    else if(a.k==='shockMode') Object.assign(cmd, {kind:'shockMode', mode:a.v});
    else Object.assign(cmd, {kind:'note', text:String(a.text||'')});
    this.sendCmd(cmd); this.scrSave();
  }
  // what the team has done since Start — the shocks and treatments that triggers wait for
  scrRecord(m){
    const r=this.scr().run; if((r.status!=='running' && r.status!=='paused') || m.role==='script') return;
    const add=(k)=>{ r.given[k]=(r.given[k]||0)+1; };
    if(m.kind==='shock' && m.delivered) r.shocks++;
    if(m.kind==='bolus' || (m.kind==='infuse' && +m.rate>0)) add('drug:'+m.drug);
    if(m.kind==='bolus') add('dose:'+m.drug+':'+m.i);
    if(m.kind==='fluid'){ add('fluid:any'); add('fluid:'+m.fluid); r.vol=(r.vol||0)+(+m.mL||0); }
    if(m.kind==='action') add('proc:'+m.action);
    if(m.kind==='cpr' && m.on) add('cpr');
    if(m.kind==='pace' && m.res && m.res.pace) add('pace');
    if(m.kind==='bag') add('bag');
  }

  // ---- labels
  scrOpt(list,v){ const o=list.find(x=>x[0]===v); return o?o[1]:String(v); }
  // keys: fluid:<type> · vol:<mL> (fluid ordered in total) · drug:<id> (any dose or infusion) · dose:<id>:<bolus index> · proc:<action> · cpr · pace · bag
  scrTreatOpts(){ const R=this.eng(), o=[['fluid:any','Any fluid'],['fluid:crystalloid','Crystalloid'],['fluid:blood','Packed red cells'],
      ['vol:500','Fluids ≥ 500 mL ordered in total'],['vol:1000','Fluids ≥ 1 L ordered in total'],['vol:2000','Fluids ≥ 2 L ordered in total']];
    if(R) Object.keys(R.DRUGS).forEach(id=>{ const D=R.DRUGS[id];
      o.push(['drug:'+id, D.label+(D.bolus&&D.rate?' — any dose or infusion':D.bolus?' — any dose':' infusion')]);
      if(D.bolus && D.bolus.length>1) D.bolus.forEach((b,i)=>o.push(['dose:'+id+':'+i, D.label+' '+b.label])); });
    this.PROCS.forEach(([id,label])=>o.push(['proc:'+id, label]));
    return o.concat([['cpr','CPR started'],['pace','Pacer switched on'],['bag','Bag-mask ventilation / FiO₂ 100 %']]); }
  scrTreatText(v){ const D=this.eng()&&this.eng().DRUGS; v=String(v||''); let m;
    if((m=v.match(/^drug:(.+)$/)) && D && D[m[1]]) return D[m[1]].label+' given';
    if((m=v.match(/^dose:([^:]+):(\d+)$/)) && D && D[m[1]] && (D[m[1]].bolus||[])[+m[2]]) return D[m[1]].label+' '+D[m[1]].bolus[+m[2]].label+' given';
    if((m=v.match(/^vol:(\d+)$/))) return 'fluids ≥ '+(+m[1]>=1000?(+m[1]/1000)+' L':m[1]+' mL')+' ordered';
    return this.scrOpt(this.scrTreatOpts(),v)+' given'; }
  scrRhythmOpts(any){ const R=this.eng(), o=any?[['@arrest','Any arrest rhythm (no pulse)'],['@pulse','Any rhythm with a pulse (ROSC)']]:[];
    if(R) Object.keys(R.RHYTHMS).filter(k=>!R.RHYTHMS[k].hidden).forEach(k=>o.push([k, R.RHYTHMS[k].label]));
    return o; }
  scrWhenText(w, bare){   // bare: the trigger alone, without its "or at the latest" time
    const by=!bare && w.by!=null && w.k!=='time' && w.k!=='after' ? ' — or at T+'+this.mmss(w.by) : '';
    if(w.k==='time') return 'T+'+this.mmss(w.t);
    if(w.k==='after'){ const prev=w.any?'the step above':'the previous step'; return +w.t>0?this.mmss(w.t)+' after '+prev:'with '+prev; }
    if(w.k==='spo2') return 'SpO₂ < '+w.v+' % for '+w.hold+' s'+by;
    if(w.k==='sbp') return 'SBP < '+w.v+' mmHg for '+w.hold+' s'+by;
    if(w.k==='shock') return (+w.n>1?w.n+' shocks':'a shock')+' delivered'+by;
    if(w.k==='treat') return this.scrTreatText(w.v)+by;
    if(w.k==='rhythm') return 'rhythm: '+this.scrOpt(this.scrRhythmOpts(true),w.v).replace(/^Any/,'any')+by;
    return w.k; }
  scrActText(a){ const R=this.eng();
    if(a.k==='event') return 'Start event: '+((R&&R.EVENTS[a.ev]||{}).label||a.ev)+' ('+(+a.sev>=0.95?'severe':+a.sev>=0.6?'moderate':'mild')+')';
    if(a.k==='rhythm') return 'Set rhythm: '+((R&&R.RHYTHMS[a.v]||{}).label||a.v);
    if(a.k==='phys'){ const row=this.physRow(a.key); return row?row[1]+' → '+this.physDisp(row,+a.v)+' '+row[5]:String(a.key); }
    if(a.k==='shockMode') return 'Shock outcome → '+this.scrOpt(this.SHOCK_MODES,a.v);
    return 'Note: “'+(a.text||'')+'”'; }
  // the next step's condition, with its countdown or the live value it is watching
  scrNextWhen(st,i){
    const r=this._scr.run, w=st.when, live=r.status==='running'||r.status==='paused';
    const left=(T)=>!live?'':T>r.t?' · in '+this.mmss(Math.ceil(T-r.t)):' · due now';
    if(w.k==='time') return 'At T+'+this.mmss(w.t)+left(+w.t||0);
    if(w.k==='after'){ const j=this.scrPrevIdx(i);
      return (j<0?(+w.t>0?this.mmss(w.t)+' after Start':'At Start'):(+w.t>0?this.mmss(w.t)+' after step '+(j+1):'Straight after step '+(j+1)))+left((this.scrPrevT(i)||0)+(+w.t||0)); }
    const a=r.arm&&r.arm.id===st.id?r.arm:null, by=w.by!=null?' · or at T+'+this.mmss(w.by)+left(+w.by):'';
    if(w.k==='spo2'||w.k==='sbp'){ const x=this.scrVital(w.k);
      return 'Waiting for: '+this.scrWhenText(w,true)+(live?' · now '+(x==null?'no reading':Math.round(x)):'')+(a&&a.since!=null?' · below for '+this.mmss(r.t-a.since):'')+by; }
    if(w.k==='shock'){ const n=Math.max(1,+w.n||1); return (n>1?'Waiting for: '+n+' more shocks · '+(a?r.shocks-a.shocks:0)+' so far':'Waiting for: the next shock')+by; }
    if(w.k==='treat' && String(w.v).startsWith('vol:')) return 'Waiting for: '+this.scrWhenText(w,true)+(live?' · '+Math.round(r.vol||0)+' mL so far':'')+by;
    return 'Waiting for: '+this.scrWhenText(w,true)+by;
  }

  // ---- step editor
  scrValStr(key,v){ const row=this.physRow(key); if(!row||v==null||!isFinite(+v)) return ''; return row[6]?String(Math.round(+v*100)):String(+(+v).toFixed(3)); }
  scrEdit(i){   // i = the step to edit, or -1 for a new one
    const S=this.scr(), st=i>=0?S.def.steps[i]:null, last=S.def.steps[S.def.steps.length-1], ph={...this.PHYS_DEFAULT, ...(this.state.live.phys||{})};
    const w=st?st.when:{k:'time', t:last&&last.when.k==='time'?(+last.when.t||0)+60:0}, a=st?st.act:{k:'note', text:''};
    this.setState({ scrEdErr:'', scrEd:{ idx:st?i:-1, any:!!w.any, wk:w.k, t:this.mmss(w.t||0), v:(w.k==='spo2'||w.k==='sbp')?String(w.v):'90', hold:String(w.hold!=null?w.hold:10),
      n:String(w.n||1), tv:w.k==='treat'?w.v:'drug:amiodarone', rv:w.k==='rhythm'?w.v:'@arrest', by:w.by!=null?this.mmss(w.by):'',
      ak:a.k, ev:a.ev||'haemorrhage', sev:String(a.sev||0.7), arh:a.k==='rhythm'?a.v:'pea', key:a.key||'svr',
      val:a.k==='phys'?this.scrValStr(a.key,a.v):this.scrValStr('svr',ph.svr), sm:a.k==='shockMode'?a.v:'refractory', text:a.text||'' } });
  }
  scrEdSet(p){ this.setState(s=>({ scrEd:s.scrEd?{...s.scrEd, ...p}:null, scrEdErr:'' })); }
  parseMMSS(s){ s=String(s==null?'':s).trim().replace(/^T\+/i,'');
    const m=s.match(/^(\d+):(\d{1,2})$/); if(m) return +m[2]<60?(+m[1])*60+(+m[2]):NaN;
    return /^\d+(\.\d+)?$/.test(s)?Math.round(parseFloat(s)*60):NaN; }   // a bare number is minutes
  scrEdSave(){
    const e=this.state.scrEd; if(!e) return;
    const S=this.scr(), bad=(msg)=>this.setState({scrEdErr:msg}), num=(x)=>parseFloat(String(x).replace(',','.'));
    const when={k:e.wk};
    if(e.any) when.any=true;
    if(e.wk==='time'||e.wk==='after'){ const t=this.parseMMSS(e.t); if(!(t>=0)) return bad('Enter the time as mm:ss — for example 4:30.'); when.t=t; }
    if(e.wk==='spo2'||e.wk==='sbp'){ const v=num(e.v), h=num(e.hold), top=e.wk==='spo2'?100:300;
      if(!(v>0 && v<=top)) return bad('Enter the limit the value has to fall below.');
      if(!(h>=0 && h<=3600)) return bad('Enter how many seconds it has to stay below the limit.');
      when.v=Math.round(v); when.hold=Math.round(h); }
    if(e.wk==='shock'){ const n=Math.round(num(e.n)); if(!(n>=1 && n<=20)) return bad('Number of shocks: 1 to 20.'); when.n=n; }
    if(e.wk==='treat') when.v=e.tv;
    if(e.wk==='rhythm') when.v=e.rv;
    if(e.wk!=='time' && e.wk!=='after' && String(e.by||'').trim()){ const by=this.parseMMSS(e.by);
      if(!(by>=0)) return bad('Enter the latest time as mm:ss — or leave it empty.'); when.by=by; }
    const act={k:e.ak};
    if(e.ak==='event'){ act.ev=e.ev; act.sev=+e.sev||0.7; }
    if(e.ak==='rhythm') act.v=e.arh;
    if(e.ak==='phys'){ const row=this.physRow(e.key), x=num(e.val); if(!row || !isFinite(x)) return bad('Enter the new value.'); act.key=e.key; act.v=this.physClamp(e.key, row[6]?x/100:x); }
    if(e.ak==='shockMode') act.v=e.sm;
    if(e.ak==='note'){ const t=String(e.text||'').trim(); if(!t) return bad('Write the note.'); act.text=t; }
    const steps=S.def.steps.slice();
    if(e.idx>=0 && steps[e.idx]) steps[e.idx]={...steps[e.idx], when, act}; else steps.push({ id:this.scrId(), when, act });
    S.def={...S.def, steps};
    if(S.run.status==='done' && !this.scrFinished(S)) S.run.status='paused';   // a step added after the end: Resume runs it
    this.setState({scrEd:null, scrEdErr:''}); this.scrChanged();
  }
  scrMove(i,d){ const S=this.scr(), s=S.def.steps.slice(), j=i+d; if(j<0 || j>=s.length) return;
    [s[i],s[j]]=[s[j],s[i]]; S.def={...S.def, steps:s}; this.setState({scrEd:null}); this.scrChanged(); }
  scrDel(i){ const S=this.scr(), s=S.def.steps.slice(), [x]=s.splice(i,1); if(x){ delete S.run.fired[x.id]; if(S.run.anyArm) delete S.run.anyArm[x.id]; }
    S.def={...S.def, steps:s}; this.setState({scrEd:null}); this.scrChanged(); }

  scriptBindings(out){
    const S=this.scr(), d=S.def, r=S.run, R=this.eng(), ph={...this.PHYS_DEFAULT, ...(this.state.live.phys||{})};
    const opts=(list)=>list.map(([value,label])=>({value,label}));
    const running=r.status==='running', paused=r.status==='paused', done=r.status==='done', ready=r.status==='ready';
    const nI=d.steps.findIndex(s=>!s.when.any && r.fired[s.id]==null), next=nI>=0?d.steps[nI]:null;
    const anySteps=d.steps.filter(s=>s.when.any), anyFired=anySteps.filter(s=>r.fired[s.id]!=null).length;
    // the script
    out.scrName=d.name; out.onScrName=(e)=>{ S.def={...S.def, name:e.target.value}; this.scrChanged(); };
    out.scrScenario=d.scenario; out.onScrScenario=(e)=>{ S.def={...S.def, scenario:e.target.value}; this.scrChanged(); };
    const pt=d.patient; out.scrHasPatient=!!pt;
    out.scrPatient=pt?'Patient set at Start: '+[pt.name, [pt.age, pt.sex].filter(Boolean).join(' ')].filter(Boolean).join(', '):'';
    out.scrScenarioOpts=opts([['','Current patient (no reload)']].concat(R?R.SCENARIOS.map(s=>[s.id,s.label]):[]));
    out.scrExamples=this.SCRIPT_EXAMPLES.map((x,i)=>({ label:x.name, onClick:()=>this.scrLoadExample(i) }));
    out.scrClear=()=>{ if(S.def.steps.length && !window.confirm('Remove every step of this script?')) return; this.scrLoadDef({}); };
    // the run
    out.scrStatus=ready?'Ready':running?'Running':paused?'Paused':'Finished';
    out.scrStatusColor=running?'#12B981':paused?'#F5A623':done?'var(--action)':'var(--neutral-400)';
    out.scrClock='T+'+this.mmss(r.t)+(r.waitEpoch!=null?' · loading the patient…':'');
    out.scrHasNext=!!next;
    out.scrNextLabel=next?'Next — step '+(nI+1)+' of '+d.steps.length:!d.steps.length?'No steps yet — load an example or add a step'
      :anyFired<anySteps.length?'Every step in order has fired':'Every step has fired';
    out.scrNextWhen=next?this.scrNextWhen(next,nI):''; out.scrNextAct=next?this.scrActText(next.act):'';
    out.scrHasAny=anySteps.length>0;
    out.scrAnyLine='Any time: '+(ready?anySteps.length+' step'+(anySteps.length>1?'s':'')+', armed at Start'
      :anyFired+' of '+anySteps.length+' fired'+(done||anyFired===anySteps.length?'':' · the rest armed'+(paused?' (paused)':'')));
    out.scrCanStart=d.steps.length>0 && !running; out.scrStartLabel=paused?'Resume':done?'Run again':'Start';
    out.scrStart=()=>this.scrStart(); out.scrCanPause=running; out.scrPause=()=>this.scrPause();
    out.scrCanReset=!ready; out.scrReset=()=>this.scrReset();
    out.scrPillShow=(running||paused) && this.physMode();
    out.scrPill='Script '+(paused?'paused · ':'')+'T+'+this.mmss(r.t)+(next?' · step '+(nI+1)+'/'+d.steps.length:'');
    out.scrPillColor=running?'#0E9468':'#B7791F';
    out.scrSteps=d.steps.map((s,i)=>{ const f=r.fired[s.id], isNext=i===nI && !ready, any=!!s.when.any, armed=any && f==null && (running||paused);
      return { n:String(i+1), any, when:this.scrWhenText(s.when), act:this.scrActText(s.act),
        hasState:f!=null||isNext||armed, state:f!=null?'fired at T+'+this.mmss(f):armed?(running?'armed':'armed · paused'):(running?'next':'next · paused'),
        stateColor:f!=null?'#0E9468':armed?'#8E5BD6':'#B7791F',
        bg:isNext?'var(--surface-brand-soft)':'var(--surface-sunken)', op:f!=null?'0.62':'1',
        up:()=>this.scrMove(i,-1), down:()=>this.scrMove(i,1), edit:()=>this.scrEdit(i), del:()=>this.scrDel(i) }; });
    out.scrHasSteps=d.steps.length>0;
    // the step editor (bindings exist even while it is closed)
    const ed=this.state.scrEd, e=ed||{ idx:-1, any:false, wk:'time', t:'0:00', v:'90', hold:'10', n:'1', tv:'drug:amiodarone', rv:'@arrest', by:'', ak:'note', ev:'haemorrhage', sev:'0.7', arh:'pea', key:'svr', val:'', sm:'refractory', text:'' };
    const set=(k)=>(ev)=>this.scrEdSet({[k]:ev.target.value});
    out.scrEdShow=!!ed; out.scrEdHide=!ed; out.scrAddStep=()=>this.scrEdit(-1);
    out.scrEdTitle=e.idx>=0?'Edit step '+(e.idx+1):'New step'; out.scrEdSaveLabel=e.idx>=0?'Save step':'Add step';
    out.scrEdSave=()=>this.scrEdSave(); out.scrEdCancel=()=>this.setState({scrEd:null, scrEdErr:''});
    out.scrEdErr=this.state.scrEdErr||''; out.scrHasEdErr=!!this.state.scrEdErr;
    out.edAny=!!e.any; out.onEdAny=(ev)=>this.scrEdSet({any:!!ev.target.checked});
    out.edAnyHint=e.any?'Armed from Start, it fires once whenever its condition holds — the steps in order neither wait for it nor are held up by it. “After the previous step” counts from the step directly above it.'
      :'Off: the step waits its turn — it is armed once the step before it has fired.';
    out.scrWhenOpts=opts(this.SCRIPT_WHEN); out.edWk=e.wk;
    out.onEdWk=(ev)=>{ const wk=ev.target.value, p={wk}; if(wk!==e.wk && wk==='spo2') p.v='90'; if(wk!==e.wk && wk==='sbp') p.v='80'; this.scrEdSet(p); };
    out.edTShow=e.wk==='time'||e.wk==='after'; out.edT=e.t; out.onEdT=set('t');
    out.edTLabel=e.wk==='time'?'Time from Start (mm:ss)':e.any?'Delay after the step above fires (mm:ss)':'Delay after the previous step (mm:ss)';
    out.edVitalShow=e.wk==='spo2'||e.wk==='sbp'; out.edVLabel=e.wk==='spo2'?'Below (SpO₂ %)':'Below (systolic mmHg)'; out.edV=e.v; out.onEdV=set('v');
    out.edHold=e.hold; out.onEdHold=set('hold');
    out.edShockShow=e.wk==='shock'; out.edN=e.n; out.onEdN=set('n'); out.edNLabel=e.any?'Shocks (counted from Start)':'Shocks (counted after the previous step)';
    out.edTreatShow=e.wk==='treat'; out.edTreatOpts=opts(this.scrTreatOpts()); out.edTv=e.tv; out.onEdTv=set('tv');
    out.edRhShow=e.wk==='rhythm'; out.edRhOpts=opts(this.scrRhythmOpts(true)); out.edRv=e.rv; out.onEdRv=set('rv');
    out.edByShow=e.wk!=='time' && e.wk!=='after'; out.edBy=e.by||''; out.onEdBy=set('by');
    out.scrActOpts=opts(this.SCRIPT_ACTS); out.edAk=e.ak; out.onEdAk=set('ak');
    out.edEventShow=e.ak==='event'; out.edEvOpts=opts(R?Object.keys(R.EVENTS).map(k=>[k,R.EVENTS[k].label]):[]); out.edEv=e.ev; out.onEdEv=set('ev');
    out.edSevOpts=opts([['0.4','Mild'],['0.7','Moderate'],['1','Severe']]); out.edSev=e.sev; out.onEdSev=set('sev');
    out.edARhShow=e.ak==='rhythm'; out.edARhOpts=opts(this.scrRhythmOpts(false)); out.edARh=e.arh; out.onEdARh=set('arh');
    out.edPhysShow=e.ak==='phys'; out.edKeyOpts=opts(this.PHYS_CIRC.concat(this.PHYS_LUNG).map(row=>[row[0],row[1]]));
    out.edKey=e.key; out.onEdKey=(ev)=>{ const key=ev.target.value; this.scrEdSet({key, val:this.scrValStr(key, ph[key])}); };
    const row=this.physRow(e.key)||this.PHYS_CIRC[0];
    out.edValLabel='New value ('+row[5]+')'; out.edVal=e.val; out.onEdVal=set('val');
    out.edValHint='Now '+this.physDisp(row,+ph[row[0]])+' · range '+this.physDisp(row,row[2])+'–'+this.physDisp(row,row[3]);
    out.edSmShow=e.ak==='shockMode'; out.edSmOpts=opts(this.SHOCK_MODES); out.edSm=e.sm; out.onEdSm=set('sm');
    out.edNoteShow=e.ak==='note'; out.edText=e.text; out.onEdText=set('text');
    return out;
  }

  renderVals(){ this.syncEngine(); this.afterSync(); return this.scriptBindings(this.stepEBindings(this.renderCore())); }
  renderCore(){
    const l=this.state.live, v=this.state.view, st=this.simType();
    const showHemo=st!=='vent', showVent=st!=='hemo';
    const meta=this.simMeta();
    const bp = (l.sys>0)? (l.sys+'/'+l.dia) : '--/--';
    const map = (l.sys>0)? String(Math.round((l.sys+2*l.dia)/3)) : '--';
    const rlabel=(this.RHYTHMS.find(r=>r.k===l.rhythm)||{}).label||'';
    const chipColors={ sinus:'#12B981', sinustach:'#0E9468', sinusbrad:'#0E9468', istemi:'#F5A623', af:'#D2870D', svt:'#D2870D', vt:'#F0483E', vf:'#F0483E', torsades:'#F0483E', asystole:'#F0483E' };
    const rhythmChips=this.RHYTHMS.map(r=>{ const on=l.rhythm===r.k; const c=chipColors[r.k]; return { label:r.label.replace(' (monomorphic)','').replace('Sinus ','S. '), color:on?'#fff':c, bg:on?c:'transparent', border:c, onClick:()=>this.setRhythm(r.k) }; });
    const presetBtns=this.PRESETS.map(p=>({ label:p.label, accent:p.accent, sub:(p.hr?('HR '+p.hr):'HR --')+' · '+(p.sys?(p.sys+'/'+p.dia):'--/--')+' · SpO₂ '+(p.spo2||'--'), onClick:()=>this.applyPreset(p) }));
    const vitalRows=this.VITAL_DEF.map(d=>({ label:d.label, min:d.min, max:d.max, value:l[d.key], color:d.color, onInput:(e)=>this.setVital(d.key,+e.target.value), inc:()=>this.bump(d.key,1), dec:()=>this.bump(d.key,-1) }));

    // ventilator
    const m=this.ventModel();
    let vmode=l.vMode||'VC'; if(vmode==='VAC')vmode='VC'; if(vmode==='PAC')vmode='PC';
    const ventModeLabel=(this.VENT_MODES.find(x=>x.k===vmode)||{}).label||vmode;
    const ventModeChips=this.VENT_MODES.map(md=>{ const on=vmode===md.k; return { label:md.label, color:on?'#fff':'var(--action)', bg:on?'var(--action)':'transparent', border:'var(--action)', onClick:()=>this.setLive({vMode:md.k}) }; });
    const flowPat=(l.vFlowPat==='decel')?'decel':'const';
    const showFlowPat=showVent && vmode==='VC';
    const flowPatChips=[{k:'const',label:'Constant'},{k:'decel',label:'Decelerating'}].map(o=>{ const on=flowPat===o.k; return { label:o.label, color:on?'#fff':'var(--action)', bg:on?'var(--action)':'transparent', border:'var(--action)', onClick:()=>this.setLive({vFlowPat:o.k}) }; });
    const mkVentRow=(k)=>{ const d=this.VENT_PARAMS[k]; return { label:d.label, unit:d.unit, min:d.min, max:d.max, step:d.step||1, value:+l[k], disp:this.vDisp(k), onInput:(e)=>this.setV(k,+e.target.value), inc:()=>this.bumpV(k,1), dec:()=>this.bumpV(k,-1) }; };
    const ventSettingRows=(this.MODE_PARAMS[vmode]||[]).map(mkVentRow);
    const ventMechRows=['vComp','vRaw'].map(mkVentRow);
    const ventPresetBtns=this.VENT_PRESETS.map(p=>{ const ml=(this.VENT_MODES.find(x=>x.k===p.vMode)||{}).label||p.vMode; return { label:p.label, accent:p.accent, sub:ml+' · C '+p.vComp+' · Raw '+p.vRaw, onClick:()=>this.applyPreset(p) }; });

    const pip=Math.round(m.PIP), plat=Math.round(m.plateau), vte=Math.round(m.VT), mv=m.MV.toFixed(1), ie=m.ieRatio.toFixed(1), ti=m.Ti.toFixed(1);
    const pbw=this.pbw();
    const mlkgNum = m.VT>0 ? m.VT/pbw : 0;
    const mlkg = mlkgNum>0 ? mlkgNum.toFixed(1) : '--';
    const mlkgColor = mlkgNum===0 ? '#cfd4d8' : (mlkgNum>8||mlkgNum<5) ? '#F5A623' : '#22e34a';
    const autoP = m.autoPEEP;
    const pipHi=(l.alarmLim&&l.alarmLim.pipHi)||35;
    const ventAlarm = pip>pipHi ? 'HIGH Paw' : (autoP>4 ? 'AUTO-PEEP' : (mlkgNum>8 ? 'HIGH VT' : ''));
    const ventTiles=[
      {label:'PIP',unit:'cmH₂O',value:pip,color: pip>35?'#F0483E':'#67DCFF',sub:''},
      {label:'Pplat',unit:'cmH₂O',value:plat,color: plat>30?'#F5A623':'#587DFF',sub:''},
      {label:'VTE',unit:'mL',value:vte,color:'#22e34a',sub:''},
      {label:'VT/kg',unit:'mL/kg',value:mlkg,color:mlkgColor,sub:''},
      {label:'MV',unit:'L/min',value:mv,color:'#e8e8e8',sub:''},
      {label:'PEEPi',unit:'cmH₂O',value:autoP.toFixed(1),color: autoP>2?'#F5A623':'#cfd4d8',sub:''},
    ];
    const co=this.coNum(), svr=this.svrNum();
    const coDisp=(co>0)?co.toFixed(1):'--';
    const svrDisp=(svr>0)?String(Math.round(svr)):'--';
    const cvpDisp=(this.perfusing()&&l.cvp!=null)?this.fmt(l.cvp):'--';
    const hemoTiles=[
      {label:'HR',unit:'bpm',value:this.hrDisp(),color:'#22e34a',sub:''},
      {label:'SpO₂',unit:'%',value:this.fmt(l.spo2),color:'#67DCFF',sub:''},
      {label:'NIBP',unit:'mmHg',value:bp,color:'#ff7b7b',sub:'MAP '+map},
      {label:'CVP',unit:'mmHg',value:cvpDisp,color:'#ffd60a',sub:''},
      {label:'CO',unit:'L/min',value:coDisp,color:'#c98bff',sub:'SVR '+svrDisp},
      {label:'ETCO₂',unit:'mmHg',value:this.fmt(l.etco2),color:'#e8e8e8',sub:''},
      {label:'RR',unit:'/min',value:this.fmt(l.rr),color:'#cfd4d8',sub:''},
    ];

    const profileBtns=this.state.profiles.map((p,i)=>{ let sub; const pt=p.simType||'hemo'; if(p.engineMode==='physio'){ const sc=this.eng()&&this.eng().scenario((p.phys&&p.phys.preset)||''); sub='Physiology · '+(sc?sc.label:'custom'); } else if(pt==='vent') sub=((this.VENT_MODES.find(x=>x.k===p.vMode)||{}).label||'')+' · PEEP '+(p.vPeep??'--'); else if(pt==='both') sub='Combined · '+((this.RHYTHMS.find(r=>r.k===p.rhythm)||{}).label||''); else sub=((this.RHYTHMS.find(r=>r.k===p.rhythm)||{}).label||'')+' · HR '+(p.hr??'--'); if(p.script&&p.script.steps) sub+=' · script, '+p.script.steps.length+' steps'; return { label:p.label, sub, onClick:()=>this.applyPreset(p), onDelete:()=>this.delProfile(i) }; });

    const simOptions=[
      {k:'hemo', title:'Hemodynamic', desc:'ECG, SpO₂, arterial, CVP and respiration waveforms with live CO / SVR.', icon:'heart-pulse'},
      {k:'vent', title:'Ventilator', desc:'Pressure, flow and volume waveforms with full ventilator mechanics.', icon:'wind'},
      {k:'both', title:'Combined', desc:'Hemodynamic and ventilator monitors shown side by side.', icon:'layout-grid'},
    ].map(o=>{ const active=st===o.k; return {...o, active, onClick:()=>this.setLive({simType:o.k}),
      border:active?'var(--action)':'var(--border-subtle)', bg:active?'var(--surface-brand-soft)':'var(--surface-card)',
      iconBg:active?'var(--action)':'var(--surface-sunken)', iconColor:active?'#fff':'var(--action)' }; });

    const displayDesc = st==='vent' ? 'Show the live ventilator monitor — pressure, flow and volume waveforms.'
      : st==='both' ? 'Show the combined monitor — hemodynamics and ventilation side by side.'
      : 'Show the live patient monitor — ECG, SpO₂, arterial, CVP and respiration waveforms.';
    const previewNote = st==='both' ? 'Both monitors push to the display instantly. Current rhythm: '+rlabel+'.'
      : st==='vent' ? 'Ventilator mode: '+ventModeLabel+'. Changes push to the monitor instantly.'
      : 'Current rhythm: '+rlabel+'. Changes push to the monitor instantly.';

    const out = {
      ic:{s16:16,s18:18,s20:20,s22:22,s26:26},
      setRoot:this._refs.root, setQrBox:this._refs.qr,
      setDispCanvas:this._refs.dispC, setDispWrap:this._refs.dispW,
      setPrevCanvas:this._refs.prevC, setPrevWrap:this._refs.prevW,
      setDispVentCanvas:this._refs.dispVC, setDispVentWrap:this._refs.dispVW,
      setPrevVentCanvas:this._refs.prevVC, setPrevVentWrap:this._refs.prevVW,
      isHome:v==='home', isControl:v==='control', isDisplay:v==='display',
      sid:this.state.sid, clock:this.state.clock,
      syncLabel:(this._sync==='live'?'Live':this._sync==='connecting'?'Connecting…':'Offline'),
      syncColor:(this._sync==='live'?'#12B981':this._sync==='connecting'?'#F5A623':'#F0483E'),
      goHome:()=>this.nav('home'), goControl:()=>this.nav('control'), goDisplay:()=>this.nav('display'),
      newSession:()=>this.newSession(), copyDisplayLink:()=>this.copyLink(),
      simOptions, simName:meta.name, simIcon:meta.icon, displayDesc, previewNote,
      showHemo, showVent,
      pName:l.name||'Patient', pDemo:(l.age||'—')+' · '+(l.sex||'—'),
      name:l.name, age:l.age, sex:l.sex, rhythm:l.rhythm, sexOpts:['F','M','Other'],
      onName:(e)=>this.setLive({name:e.target.value}), onAge:(e)=>this.setLive({age:e.target.value}),
      onSex:(e)=>this.setLive({sex:e.target.value}),
      rhythmChips, presetBtns, profileBtns, vitalRows,
      ventModeChips, ventModeLabel, flowPatChips, showFlowPat, ventSettingRows, ventMechRows, ventPresetBtns, ventTiles, hemoTiles,
      pipDisp:pip, vteDisp:vte, mvDisp:mv, ieDisp:ie, tiDisp:ti, vRrDisp:m.RR, ventAlarm, fio2Disp:Math.round(m.FiO2),
      height:l.vHeight, onHeight:(e)=>this.setLive({vHeight:e.target.value}),
      hasProfiles:this.state.profiles.length>0, noProfiles:this.state.profiles.length===0,
      hrDisp:this.hrDisp(), spo2Disp:this.fmt(l.spo2), bpDisp:bp, mapDisp:map, etco2Disp:this.fmt(l.etco2), rrDisp:this.fmt(l.rr),
      rhythmLabel:rlabel,
      showId:l.showId!==false, toggleId:()=>this.setLive({showId:l.showId===false}), toggleFull:()=>this.toggleFull(),
      worsen:()=>this.worsen(), improve:()=>this.improve(), saveProfile:()=>this.doSaveProfile(),
    };

    // ---------- v2: engine switch (both modes) ----------
    // tile width per parameter (not per current value), in the tile font's vw units: a value changing
    // length (99 → 100, 99/60 → 100/60) must never reflow the row and resize the waveforms
    const WIDE=['NIBP','ART','PAP','BP'];
    const widen=(tiles,k)=>tiles.map(t=>({...t, basis:'calc('+((WIDE.includes(t.label)?7:4)*k).toFixed(1)+'vw + 28px)'}));
    const R=this.eng(), phys=this.physMode(), ph={...this.PHYS_DEFAULT, ...(l.phys||{})};
    const chip=(on,c)=>({ color:on?'#fff':c, bg:on?c:'transparent', border:c });
    out.engineChips=[{k:'manual',label:'Manual — set the numbers'},{k:'physio',label:'Physiology — set the patient'}]
      .map(o=>({ label:o.label, ...chip((l.engineMode||'manual')===o.k,'var(--action)'), onClick:()=>this.setEngineMode(o.k) }));
    out.engineNote = !R ? 'The physiology engine did not load — manual mode only.'
      : phys ? 'You set the patient’s blood volume, vascular tone, contractility and lungs; the engine computes every number and waveform, and the reflexes respond on their own.'
      : 'You set the displayed numbers directly — the v1 behaviour. Switch to Physiology to let the engine work them out.';
    out.physMode=phys; out.manualMode=!phys;
    out.ctlHemo=!phys&&showHemo; out.ctlVent=!phys&&showVent; out.showLoops=phys&&showVent;
    out.setPvCanvas=this._refs.pvC; out.setPvWrap=this._refs.pvW; out.setFvCanvas=this._refs.fvC; out.setFvWrap=this._refs.fvW;
    const noop=()=>{};
    Object.assign(out, { physPresetBtns:[], physVentPresetBtns:[], physCircRows:[], physLungRows:[], physReadout:[], physVentOn:false, physVentOff:false,
      paCathLabel:'', physBolus:noop, physBleed:noop, physDecompress:noop, physPaCath:noop });
    this.stepDBindings(out, phys, chip);
    if(!phys){ out.hemoTiles=widen(out.hemoTiles,2.7); out.ventTiles=widen(out.ventTiles,2.35); return out; }

    // ---------- v2: physiology-mode controls and measured numbers ----------
    const ER=R.RHYTHMS;
    const rc=(k)=>['vt','pvt','vf','torsades','asystole','pea'].includes(k)?'#F0483E':['istemi','af','svt','avb1','avb2i','avb2ii','avb3'].includes(k)?'#D2870D':'#12B981';
    out.rhythmChips=Object.keys(ER).filter(k=>!ER[k].hidden).map(k=>({ label:ER[k].label.replace('Sinus ','S. '), ...chip(l.rhythm===k,rc(k)), onClick:()=>this.setRhythm(k) }));
    const presets=(groups)=>R.SCENARIOS.filter(s=>groups.includes(s.group)).map(s=>({ label:s.label, accent:this.PHYS_ACCENT[s.id]||'#587DFF',
      sub:s.tag+(ph.preset===s.id?' · loaded':''), onClick:()=>this.applyPhysPreset(s.id) }));
    out.physPresetBtns=presets(['hemo','arrest']); out.physVentPresetBtns=presets(['vent']);
    const row=(r)=>{ const [k,label,min,max,step,unit]=r, val=+ph[k];
      return { label, unit, min, max, step, value:val, disp:this.physDisp(r,val), onInput:(e)=>this.setPhys(k,+e.target.value), inc:()=>this.bumpPhys(k,1), dec:()=>this.bumpPhys(k,-1) }; };
    out.physCircRows=this.PHYS_CIRC.map(row);
    out.physLungRows=this.PHYS_LUNG.filter(r=>r[0]!=='o2'||!ph.ventilated).map(row);
    const vOn=!!ph.ventilated;
    out.ventModeChips=[{k:'off',label:'Not ventilated'}].concat(this.VENT_MODES).map(md=>({ label:md.label, ...chip(vOn?vmode===md.k:md.k==='off','var(--action)'),
      onClick:()=> md.k==='off' ? this.patchPhys({ventilated:false}) : this.setLive({vMode:md.k, phys:{...ph, ventilated:true}}) }));
    out.physVentOn=vOn; out.physVentOff=!vOn; out.showFlowPat=vOn&&vmode==='VC';
    out.ventModeLabel=vOn?ventModeLabel:'Not ventilated';
    out.paCathLabel=ph.paCath?'Remove PA catheter':'Insert PA catheter';
    out.physBolus=()=>this.physAction('bolus'); out.physBleed=()=>this.physAction('bleed');
    out.physDecompress=()=>this.physAction('decompress'); out.physPaCath=()=>this.physAction('pacath');
    const scNow=R.scenario(ph.preset);
    out.previewNote='Physiology mode — every screen runs the engine from these settings; the numbers are measured from the simulated patient. Last preset: '+(scNow?scNow.label:'custom')+'.';

    const V=this._sim?this._sim.vitals:null;
    if(!V){ out.hemoTiles=widen(out.hemoTiles,2.7); out.ventTiles=widen(out.ventTiles,2.35); return out; }
    const f=(x,d)=>(x==null||!isFinite(x))?'--':(+x).toFixed(d||0);
    const abp=V.abp, bpv=abp.sys!=null?f(abp.sys)+'/'+f(abp.dia):'--/--';
    out.hrDisp=f(V.hr); out.spo2Disp=f(V.spo2); out.bpDisp=bpv; out.mapDisp=f(abp.map); out.etco2Disp=f(V.etco2); out.rrDisp=f(V.rr);
    out.rhythmLabel=V.rhythmLabel+(V.hr!=null&&V.pulse==null?' · no pulse':(V.pulse!=null&&V.hr!=null&&V.hr-V.pulse>8?' · pulse deficit '+f(V.hr-V.pulse):''));
    out.hemoTiles=[
      {label:'HR',unit:'bpm',value:f(V.hr),color:'#22e34a',sub:V.pulse!=null?'pulse '+f(V.pulse):'no pulse'},
      {label:'SpO₂',unit:'%',value:f(V.spo2),color:'#67DCFF',sub:V.spo2!=null?'PI '+f(V.pi,1):'no signal'},
      {label:'ART',unit:'mmHg',value:bpv,color:'#ff7b7b',sub:'MAP '+f(abp.map)},
      {label:'CVP',unit:'mmHg',value:f(V.cvp),color:'#ffd60a',sub:'PPV '+f(V.ppv)+' %'},
      {label:'CO',unit:'L/min',value:V.resus.pulseless||V.co<=0.05?'--':f(V.co,1),color:'#c98bff',sub:V.resus.pulseless?(V.resus.cpr?'CPR flow only':'no output'):'SVR '+f(V.svr)},
      {label:'ETCO₂',unit:'mmHg',value:f(V.etco2),color:'#e8e8e8',sub:''},
      {label:'RR',unit:'/min',value:f(V.rr),color:'#cfd4d8',sub:V.apnea?'APNOEA':''},
    ];
    if(ph.paCath) out.hemoTiles.splice(4,0,{label:'PAP',unit:'mmHg',value:f(V.pap.sys)+'/'+f(V.pap.dia),color:'#ffa94d',sub:'mean '+f(V.pap.map)+' · wedge '+f(V.pcwp)});
    const w=V.vent;
    if(w){
      const vtkg=w.vte/this.pbw();
      out.ventTiles=[
        {label:'PIP',unit:'cmH₂O',value:vOn?f(w.pip):'--',color:vOn&&w.pip>35?'#F0483E':'#67DCFF',sub:'mean '+f(w.mpaw,1)},
        {label:'Pplat',unit:'cmH₂O',value:vOn?f(w.pplat):'--',color:w.pplat>30?'#F5A623':'#587DFF',sub:vOn?'ΔP '+f(w.dp):''},
        {label:'VTE',unit:'mL',value:f(w.vte),color:'#22e34a',sub:f(vtkg,1)+' mL/kg PBW'},
        {label:'MV',unit:'L/min',value:f(w.mv,1),color:'#e8e8e8',sub:'RR '+f(w.rr)},
        {label:'PEEP tot',unit:'cmH₂O',value:vOn?f(w.peepTot,1):'--',color:w.peepi>2?'#F5A623':'#cfd4d8',sub:vOn?'PEEPi '+f(w.peepi,1):''},
        {label:'Cstat',unit:'mL/cmH₂O',value:vOn?f(w.cstat):'--',color:'#cfd4d8',sub:vOn?'Cdyn '+f(w.cdyn):''},
      ];
      out.pipDisp=vOn?f(w.pip):'--'; out.vteDisp=f(w.vte); out.mvDisp=f(w.mv,1); out.ieDisp=f(w.ie,1); out.tiDisp=f(w.ti,1); out.vRrDisp=f(w.rr);
      const noCO2=this.latch('noco2', vOn&&V.etco2<5&&w.vte>100, !vOn||V.etco2>8||w.vte<=100);
      const pipHi=(l.alarmLim&&l.alarmLim.pipHi)||35, hiPaw=this.latch('hipaw', vOn&&w.pip>pipHi, !vOn||w.pip<pipHi-2);
      const autoP=this.latch('autop', w.peepi>4, w.peepi<3.5);
      const hiVT=this.latch('hivt', vOn&&vtkg>8, !vOn||vtkg<7.6);
      out.ventAlarm=w.disconnected?(V.airway==='extubated'?'EXTUBATED':'DISCONNECT'):V.apnea?'APNOEA':noCO2?'NO CO₂':hiPaw?'HIGH Paw':autoP?'AUTO-PEEP':hiVT?'HIGH VT':'';
    } else {
      out.ventTiles=out.ventTiles.map(t=>({...t,value:'--',sub:''})); out.ventAlarm=V.apnea?'APNOEA':'';
    }
    out.fio2Disp=Math.round(V.fio2*100);
    out.physReadout=[
      ['CO', f(V.co,1)+' L/min'], ['SV', f(V.sv)+' mL'], ['SVR', f(V.svr)], ['CVP · wedge', f(V.cvp)+' · '+f(V.pcwp)],
      ['mPAP', f(V.pap.map)], ['PPV', f(V.ppv)+' %'], ['PaO₂', f(V.pao2)+' mmHg'], ['P/F', f(V.pf)],
      ['PaCO₂', f(V.paco2)+' mmHg'], ['SvO₂', f(V.svo2)+' %'], ['Blood volume', f(V.bvPct)+' %'], ['Hb', f(V.hb,1)+' g/dL'],
      ['MSFP', f(V.eq.msfp,1)], ['Reflex HR', '×'+f(V.baro.hr,2)],
      ['Coronary perf.', f(V.cpp)+' mmHg'], ['Myocardial O₂ debt', f(Math.min(100,V.hypox/1.45*100))+' %'],
    ].map(([k,val])=>({k,v:val}));
    out.hemoTiles=widen(out.hemoTiles,2.7); out.ventTiles=widen(out.ventTiles,2.35);
    if(out.isTrainee) out.miniTiles=[['HR',out.hrDisp,'#22e34a'],['SpO₂',out.spo2Disp,'#67DCFF'],['BP',out.bpDisp,'#ff7b7b'],['ETCO₂',out.etco2Disp,'#e8e8e8']].map(([k,v,c])=>({k,v,c}));
    return out;
  }
}
