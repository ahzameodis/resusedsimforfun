# RESUS Sim v2

> TRAINING SIMULATION — NOT A MEDICAL DEVICE · NOT FOR CLINICAL USE · ALL PATIENT DATA IS FICTIONAL

v2 replaces v1's "instructor types the numbers" model with a physiology engine: the instructor (or a preset) sets the patient's underlying state — blood volume, vascular tone, contractility, lung compliance, resistance, shunt — and the engine works out the monitor and ventilator numbers and waveforms. v1 (`../ResusSim (1).html`) is unchanged.

Done so far: steps **A** (engine + validation harness), **B** (heart–lung coupling + gas exchange), **C** (the engine wired into the v1 screens as **`../ResusSim v2.html`**), **D** (fluids and drugs, clinical events, and a trainee console) and **E** (cardiac arrest, CPR, defibrillation and pacing; alarm limits with sound; a debrief export with trends), plus **scenario scripts** (timelines that run a scenario on their own).

## Using ResusSim v2

Open `ResusSim v2.html` (project root) exactly like v1 — one file, no server; scan the QR code on Home to open the monitor on another device.

On the **Controller**, the new *Simulation engine* card switches between:

- **Manual — set the numbers.** v1's behaviour, unchanged: vitals sliders, v1 presets, Deteriorate / Improve.
- **Physiology — set the patient.** The engine runs on every screen. Pick a patient or ventilator scenario, then change the physiology — rhythm, resting heart rate, LV/RV contractility, arteriolar tone, blood volume, venous capacitance, PVR, pericardial and pleural pressure, baroreflex, lung compliance, resistance, shunt, V/Q mismatch, dead space, recruitability, spontaneous rate and effort, FiO₂ — or use the quick actions (fluid bolus, blood loss, decompress chest, PA catheter). Ventilation is a mode chip: *Not ventilated* or VC / PC / PRVC / PS / CPAP with v1's settings. The preview column adds an engine readout (CO, SV, SVR, wedge, PPV, PaO₂, P/F, PaCO₂, SvO₂…).

The **Display** in physiology mode draws the engine's waveforms — ECG, pleth, arterial line, CVP, PA line (when the catheter is in), capnogram; Paw, flow, volume plus pressure–volume and flow–volume loops — and shows measured numbers (pulse vs ECG rate, PI, MAP, PPV, ΔP, VT/kg, PEEPi, Cstat/Cdyn). Alarms come from the measured values (VF/PEA/blocks, desaturation, hypotension, apnoea, high Paw, auto-PEEP, high VT).

Switching back to **Manual** hands over: the manual numbers start from what the engine was showing, and v1's ventilator takes the same lung mechanics.

Monitor colours: ECG green, **SpO₂ / pleth blue**, arterial red, **CVP yellow**, PA orange, CO₂ white (SpO₂ and CVP swapped from v1 to match the hospital's convention).

### Treatments, events and the trainee console (step D)

In Physiology mode the Controller adds:

- **Treatments** — crystalloid 250 / 500 / 1000 mL and packed red cells (run in over minutes; crystalloid partly leaves the circulation, Hb dilutes or rises); push-dose pressors (adrenaline, phenylephrine); induction and paralysis (propofol, ketamine, etomidate, fentanyl, midazolam, rocuronium, suxamethonium); atropine, adenosine, salbutamol; infusions with −/+ (noradrenaline, adrenaline, vasopressin, phenylephrine, dobutamine, GTN, propofol). An *On board* list shows what is running and still acting, with blood volume and Hb.
- **Events** — pick a severity, then start: anaphylaxis, ongoing haemorrhage, tension pneumothorax, tamponade, massive PE, bronchospasm, ETT obstruction, right main-bronchus intubation, oesophageal intubation, circuit disconnection, unplanned extubation. Each develops over time; the active list shows how far, for how long, and the treatment that resolves it (needle decompression, pericardiocentesis, suction, withdraw the tube, reconnect, re-intubate, control the bleeding, thrombolysis) — or *End*. Adrenaline is what turns anaphylaxis round; adenosine 12 mg converts SVT (6 mg usually only pauses it).
- **Trainee console** — `ResusSim v2.html#trainee?s=<session>` (*Copy link* on the Controller, or *Open trainee console* on Home), for a tablet with the team: a ventilator screen with loops and staged settings (adjust, then **Apply**, as on a real ventilator), plus fluids, drugs, infusions and procedures. Orders go to the Controller, which applies them; the instructor can lock the ventilator half and the treatment half independently.
- **Activity** — every order, event and engine-driven rhythm change, with time and who did it (Instructor / Trainee / Patient): a debrief timeline.

The Display adds ventilator alarms for the airway events: *DISCONNECT*, *EXTUBATED*, and *NO CO₂* when breaths are delivered but no CO₂ returns (oesophageal tube).

### Arrest, resuscitation, alarms and debrief (step E)

- **The patient can arrest on their own.** Sustained profound hypoxaemia, or a coronary perfusion pressure that stays very low (profound shock), runs up a *myocardial oxygen debt*: first tachycardia, then bradycardia and falling pressure, then **PEA**; an arrest left untreated ends in **asystole**, and untreated VF coarsens to fine VF first. A paralysed patient disconnected from the ventilator: PEA at ~3½ min, asystole at ~5½ min. *Arrest physiology* on the Controller switches this off when you want rhythm changes only by your hand.
- **CPR** — *Start CPR* (Controller or trainee console). Compressions drive the circulation: compression pulses on the arterial line (~80/25 with good CPR), spikes on the CVP, a large artefact on the ECG that hides the rhythm until compressions pause, and EtCO₂ that reports quality (good ~20 mmHg, shallow ~11). The instructor sets the quality the team is achieving: *Good*, *Shallow*, *Too slow*, *Too fast*. *Bag-mask ventilate* starts 7 mL/kg × 10/min with 100 % oxygen.
- **Drugs need a circulation** — adrenaline given in arrest acts only once compressions move it. With good CPR, adrenaline 1 mg roughly doubles the coronary perfusion pressure and starts repaying the oxygen debt.
- **Defibrillator** — energy 120–360 J, *SYNC* for cardioversion. On the trainee console it works like a manual defibrillator: *Charge* (3 s), then *SHOCK* or *Disarm*, with its own ECG strip and no rhythm label. Outcomes come from the physiology: VF shocked within 30 s returns a circulation ~95 % of the time; after 4 min without CPR the shock leaves PEA; 2-minute cycles of CPR with adrenaline bring the chance back (≈15 % after one cycle, ≈60 % after two, ≈95 % after three). A synchronised shock never fires on VF; an unsynchronised shock on VT can cause VF. *Shock outcome* lets the instructor override: *Shocks always work* or *Refractory VF*. Amiodarone 300 / 150 mg raises the chance a shock terminates VF.
- **ROSC** — an arrest the engine made (or PEA after a shock) returns a circulation once its cause is fixed and CPR with adrenaline has repaid the debt; EtCO₂ jumps as stored CO₂ washes out. Choosing a perfusing rhythm yourself is always an instant ROSC.
- **Transcutaneous pacer** — rate and output (mA) against a capture threshold the instructor sets (it rises as the heart becomes hypoxic). Below threshold: spikes without capture; above it: paced complexes and, for bradycardias with a pulse, mechanical capture. Pacing asystole or PEA gives electrical capture only — check for a pulse.
- **Alarm limits** (Controller, shared by every screen): HR, SpO₂, systolic BP, MAP, EtCO₂, respiratory rate, peak airway pressure. Medium alarms are amber; arrest rhythms, apnoea, airway loss and extreme values are red and **latch** — they stay on the bar, marked *resolved*, until someone presses *Acknowledge*. Every alarm uses hysteresis, so nothing flickers at a limit.
- **Sound** (Display): *Sound on* (a browser only allows audio after a tap) — a pulse tone that drops in pitch as SpO₂ falls, a 5-pulse high-priority tone every 10 s, a 3-pulse medium tone every 20 s; *Silence 2 min*; *Pulse tone* on/off.
- **Debrief** (Controller): every order, event and rhythm change with its time, plus vital signs every 5 s, kept on the instructor's device. *Export report* saves a standalone HTML page — summary (time without a pulse, time to first compression, CPR fraction, longest pause, shocks, adrenaline times), trend charts with compressions shaded and each timeline entry marked, and the full timeline. *Trends CSV* for spreadsheets, *Add note* for instructor comments, *New run* to start again.

### Scenario scripts

In Physiology mode the Controller's *Scenario script* card prepares a scenario that runs on its own.

- **Steps fire in order.** Each step waits — once the step before it has fired — for its condition, then does one thing.
  - **When:** at a time (T+mm:ss from Start) · a delay after the previous step (0:00 = together with it) · SpO₂ below a limit for N seconds · systolic BP below a limit for N seconds · a shock delivered (N shocks, counted from when the previous step fired) · a treatment given (given at any time since Start: any fluid, or a total ordered volume — ≥ 500 mL / 1 L / 2 L; a drug at any dose, or one specific dose such as *Adrenaline 1 mg IV*, so a push-dose doesn't count as the arrest dose; a procedure, CPR, the pacer or bag-mask) · a rhythm reached (a named rhythm, *any arrest rhythm* or *any rhythm with a pulse*).
  - **Or at the latest:** any trigger can also have a time (T+mm:ss from Start) — the step fires on whichever comes first, and the log says which ("T+7:00 (latest)").
  - **Then:** start an event at a severity · set the rhythm · change one physiology setting (any *Circulation* or *Lungs & breathing* setting, within its slider range) · set the shock outcome · add a note to the log.
- **Any-time steps** (*Any time — doesn't wait for earlier steps* in the step editor; marked *any time* in the list) are for things that may or may not happen, such as "whenever phenylephrine is given". They take the same triggers and actions, but the order skips them: each is armed from Start and fires once, whenever its condition holds, without holding up the steps in order (and they never wait for it). Each keeps its own state: an SpO₂ / systolic hold timer, and shocks counted from Start. *After the previous step* on an any-time step means the step directly above it, whenever that fires, so a chain of any-time steps can make one trigger do several things. A step in order skips any-time steps when it looks for *its* previous step. The script finishes when every step in order has fired; any-time steps that haven't fired by then never will. The card shows how many have fired ("Any time: 3 of 6 fired"), the log tags them "script step 11 (any time) · Phenylephrine given", and the debrief summary counts them separately.
- **Vital-sign triggers use the measured value.** SpO₂ needs a pleth signal (no reading never counts); systolic counts as 0 without a pulse. A dip back above the limit for less than 3 s doesn't restart the count, so beat-to-beat noise at the limit doesn't stall a step.
- **Start / Pause / Reset.** *Start from* can load a scenario first; the clock starts once the new patient has loaded. *Current patient* keeps whoever is on the monitor. The card shows the next step with its countdown, or the value it is waiting on ("SBP < 75 mmHg for 30 s · now 82"), and the top bar shows the script time. *Reset* goes back to step 1 without touching the patient — settings a step changed (the shock outcome, for example) stay as they are. A step added after the script has finished runs with *Resume*.
- **Every step is an order.** It goes through the same path as the buttons, so it appears in *Activity* and the debrief (report timeline and CSV) as *Script*, with the step and its trigger — e.g. "Shock outcome: shocks always work — script step 3 · Amiodarone given". The debrief summary adds how far the script got. The trainee console doesn't show the script's entries.
- **Only the instructor's Controller runs it**, on the patient's (engine) clock: it stops while you are on Home or in Manual mode and catches up with the engine in a hidden tab. The script and its progress are kept for the session; reopening the Controller leaves a running script paused.
- **Saved profiles keep the script.** *Save current* stores it with the patient; loading the profile loads the script, ready to start.
- **A script can name its patient** (name, age, sex — set on Start; the built-in cardiogenic-shock script does, because sex sets the normal blood volume it was calibrated on).
- **Three examples** (load them from the card):
  - *Septic shock — deteriorates without treatment* (starts from Septic shock). Every 2 min the sepsis worsens: SVR 250, blood volume 85 %, LV contractility 0.55, shunt 30 %. Systolic below 75 for 30 s → the patient decompensates (contractility 0.35, SVR 200); below 62 for a minute → contractility 0.2, blood volume 70 %, venodilation. Untreated: decompensation at ~8:30, pulse lost at ~15 min, PEA (made by the engine) at ~18 min. With 2 L of crystalloid, or noradrenaline, systolic stays 82–97 and the script waits at step 6.
  - *VF arrest — refractory, ROSC after amiodarone* (starts from Cardiac arrest — VF). Every shock fails until amiodarone has been given (from the Controller or the trainee console); then shocks always work, the next shock restores sinus rhythm, a ROSC note is logged and the shock outcome returns to *Physiology decides*.
  - *Cardiogenic shock — RV infarct, VT/VF, ROSC in heart block* — the "Cardiogenic Shock Simulation V2" scenario (Ibrahim Naseer, 59 M; starts from Inferior STEMI (RV involvement), 34 steps of which 6 are any time, ~19 min):
    - **Phase I** — bradycardic RV-infarct shock: HR 36, ~86/51, CVP 16, wedge 4 (dry lungs), SpO₂ 93–97 %, RR 33 — stable untreated. Atropine 1 mg lifts it to HR ~60, ~112/79; a 250 mL challenge doesn't trigger anything. Notes at T+0 give the instructor the cues the engine doesn't model (temperature, GCS, V4R, POCUS findings).
    - **Trap 2 — pressor by habit** (any-time steps): **phenylephrine** (any dose or infusion) or **vasopressin** sets *Pulmonary vascular resistance* to 1200 and *RV contractility* to 0.25, and logs a "Trap 2" note. The BP falls instead of rising: from ~86 to ~68 straight away. With the drug acting, systolic peaks at ~78 after phenylephrine 100 mcg (~86 after 200 mcg; 72–84 on vasopressin 0.01–0.03 U/min), then settles around 64. After atropine (~113) it falls to 77–100. Once the drug has worn off it stays ~64, without an arrest. Each drug fires its trap once.
    - **Phase II** starts as soon as **1 L of fluid has been ordered** (the over-distended RV) **or at T+7:00** — perfusing VT at 150 (~70/54, pulse present; the document's 180/min leaves too little stroke volume per beat for a palpable pulse in the engine). Phase II also sets PVR back to 100 and RV contractility to 0.35. This ends a Phase I trap, so the VT keeps its pulse (~78/62 with phenylephrine still on board); left in place, the trap would make the VT pulseless and the ROSC weak. Shocks are refractory from here, so a reflex cardioversion is logged as "no change". 2:30 later the pulse is lost: VF.
    - **Arrest** — ROSC comes 1 min after the **3rd shock, amiodarone and adrenaline 1 mg** are all in, into **complete heart block ~40**. A Phase I push-dose of adrenaline doesn't count.
    - **Phase III** — 82–122 systolic at ROSC, depending on the arrest. It sags to the 60s within ~7 min unsupported; noradrenaline + dobutamine hold it, and pacing lifts output. Notes give the lactate (6.8 at ROSC, 12.1 four minutes later) and close the scenario 4 min after that.
    - **Not modelled by the engine** (the instructor covers them): lactate, temperature, GCS and the imaging cues (given as notes). The pure-vasoconstrictor trap is done by the script, not the engine: the engine's phenylephrine and vasopressin still raise SVR only, so the script's settings don't scale with the dose. Phenylephrine infusions of 0.5 mcg/kg/min or more and vasopressin 0.06 U/min end near or a little above the untreated systolic, after the initial fall. PVR on its own couldn't make the BP fall, even at its maximum of 1200, because the low output keeps the RV's extra load small, so the trap also lowers RV contractility. A vasoconstrictor first given after Phase II has started keeps its trap to the end of the run. A drug whose trap fired in Phase I doesn't fire it again later. The document's "deterioration to VT is accelerated" isn't modelled: Phase II still comes at 1 L or T+7:00. Metaraminol isn't in the drug list. With adrenaline and dobutamine on board the post-ROSC BP runs higher than the document's 78/55; the rising lactate carries the "don't anchor on BP" point.

### How the screens stay in step

- Every screen builds the patient from the shared settings (the MQTT `…/state` topic, as in v1) and runs its own engine — waveforms are never streamed. Only the instructor's device writes that state.
- The Controller publishes the engine's slow state — reflexes, gas stores, blood volume, drugs on board, active events (timed by age, since every screen's clock differs) — about once a second on `…/engine`; displays and the trainee console take only that state, tagged with the scenario epoch, so a late message can't roll back a newer setting.
- The trainee console sends **orders** on `…/cmd`; the Controller checks the locks, applies, logs and republishes. The instructor's own buttons go through the same path, so the log is complete.
- Each screen tags what it publishes and ignores the broker's echo of its own messages, and same-browser storage sync runs Controller → followers only. (Both fix a v1 race where quick successive changes — e.g. dragging a slider — could roll the Controller back.)
- Only the instructor's engine changes rhythm by itself (arrest, ROSC, shock outcomes — they are random); it writes the new rhythm into the shared state. CPR and pacer settings travel in the shared state too; a shock is announced there so every screen draws the artefact.
- A scenario script runs only on the instructor's Controller (kept in its local storage, not synced); what its steps change reaches the other screens through the shared state and `…/engine`, like a button press.
- A hidden tab gets no animation frames, so each screen keeps its engine running from a 1-second timer while hidden.
- Display stability: the alarm bar has a fixed height and alarms use hysteresis (e.g. hypotension on < 90, off ≥ 94), tiles have fixed widths per parameter, waveform scales only shrink after 4 s, canvases are pinned inside their frames, and the scrollbar's width is reserved — together these removed a resize loop that cleared the waveforms every frame (the flicker).

### Rebuilding the app

`ResusSim v2.html` is generated — edit the sources, then:

```
cd v2/engine && node build.js     # only if engine/src changed
cd v2/app && node build.js
```

`app/build.js` takes v1's bundle as the base (loader, React, MQTT, QR, fonts, design system), inlines `app/template.html` + `app/app.js`, adds the engine as one more asset, and checks the result round-trips. v1 is only read.

## Try it

| What | How |
|---|---|
| Watch the engine | Open `bench.html` in a browser (double-click works). Pick a scenario, drag the sliders, use the quick actions. |
| Run the validation tests | `cd engine` then `node --test "test/*.test.js"` (Node 18+; no packages to install) |
| Scenario table in the terminal | `node tools/report.js` inside `engine/` |
| Regenerate the reviewer document | `node tools/validation.js > ../VALIDATION.md` inside `engine/` |
| Rebuild the browser bundle after editing `src/` | `node build.js` inside `engine/` |

[`VALIDATION.md`](VALIDATION.md) lists every physiology claim from the RESUS Sim v2.0 document (Phases 4 and 6) next to what the engine produces, the treatments and events, and all 20 presets against their expected ranges. It is written for RT / intensivist review.

## Layout

```
../ResusSim v2.html          the app (generated by app/build.js)
v2/
  app/template.html          markup + styles (v1's, plus physiology mode, treatments/events/resuscitation cards, scenario script, alarm limits, debrief, trainee console)
  app/app.js                 app logic (v1's, plus physiology mode, engine sync, orders, scenario scripts, alarms + sound, debrief export, sweep drawing)
  app/build.js               packs template + app + engine into ../ResusSim v2.html
  bench.html                 visual bench (monitor, ventilator, loops, numbers, sliders)
  VALIDATION.md              generated reviewer document
  engine/
    src/00-core.js           utilities, units, default patient
    src/10-heart.js          rhythms, beat timing (P and QRS scheduled separately), ECG
    src/20-circulation.js    venous return × Starling operating point; Windkessel waveforms, PAP, CVP, pleth
    src/30-lungs.js          equation of motion every 5 ms; VC / PC / PRVC / PS / CPAP / spontaneous
    src/40-gas.js            O2 store, shunt vs V/Q mismatch, Fick, CO2 kinetics, EtCO2
    src/45-volume.js         live blood volume and Hb: fluids, redistribution, bleeding, capillary leak
    src/46-drugs.js          drug library: bolus/IM/infusion, onset/offset, sigmoid dose–effect
    src/47-events.js         clinical events: onset, effects, treatments that resolve them
    src/48-resus.js          chest compressions, defibrillation / cardioversion, pacing, arrest bookkeeping
    src/50-sim.js            the loop, effective parameters, reflexes + respiratory drive, measured vitals, sync
    src/60-scenarios.js      20 presets, each with expected outcome ranges
    dist/resus-engine.js     src/ concatenated into one <script> (window.ResusEngine)
    test/                    109 automated checks
    tools/                   report, validation, probe/peek calibration helpers
```

## How the model fits together

- **Heart.** Atrial and ventricular events are scheduled separately, so AV blocks, AV dissociation (cannon a waves) and AF come from timing rules. Each QRS gets its own stroke volume: filling time (short AF cycles → weak beats, fast rates → small SV), atrial kick and breathing.
- **Circulation.** Every 50 ms the operating point is solved: Guyton venous return `(MSFP − RAP)/RVR` meets right- and left-heart Starling curves acting on **transmural** filling pressure (minus pleural and pericardial pressure). Each beat ejects into a 3-element Windkessel draining to RAP, so with no output the pressure falls to mean systemic filling pressure. Baroreflex (HR, arteriolar and venous tone, contractility) and a chemoreflex (hypoxaemia, hypercapnia) close the loop.
- **Lungs.** `Paw = R·Flow + V/C − Pmus`, integrated continuously, so trapped gas carries into the next breath (auto-PEEP emerges). Patient effort runs on its own clock and can trigger the ventilator.
- **Coupling.** Pleural pressure = transmitted fraction of alveolar pressure (lower in stiff ARDS lungs). Its mean shifts the circulation's operating point (PEEP and auto-PEEP lower CO, more when hypovolaemic); its swing modulates beat-by-beat SV (pulse-pressure variation, pulsus paradoxus). High alveolar pressure also raises PVR.
- **Gas exchange.** FiO2, PEEP (recruitment), shunt, V/Q mismatch, ventilation and cardiac output determine PaO2, SpO2 (with circulation delay), PaCO2 and EtCO2 (dead space rises when pulmonary blood flow falls). Spontaneous breathing deepens and quickens as CO2 rises or saturation falls; sedatives and opioids blunt it.
- **Oxygenation drives the circulation.** Falling saturation (from ~94 %) and rising CO2 add sympathetic drive through a chemoreflex that resets the baroreflex rather than fighting it: tachycardia, vasoconstriction, contractility (SpO2 ~82 % ≈ +30 % heart rate). Saturation held below ~60 % then exhausts the myocardium — rate and pressure fall (pre-arrest). So bad ventilator settings or a worsening lung (the *Worsening lung injury* event) show up as desaturation **and** a climbing heart rate.
- **Arrest and resuscitation.** One state, the myocardial oxygen debt, links desaturation and coronary perfusion (aortic − right-atrial pressure) to the heart: it slows and weakens it, then stops it (PEA → asystole), and it sets the odds that a shock restores a circulation. Compressions are a pump of fixed shape acting on the same Windkessels as the heart; pacing replaces the ventricular rhythm when it captures.
- **Drugs, fluids, events.** All act on an *effective* copy of the parameters (`sim.pe`), rebuilt every 50 ms as baseline × drug effects × events, with live blood volume and Hb — so the instructor's settings (`sim.p`) are never overwritten by a treatment.

## Engine API

```js
const sim = new ResusEngine.Sim(ResusEngine.scenario('septic').params, { seed: 1 });
sim.step(1 / 60, (s) => {          // per animation frame; callback per 5 ms sample
  // s.ecg s.art s.pleth s.cvp s.pap s.paw s.flow s.vol s.co2 s.resp
});
sim.set({ vent: { peep: 12 } });     // change any part of the patient while running
sim.load(params);                    // replace the patient (scenario change) and settle
sim.vitals;                          // measured numbers: hr, pulse, abp, nibp, spo2, etco2, rr, cvp, pap, pcwp,
                                     // co, sv, svr, ppv, pao2, paco2, vent { pip, pplat, peepi, vte, mv, cstat … }
sim.infuse('noradrenaline', 0.1);    // mcg/kg/min; 0 stops it
sim.bolus('adrenaline', 500, 5);     // dose in the drug's bolus unit; optional absorption time (min) for IM
sim.giveFluid('crystalloid', 500, 10);   // mL over minutes ('blood' for packed cells)
sim.startEvent('tension', 1);        // severity 0–1; sim.eventAction('decompress') / sim.endEvent('tension')
sim.set({ resus: { cpr: true, cprRate: 110, cprDepth: 1, pace: true, paceRate: 70, paceMA: 80 } });
sim.shock(200, false);               // → { delivered, from, to }; sync = true for cardioversion
sim.takeNotices();                   // rhythm changes the engine made itself (arrest, ROSC, shock outcome)
sim.treatments();                    // drugs on board, bags running, events, blood volume, Hb
const msg = sim.exportSync();        // Control screen: publish ~1 Hz over the existing MQTT sync
otherSim.importSync(msg, { stateOnly: true });   // Display: keep its own settings, take the slow state
```

Parameters are grouped (`patient`, `heart`, `vessels`, `volume`, `thorax`, `lungs`, `metabolism`, `reflex`, `breathing`, `airway`, `vent`, `sim`); defaults and units are documented in `engine/src/00-core.js`.

## Differences from v1 to know about

- **Presets are physiology now.** The v1 shock presets are reproduced as states (e.g. septic = low SVR, venodilation, high VO2), and the CO / SVR / CVP triads emerge. `heart.hr` is the patient's baseline rate; the baroreflex adds the tachycardia of shock unless `reflex.baro` is set to 0.
- **Resistance.** v1's ventilator resistance was the total seen by the ventilator; here `lungs.resistance` is the patient's airways and the endotracheal tube adds 5 when ventilated.
- **COPD preset** runs at rate 16 (v1: 12) so the air trapping is visible.
- **New rhythms:** PEA, pulseless VT, 1st-degree, Mobitz I, Mobitz II 2:1, complete heart block. AF is now irregularly irregular.

## Next steps

- **Clinical review** of `VALIDATION.md` — now including the resuscitation table (CPR haemodynamics, shock success over time, hypoxic arrest and ROSC timings, pacing) — and a scenario run-through with RTs / intensivists.
- Not built yet, if wanted: hyperkalaemia / acidosis, a link to a CPR-feedback manikin so compression quality comes from the team rather than the instructor, and a pulmonary-vasoconstrictor (PVR) effect for phenylephrine and vasopressin in the engine itself, if clinical review agrees (the cardiogenic-shock script's any-time steps stand in for it now, at a fixed size whatever the dose).
