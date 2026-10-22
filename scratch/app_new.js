
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
    { key:'spo2',  label:'SpO₂',           min:0, max:100, color:'#ffd60a' },
    { key:'sys',   label:'Systolic BP',    min:0, max:260, color:'#ff7b7b' },
    { key:'dia',   label:'Diastolic BP',   min:0, max:160, color:'#ff7b7b' },
    { key:'etco2', label:'ETCO₂',          min:0, max:100, color:'#e8e8e8' },
    { key:'cvp',   label:'CVP',            min:0, max:30,  color:'#67DCFF' },
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

  DEFAULT = { name:'Sarah Allan', age:'58', sex:'F', simType:'hemo', rhythm:'sinus', hr:78, rr:14, spo2:98, sys:122, dia:78, etco2:38, sv:75, cvp:8, ppv:8,
              vMode:'VC', vFlowPat:'const', vRR:14, vVt:450, vTgt:450, vFlow:50, vPause:0.2, vPc:15, vItime:1.0, vRise:0.15, vPs:12, vCycle:25, vPeep:5, vFio2:40, vComp:50, vRaw:10, vHeight:170 };

  constructor(props){
    super(props);
    const r = this.parseHash();
    const sid = r.sid || this.genId();
    this.state = { view:r.view, sid, live:this.loadLive(sid), profiles:this.loadProfiles(), clock:this.timeStr() };
    this._refs = {
      root:(el)=>{this.root=el;}, qr:(el)=>{this.qrBox=el; if(el) this.mkQr();},
      dispC:(el)=>{this.dispCanvas=el;}, dispW:(el)=>{this.dispWrap=el;},
      prevC:(el)=>{this.prevCanvas=el;}, prevW:(el)=>{this.prevWrap=el;},
      dispVC:(el)=>{this.dispVentCanvas=el;}, dispVW:(el)=>{this.dispVentWrap=el;},
      prevVC:(el)=>{this.prevVentCanvas=el;}, prevVW:(el)=>{this.prevVentWrap=el;},
    };
    if (!r.sid) this.setHash(r.view, sid);
  }

  // ---------- session / storage ----------
  genId(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; let s=''; for(let i=0;i<7;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
  liveKey(id){ return 'resussim:'+id; }
  loadLive(id){ try{ const v=JSON.parse(localStorage.getItem(this.liveKey(id))); if(v) return {...this.VENT_DEFAULTS, ...this.HEMO_DEFAULTS, simType:'hemo', ...v}; }catch(e){} const d={...this.DEFAULT}; this.saveLive(id,d); return d; }
  saveLive(id,live){ try{ localStorage.setItem(this.liveKey(id), JSON.stringify(live)); }catch(e){} }
  loadProfiles(){ try{ return JSON.parse(localStorage.getItem('resussim:profiles'))||[]; }catch(e){ return []; } }
  saveProfilesLS(p){ try{ localStorage.setItem('resussim:profiles', JSON.stringify(p)); }catch(e){} }

  setLive(patch){ this.setState(s=>{ const live={...s.live,...patch}; this.saveLive(s.sid,live); return {live}; }); }

  // ---------- routing ----------
  parseHash(){
    const h=(location.hash||'').replace(/^#/,''); const [v,q]=h.split('?');
    const view=['home','control','display'].includes(v)?v:'home';
    let sid=null; if(q){ const m=q.match(/s=([^&]+)/); if(m) sid=decodeURIComponent(m[1]); }
    return { view, sid };
  }
  setHash(view,sid){ location.hash = view+'?s='+encodeURIComponent(sid); }
  nav(view){ this.setHash(view, this.state.sid); }

  componentDidMount(){
    this._onHash=()=>{ const r=this.parseHash(); const sid=r.sid||this.state.sid; this.setState({view:r.view, sid, live:this.loadLive(sid)}); };
    window.addEventListener('hashchange', this._onHash);
    this._onStorage=(e)=>{ if(e.key===this.liveKey(this.state.sid)){ try{ this.setState({live:JSON.parse(e.newValue)}); }catch(x){} } if(e.key==='resussim:profiles'){ this.setState({profiles:this.loadProfiles()}); } };
    window.addEventListener('storage', this._onStorage);
    this._clk=setInterval(()=>this.setState({clock:this.timeStr()}),1000);
    this.mkQr();
    this.connectMqtt();
    const dpr=Math.min(window.devicePixelRatio||1,2); this._dpr=dpr;
    const loop=(now)=>{ this.drawAll(now/1000); this._raf=requestAnimationFrame(loop); }; this._raf=requestAnimationFrame(loop);
  }
  componentDidUpdate(pp,ps){
    if(!ps||ps.sid!==this.state.sid||ps.view!==this.state.view) this.mkQr();
    if(ps && ps.sid!==this.state.sid){ this.subTopic(this.state.sid); if(this.state.view!=='display') this.pubLive(); }
    else if(this.state.view!=='display' && JSON.stringify(this.state.live)!==this._lastMsg) this.pubLive();
  }
  componentWillUnmount(){ window.removeEventListener('hashchange',this._onHash); window.removeEventListener('storage',this._onStorage); clearInterval(this._clk); cancelAnimationFrame(this._raf); clearTimeout(this._mqttWait); try{ this._mqtt&&this._mqtt.end(true); }catch(e){} }

  // ---------- realtime cross-device sync (public MQTT-over-WebSocket) ----------
  topicFor(sid){ return 'resussim/v1/'+sid+'/state'; }
  connectMqtt(){
    if(!window.mqtt){ this._sync='connecting'; this.forceUpdate(); this._mqttTries=(this._mqttTries||0)+1; if(this._mqttTries<=100){ clearTimeout(this._mqttWait); this._mqttWait=setTimeout(()=>this.connectMqtt(),150); } else { this._sync='off'; this.forceUpdate(); } return; }
    this._sync='connecting'; this.forceUpdate();
    try{
      this._mqtt = window.mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId:'resussim_'+Math.random().toString(16).slice(2), connectTimeout:8000, reconnectPeriod:3000, clean:true });
      this._mqtt.on('connect', ()=>{ this._sync='live'; this._subbed=null; this.subTopic(this.state.sid); if(this.state.view!=='display') this.pubLive(); this.forceUpdate(); });
      this._mqtt.on('reconnect', ()=>{ this._sync='connecting'; this.forceUpdate(); });
      this._mqtt.on('offline', ()=>{ this._sync='off'; this.forceUpdate(); });
      this._mqtt.on('error', ()=>{ this._sync='off'; this.forceUpdate(); });
      this._mqtt.on('message', (t,payload)=>{ const s=payload.toString(); if(!s||s===this._lastMsg) return; try{ const live=JSON.parse(s); this._lastMsg=s; this.saveLive(this.state.sid,live); this.setState({live}); }catch(e){} });
    }catch(e){ this._sync='off'; this.forceUpdate(); }
  }
  subTopic(sid){ if(!this._mqtt) return; if(this._subbed===sid) return; if(this._subbed) try{ this._mqtt.unsubscribe(this.topicFor(this._subbed)); }catch(e){} try{ this._mqtt.subscribe(this.topicFor(sid),{qos:0}); this._subbed=sid; }catch(e){} }
  pubLive(){ if(!this._mqtt||this._sync!=='live') return; try{ const s=JSON.stringify(this.state.live); this._lastMsg=s; this._mqtt.publish(this.topicFor(this.state.sid), s, {retain:true, qos:0}); }catch(e){} }

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
  alert(){
    const l=this.state.live;
    const R={ istemi:['INFERIOR STEMI','#F5A623','#2a1a0c'], asystole:['ASYSTOLE','#F0483E','#3a0d0d'], vf:['VF · SHOCKABLE','#F0483E','#3a0d0d'], vt:['VT','#ff7b7b','#331010'], torsades:['TORSADES','#ff7b7b','#331010'], svt:['SVT','#F5A623','#2a2113'], af:['ATRIAL FIB','#F5A623','#2a2113'] };
    if(R[l.rhythm]) return R[l.rhythm];
    if(l.spo2 && l.spo2<90) return ['HYPOXIA','#F5A623','#2a2113'];
    if(l.sys && l.sys<90) return ['HYPOTENSION','#F5A623','#2a2113'];
    return null;
  }

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
  applyPreset(p){ const {label,accent,sub,...rest}=p; this.setLive(rest); }
  clamp(k,v){ const d=this.VITAL_DEF.find(x=>x.key===k); return Math.max(d.min,Math.min(d.max,v)); }
  setVital(k,v){ this.setLive({ [k]:this.clamp(k,Math.round(v)) }); }
  bump(k,d){ this.setVital(k,(this.state.live[k]||0)+d); }
  worsen(){ const l=this.state.live; this.setLive({ hr:this.clamp('hr',l.hr+8), rr:this.clamp('rr',l.rr+3), spo2:this.clamp('spo2',l.spo2-4), sys:this.clamp('sys',l.sys-10), dia:this.clamp('dia',l.dia-6), sv:this.clamp('sv',(+l.sv||75)-6), cvp:this.clamp('cvp',(+l.cvp||8)+2) }); }
  improve(){ const l=this.state.live; this.setLive({ hr:this.clamp('hr',l.hr-8), rr:this.clamp('rr',l.rr-3), spo2:this.clamp('spo2',l.spo2+4), sys:this.clamp('sys',l.sys+10), dia:this.clamp('dia',l.dia+6), sv:this.clamp('sv',(+l.sv||75)+6), cvp:this.clamp('cvp',(+l.cvp||8)-2) }); }

  vClamp(k,v){ const d=this.VENT_PARAMS[k]; if(!d) return v; const st=d.step||1; let x=Math.round(v/st)*st; x=Math.max(d.min,Math.min(d.max,x)); return +x.toFixed(2); }
  setV(k,v){ this.setLive({ [k]:this.vClamp(k,v) }); }
  bumpV(k,dir){ const d=this.VENT_PARAMS[k]; const st=d.step||1; this.setV(k,(+this.state.live[k]||d.min)+dir*st); }
  vDisp(k){ const d=this.VENT_PARAMS[k]; const v=+this.state.live[k]; return (d.step&&d.step<1)?v.toFixed(1):String(Math.round(v)); }

  doSaveProfile(){ const name=(window.prompt('Name this profile:','')||'').trim(); if(!name) return; const l=this.state.live;
    const keys=['simType','rhythm','hr','rr','spo2','sys','dia','etco2','cvp','sv','ppv','vMode','vFlowPat','vRR','vVt','vFlow','vPause','vPc','vItime','vRise','vPs','vCycle','vPeep','vFio2','vComp','vRaw'];
    const p={label:name}; keys.forEach(k=>p[k]=l[k]);
    const profiles=[...this.state.profiles,p]; this.saveProfilesLS(profiles); this.setState({profiles}); }
  delProfile(i){ const profiles=this.state.profiles.filter((_,j)=>j!==i); this.saveProfilesLS(profiles); this.setState({profiles}); }
  newSession(){ const sid=this.genId(); this.setState({sid, live:this.loadLive(sid)}); this.setHash('home',sid); }
  copyLink(){ try{ navigator.clipboard.writeText(this.displayUrl()); }catch(e){} }
  toggleFull(){ const el=this.root||document.documentElement; if(!document.fullscreenElement){ (el.requestFullscreen||(()=>{})).call(el); } else { document.exitFullscreen&&document.exitFullscreen(); } }

  // ---------- hemo waveforms ----------
  g(x,c,w){ return Math.exp(-((x-c)*(x-c))/(2*w*w)); }
  ecg(t,hr,r){
    if(r==='vf') return 0.5*Math.sin(t*18.3)+0.35*Math.sin(t*27.7+1)+0.25*Math.sin(t*41.1+2)+0.06*(Math.random()-0.5);
    if(r==='asystole') return 0.015*Math.sin(t*1.7)+0.006*(Math.random()-0.5);
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
    this.lane(ctx,band,band*2,w,'#ffd60a',plethFn,band*0.42,band*1.82,t);

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
    this.lane(ctx,band*3,band*4,w,'#67DCFF',cvpFn,band*0.16,cvpBase,t);

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
  drawAll(t){ const v=this.state.view, st=this.simType();
    if(v==='display'){ if(st!=='vent') this.drawMon(this.dispCanvas,this.dispWrap,t); if(st!=='hemo') this.drawVent(this.dispVentCanvas,this.dispVentWrap,t); }
    if(v==='control'){ if(st!=='vent') this.drawMon(this.prevCanvas,this.prevWrap,t); if(st!=='hemo') this.drawVent(this.prevVentCanvas,this.prevVentWrap,t); }
  }

  renderVals(){
    const l=this.state.live, v=this.state.view, st=this.simType();
    const showHemo=st!=='vent', showVent=st!=='hemo';
    const meta=this.simMeta();
    const a=this.alert();
    const bp = (l.sys>0)? (l.sys+'/'+l.dia) : '--/--';
    const map = (l.sys>0)? String(Math.round((l.sys+2*l.dia)/3)) : '--';
    const rlabel=(this.RHYTHMS.find(r=>r.k===l.rhythm)||{}).label||'';
    const chipColors={ sinus:'#12B981', sinustach:'#0E9468', sinusbrad:'#0E9468', istemi:'#F5A623', af:'#D2870D', svt:'#D2870D', vt:'#F0483E', vf:'#F0483E', torsades:'#F0483E', asystole:'#F0483E' };
    const rhythmChips=this.RHYTHMS.map(r=>{ const on=l.rhythm===r.k; const c=chipColors[r.k]; return { label:r.label.replace(' (monomorphic)','').replace('Sinus ','S. '), color:on?'#fff':c, bg:on?c:'transparent', border:c, onClick:()=>this.setLive({rhythm:r.k}) }; });
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
    const ventAlarm = pip>35 ? 'HIGH Paw' : (autoP>4 ? 'AUTO-PEEP' : (mlkgNum>8 ? 'HIGH VT' : ''));
    const ventTiles=[
      {label:'PIP',unit:'cmH₂O',value:pip,color: pip>35?'#F0483E':'#67DCFF'},
      {label:'Pplat',unit:'cmH₂O',value:plat,color: plat>30?'#F5A623':'#587DFF'},
      {label:'VTE',unit:'mL',value:vte,color:'#22e34a'},
      {label:'VT/kg',unit:'mL/kg',value:mlkg,color:mlkgColor},
      {label:'MV',unit:'L/min',value:mv,color:'#e8e8e8'},
      {label:'PEEPi',unit:'cmH₂O',value:autoP.toFixed(1),color: autoP>2?'#F5A623':'#cfd4d8'},
    ];
    const co=this.coNum(), svr=this.svrNum();
    const coDisp=(co>0)?co.toFixed(1):'--';
    const svrDisp=(svr>0)?String(Math.round(svr)):'--';
    const cvpDisp=(this.perfusing()&&l.cvp!=null)?this.fmt(l.cvp):'--';
    const hemoTiles=[
      {label:'HR',unit:'bpm',value:this.hrDisp(),color:'#22e34a',sub:''},
      {label:'SpO₂',unit:'%',value:this.fmt(l.spo2),color:'#ffd60a',sub:''},
      {label:'NIBP',unit:'mmHg',value:bp,color:'#ff7b7b',sub:'MAP '+map},
      {label:'CVP',unit:'mmHg',value:cvpDisp,color:'#67DCFF',sub:''},
      {label:'CO',unit:'L/min',value:coDisp,color:'#c98bff',sub:'SVR '+svrDisp},
      {label:'ETCO₂',unit:'mmHg',value:this.fmt(l.etco2),color:'#e8e8e8',sub:''},
      {label:'RR',unit:'/min',value:this.fmt(l.rr),color:'#cfd4d8',sub:''},
    ];

    const profileBtns=this.state.profiles.map((p,i)=>{ let sub; const pt=p.simType||'hemo'; if(pt==='vent') sub=((this.VENT_MODES.find(x=>x.k===p.vMode)||{}).label||'')+' · PEEP '+(p.vPeep??'--'); else if(pt==='both') sub='Combined · '+((this.RHYTHMS.find(r=>r.k===p.rhythm)||{}).label||''); else sub=((this.RHYTHMS.find(r=>r.k===p.rhythm)||{}).label||'')+' · HR '+(p.hr??'--'); return { label:p.label, sub, onClick:()=>this.applyPreset(p), onDelete:()=>this.delProfile(i) }; });

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

    return {
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
      hasAlert:showHemo&&!!a, alertText:a?a[0]:'', alertColor:a?a[1]:'#fff', alertBg:a?a[2]:'transparent',
      showId:l.showId!==false, toggleId:()=>this.setLive({showId:l.showId===false}), toggleFull:()=>this.toggleFull(),
      worsen:()=>this.worsen(), improve:()=>this.improve(), saveProfile:()=>this.doSaveProfile(),
    };
  }
}
