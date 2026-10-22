# RESUS Sim v2 — engine validation

> TRAINING SIMULATION — NOT A MEDICAL DEVICE · NOT FOR CLINICAL USE. Values are model outputs for teaching, not clinical reference ranges.

Generated 2026-10-19 by `engine/tools/validation.js` from engine 2.0.0-engine.1. Every number below is computed live from the engine — rerun the script after any model change.

Automated checks: `engine/test/` (run `node --test "test/*.test.js"` inside `engine/`). The tables below are for clinical reviewers (RTs, intensivists): each row is a physiology claim from the RESUS Sim v2.0 document (Phase 4 and Phase 6) and what the engine does.

## Physiology checks (v2.0 document, Phases 4 and 6)

| Area | Situation | Engine output | Expected behaviour |
|---|---|---|---|
| Normal | Healthy adult, room air | 115/68 (MAP 90), HR 77, CO 5.8, CVP 3.4, PA 24/9 | ~120/80, dicrotic notch present (tested) |
| Tachycardia | HR 75 → 150 (reflexes off) | SV 76 → 49 mL, PP 46 → 36, BP 123/87 | SV and pulse pressure fall (v2.0 prototype gave 211/186) |
| SVT | SVT 180 | SV 33 mL (57 % drop), BP 100/77 | SV drop at >150 bpm |
| Bradycardia | HR 40 (reflexes off) | SV 92 mL, CO 3.7 (vs 5.7 at 75) | larger SV, lower CO |
| AF | Atrial fibrillation 100 | R-R CV 0.26, beat-to-beat SV CV 0.13 | irregular R-R, varying SV |
| Arrest | Ventricular fibrillation, 15 s | CO 0.0, ABP 12 mmHg, CVP 11, MSFP 10.9, monitor HR -- | I(t) = 0, pressures fall to mean systemic filling pressure |
| Arrest | Asystole, 15 s | CO 0.0, ABP 12 mmHg, CVP 11, MSFP 10.9, monitor HR -- | I(t) = 0, pressures fall to mean systemic filling pressure |
| Arrest | PEA, 15 s | CO 0.0, ABP 11 mmHg, CVP 11, MSFP 10.9, monitor HR 44 | I(t) = 0, pressures fall to mean systemic filling pressure |
| Haemorrhage | Blood loss 0 / 15 / 30 / 40 % | 114/68 HR 77 · 100/67 HR 89 · 82/62 HR 109 · 64/51 HR 134 | ATLS-like graded response via baroreflex |
| VC | VT 450, flow 50, C 50, R 10, PEEP 5 | PIP 22.3, Pplat 14.0, VTe 450 | Pplat = 5 + 450/50 = 14; PIP = 14 + 10·0.83 = 22.3 |
| VC decel | same, decelerating flow | PIP 16.0, Pplat 14.1 | v1: PIP 16, plateau 14 |
| Auto-PEEP | VT 500, RR 20, R 40, C 50 (τ 2 s) | PEEPi 4.0 cmH2O | breath stacking 4.0; v1 single-breath formula 2.9; v2.0 prototype 0 |
| PC | ΔP 15, Ti 1.0, τ 0.5 s | VTe 644 mL | ΔP·C·(1 − e^−Ti/τ) = 648 mL (rise time trims a little) |
| Heart–lung | PEEP 0 → 15: CO fall | normovolaemic 14 %, hypovolaemic 19 % | falls more when preload-dependent |
| Heart–lung | Raise airway resistance 10 → 35 (long Te) | PIP 22 → 43, MAP 88 → 88 | resistive pressure does not reach the pleura (v2.0 prototype: MAP 106 → 35) |
| Heart–lung | Pulse-pressure variation, VT 480 | hypovolaemic 21.0 %, normovolaemic 10.9 % | >13 % = fluid responsive |
| Heart–lung | Dynamic hyperinflation, sedated (RR 8 → 24) | PEEPi 0.6 → 9.0, MAP 76 → 63 | hypotension; recovers on disconnection (tested) |
| Gas | 40 % shunt, FiO2 0.5 → 1.0 | PaO2 54 → 67, SpO2 93 | refractory to oxygen |
| Gas | V/Q mismatch, FiO2 0.21 → 0.6 | SpO2 86 → 100 | responds to oxygen |
| Gas | Halve the ventilator rate | PaCO2 40 → 78 after 25 min | ≈ doubles, over minutes |
| Gas | EtCO2: baseline → 2 min VF → ROSC | 38 → 0 → peak 56 mmHg | falls toward 0, washout surge at ROSC |
| Gas | Apnoea: time to SpO2 < 90 % | pre-oxygenated 5.7 min, room air 0.8 min | minutes vs ~1 minute |
| Heart–lung | Severe ARDS: FiO2 90 → 35 % (4 min) | SpO2 95 → 89, HR 93 → 100, MAP 89 → 92 | desaturation brings sympathetic tachycardia |
| Heart–lung | Severe ARDS: PEEP 15 → 5 (derecruitment) (4 min) | SpO2 95 → 87, HR 93 → 98, MAP 89 → 95 | desaturation brings sympathetic tachycardia |
| Heart–lung | Severe ARDS: worsening lung injury event (4 min) | SpO2 95 → 87, HR 93 → 111, MAP 89 → 96 | desaturation brings sympathetic tachycardia |
| Heart–lung | Paralysed patient disconnected, nothing done | HR peak 124 → 38; PEA at 3.4 min; asystole at 5.5 min | tachycardia, then hypoxic bradycardia, then PEA arrest; asystole if untreated |

## Treatments and events (step D)

Drugs act through onset/offset time constants and a sigmoid dose–effect; fluids redistribute; events ramp in and are resolved by their treatment. Doses are typical adult teaching values, not prescribing guidance.

| Area | Situation | Engine output | Expected behaviour |
|---|---|---|---|
| Vasopressor | Septic shock + noradrenaline 0 / 0.1 / 0.3 mcg/kg/min (5 min) | MAP 63 HR 124 SVR 470 · MAP 74 HR 107 SVR 630 · MAP 81 HR 94 SVR 738 | dose-dependent MAP and SVR rise, reflex slowing |
| Fluids | 30 % haemorrhage + 1 L crystalloid over 10 min | MAP 70 → 84 at 10 min → 76 at 60 min; Hb 13.5 → 10.7 | transient response; ~25 % stays intravascular; haemodilution |
| Event | Anaphylaxis 15 min: untreated vs adrenaline 0.5 mg IM at 5 min | MAP 52 (BV 76 %, Hb 17.7) vs 93 | vasodilatory, leaky shock reversed by adrenaline |
| Event | Tension pneumothorax (ventilated), 3 min | MAP 86 → 68, CVP 15, SpO2 88, PIP 29 | obstructive shock; resolves on needle decompression (tested) |
| Rhythm | SVT 180 + adenosine | 6 mg: 4 s block → svt · 12 mg: 9 s block → sinus | 6 mg often only pauses; 12 mg converts |
| Rhythm | Atropine 1 mg | Sinus bradycardia 40 → 66 · Complete heart block 40 → 40 | vagolytic: sinus responds, complete heart block does not |
| Induction | Propofol 1.5 mg/kg (pre-oxygenated) | normovolaemic MAP 89 → 72 · hypovolaemic MAP 78 → 55 | larger fall when preload-dependent; near-apnoea |
| Paralysis | Rocuronium 1.2 mg/kg after pre-oxygenation | apnoea at 55 s; SpO2 < 90 % at 355 s | apnoea within ~1 min; minutes of safe apnoea |
| Airway | VC 450 × 14, PEEP 5, FiO2 0.4 (baseline PIP ~22, EtCO2 ~38), 2.5 min | Bronchospasm: PIP 42, VTe 449, EtCO2 37, SpO2 99<br>ETT obstruction (partial): PIP 49, VTe 450, EtCO2 36, SpO2 100<br>Right main-bronchus intubation: PIP 32, VTe 450, EtCO2 38, SpO2 91<br>Oesophageal intubation: PIP 17, VTe 450, EtCO2 0, SpO2 58<br>Circuit disconnection: PIP 0, VTe 0, EtCO2 0, SpO2 23 | high PIP · high PIP · high PIP + desaturation · no CO2 + desaturation · zeros + apnoea |

## Resuscitation (step E)

Compressions are a pump of fixed shape (depth, rate) acting on the same Windkessels as the heart. One state — the myocardial oxygen debt — links desaturation, low coronary perfusion, CPR and adrenaline to the rhythm: up to 1 it slows and weakens the heart, above 1 the heart fails (PEA, then asystole), and it decides how often a shock returns a circulation. Shock outcomes are drawn at random on the instructor's screen.

| Area | Situation | Engine output | Expected behaviour |
|---|---|---|---|
| CPR | VF, bag 10/min FiO2 1.0, compressions 1 min | good: ART 79/27, CPP 17, flow 1.3 L/min, EtCO2 21<br>shallow: ART 45/19, CPP 9, flow 0.6 L/min, EtCO2 11<br>too slow (80): ART 74/22, CPP 13, flow 0.9 L/min, EtCO2 16<br>too fast (150): ART 76/25, CPP 15, flow 1.1 L/min, EtCO2 18 | good CPR: CPP ≳ 15, EtCO2 ≳ 20; shallow / slow CPR: both fall |
| CPR | Adrenaline 1 mg IV during good CPR (2 min) | CPP 17 → 36 mmHg; myocardial O2 debt 24 % → 0 % | α-effect raises aortic relaxation pressure; better coronary perfusion |
| CPR | Adrenaline 1 mg in arrest: effect at 1 min | no compressions 0 % · with CPR 98 % | a drug needs a circulation to reach the heart |
| Defibrillation | 200 J after untreated VF of 0.5 / 2 / 4 / 8 min (60 runs each): ROSC · PEA · still VF | 0.5 min: 95 · 0 · 5 %<br>2 min: 60 · 30 · 10 %<br>4 min: 0 · 62 · 38 %<br>8 min: 0 · 50 · 50 % | early shock usually works; after minutes of no flow, an organised rhythm without output |
| Defibrillation | 4 min untreated VF, then 2-min cycles of good CPR (adrenaline 1 mg every other cycle), then 200 J: ROSC (40 runs) | 0 cycles: 0 % · 1 cycle: 15 % · 2 cycles: 63 % · 3 cycles: 95 % | prolonged VF: CPR and adrenaline before the shock; keep going |
| Cardioversion | VT 180 with a pulse, 150 J | synchronised: 93 % → sinus · unsynchronised: 18 % → VF · SYNC on VF: not delivered | synchronise for organised rhythms; a sync shock never fires on VF |
| Arrest | Untreated VF | ECG amplitude (SD) 0.39 → 0.18 mV at 8 min; asystole at 16.5 min | coarse → fine VF → asystole |
| Arrest | Hypoxic PEA (disconnection): 30 s later reconnect, FiO2 1.0, CPR, adrenaline 1 mg every 4 min | PEA at 3.4 min; ROSC after 7.5 min of CPR; 1 min later BP 153/111, EtCO2 84 | treat the cause + CPR + adrenaline → ROSC; CO2 washout on ROSC |
| Arrest | 55 % blood loss, nothing done | PEA after 13.7 min | profound shock → coronary hypoperfusion → PEA |
| Pacing | Complete heart block 32/min; threshold 65 mA; pacer 70/min | 40 mA: HR 32, MAP 75 (no capture) · 80 mA: HR 70, pulse 70, MAP 74 → 91<br>asystole, 120 mA: monitor HR 70, pulse none | capture above threshold; pacing asystole gives electrical capture only |

## Scenario library

Each preset sets the patient's physiology; the engine produces the numbers. Expected ranges come from the v1 presets and standard clinical values. Measured after 40 s warm-up + 60 s run (arrest presets: 20 s).

### Healthy / normal baseline (`normal`) — PASS

Reference patient. Dicrotic notch on the arterial line, a/c/v waves on the CVP.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 68 – 88 | 77 | ✓ |
| abp.sys | 105 – 135 | 113 | ✓ |
| abp.dia | 60 – 85 | 67 | ✓ |
| abp.map | 80 – 100 | 88 | ✓ |
| co | 4.5 – 6.8 | 5.8 | ✓ |
| cvp | 1 – 8 | 3.4 | ✓ |
| spo2 | 95 – 100 | 97 | ✓ |
| paco2 | 35 – 45 | 37 | ✓ |
| etco2 | 32 – 43 | 36 | ✓ |
| rr | 12 – 16 | 14 | ✓ |

### Septic shock (`septic`) — PASS

Vasodilated, hyperdynamic: wide pulse pressure, low diastolic, high CO / low SVR, warm periphery (high PI).

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 110 – 135 | 125 | ✓ |
| abp.sys | 80 – 105 | 92 | ✓ |
| abp.dia | 32 – 52 | 41 | ✓ |
| abp.map | 50 – 68 | 64 | ✓ |
| co | 6.5 – 9.5 | 9.4 | ✓ |
| svr | 400 – 720 | 484 | ✓ |
| cvp | 2 – 9 | 7.3 | ✓ |
| spo2 | 89 – 96 | 96 | ✓ |
| etco2 | 20 – 32 | 27 | ✓ |

### Cardiogenic shock (`cardiogenic`) — PASS

Pump failure: narrow pulse pressure, high SVR, raised CVP and wedge, pulmonary oedema widens the shunt.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 105 – 135 | 111 | ✓ |
| abp.sys | 78 – 100 | 91 | ✓ |
| abp.map | 62 – 82 | 80 | ✓ |
| co | 2.6 – 4.2 | 3.9 | ✓ |
| svr | 1200 – 2000 | 1366 | ✓ |
| cvp | 13 – 22 | 14 | ✓ |
| pcwp | 20 – 35 | 29 | ✓ |
| spo2 | 86 – 94 | 92 | ✓ |

### Haemorrhagic shock (`haemorrhagic`) — PASS

~33 % blood loss with full baroreflex compensation: tachycardia, narrow pulse pressure, low CVP. Ventilate with PPV and watch PPV/SVV climb.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 115 – 145 | 122 | ✓ |
| abp.sys | 70 – 92 | 77 | ✓ |
| co | 2.8 – 4.4 | 3.5 | ✓ |
| svr | 1350 – 2100 | 1540 | ✓ |
| cvp | -1 – 4 | 0.2 | ✓ |
| spo2 | 94 – 100 | 98 | ✓ |

### Obstructive — massive PE (`pe`) — PASS

RV pressure overload: high CVP and PA pressure, LOW wedge, wide PaCO2–EtCO2 gap (dead space).

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 110 – 140 | 119 | ✓ |
| abp.sys | 80 – 105 | 89 | ✓ |
| co | 2.6 – 4.3 | 3.8 | ✓ |
| cvp | 12 – 22 | 13 | ✓ |
| pap.map | 28 – 48 | 35 | ✓ |
| pcwp | 0 – 12 | 1.4 | ✓ |
| etco2 | 16 – 30 | 18 | ✓ |
| spo2 | 86 – 95 | 94 | ✓ |

### Obstructive — tamponade (`tamponade`) — PASS

Equalised diastolic pressures (CVP ≈ wedge), blunted y descent, pulsus paradoxus with spontaneous breaths.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 105 – 140 | 109 | ✓ |
| abp.sys | 75 – 100 | 78 | ✓ |
| co | 2.5 – 4.4 | 3.0 | ✓ |
| cvp | 13 – 22 | 14 | ✓ |

### Tension pneumothorax (ventilated) (`tension`) — PASS

Rising airway pressures, hypoxia, obstructive shock. Decompress (pplOffset → 0, venousObstruction → 1) and it recovers.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 110 – 150 | 147 | ✓ |
| abp.sys | 55 – 90 | 77 | ✓ |
| cvp | 14 – 26 | 18 | ✓ |
| spo2 | 70 – 90 | 87 | ✓ |
| vent.pip | 30 – 50 | 31 | ✓ |

### Inferior STEMI (RV involvement) (`istemi`) — PASS

Bradycardic with RV infarction: raised CVP with clear lungs — preload dependent (fluid helps, nitrates hurt).

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 50 – 64 | 62 | ✓ |
| abp.sys | 85 – 112 | 87 | ✓ |
| cvp | 8 – 16 | 8.3 | ✓ |
| co | 3 – 4.8 | 3.5 | ✓ |

### Respiratory failure (spontaneous) (`respfail`) — PASS

Rapid shallow breathing: high dead-space ventilation → hypercapnia; shunt + V/Q mismatch → hypoxaemia that partly responds to O2.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 100 – 125 | 118 | ✓ |
| abp.sys | 108 – 145 | 126 | ✓ |
| spo2 | 76 – 88 | 82 | ✓ |
| paco2 | 50 – 68 | 51 | ✓ |
| etco2 | 44 – 62 | 45 | ✓ |
| rr | 30 – 34 | 33 | ✓ |

### Cardiac arrest — VF (`vf`) — PASS

No output: arterial and venous pressures meet at mean systemic filling pressure; no pleth, no SpO2, EtCO2 falls to zero.

| Measure | Expected | Engine |  |
|---|---|---|---|
| co | 0 – 0.05 | 0.0 | ✓ |
| abp.map | 6 – 16 | 11 | ✓ |
| cvp | 6 – 16 | 11 | ✓ |

### Cardiac arrest — asystole (`asystole`) — PASS

| Measure | Expected | Engine |  |
|---|---|---|---|
| co | 0 – 0.05 | 0.0 | ✓ |
| abp.map | 6 – 16 | 11 | ✓ |

### Cardiac arrest — PEA (`pea`) — PASS

Organised complexes on the ECG (the monitor still counts a heart rate) with no pulse and no pleth.

| Measure | Expected | Engine |  |
|---|---|---|---|
| hr | 38 – 52 | 43 | ✓ |
| co | 0 – 0.05 | 0.0 | ✓ |
| abp.map | 6 – 16 | 11 | ✓ |

### Normal lungs (`v-normal`) — PASS

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.pip | 16 – 22 | 20 | ✓ |
| vent.pplat | 12 – 15.5 | 13 | ✓ |
| vent.peepi | 0 – 0.5 | 0.0 | ✓ |
| vent.vte | 440 – 460 | 450 | ✓ |
| spo2 | 97 – 100 | 99 | ✓ |
| paco2 | 35 – 45 | 40 | ✓ |

### ARDS — mild (`v-ards-mild`) — PASS

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.pplat | 15 – 19 | 17 | ✓ |
| vent.dp | 8 – 10 | 9.0 | ✓ |
| spo2 | 94 – 100 | 99 | ✓ |
| pf | 200 – 320 | 266 | ✓ |

### ARDS — moderate (`v-ards-mod`) — PASS

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.pplat | 21 – 26 | 23 | ✓ |
| vent.dp | 10 – 13 | 11 | ✓ |
| spo2 | 90 – 100 | 99 | ✓ |
| pf | 100 – 200 | 191 | ✓ |
| paco2 | 38 – 55 | 44 | ✓ |

### ARDS — severe (`v-ards-severe`) — PASS

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.pplat | 29 – 34 | 33 | ✓ |
| vent.vte | 280 – 380 | 349 | ✓ |
| spo2 | 82 – 96 | 95 | ✓ |
| pf | 50 – 100 | 82 | ✓ |
| paco2 | 42 – 70 | 56 | ✓ |

### COPD exacerbation (`v-copd`) — PASS

High compliance, high resistance: long expiratory time constant; expiratory flow still running when the next breath starts. Rate 16 (v1: 12) so the air trapping is visible.

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.pip | 38 – 50 | 45 | ✓ |
| vent.pplat | 14 – 20 | 14 | ✓ |
| vent.peepi | 1 – 4 | 1.5 | ✓ |
| spo2 | 90 – 100 | 97 | ✓ |

### Status asthmaticus (`v-asthma`) — PASS

Extreme resistance: small delivered VT in PC, air trapping (auto-PEEP), shark-fin capnogram.

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.peepi | 1.5 – 8 | 1.8 | ✓ |
| vent.vte | 250 – 450 | 309 | ✓ |
| paco2 | 45 – 75 | 51 | ✓ |

### PRVC — volume target (`v-prvc`) — PASS

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.vte | 395 – 445 | 420 | ✓ |
| vent.pip | 16 – 28 | 20 | ✓ |

### PS weaning trial (`v-ps`) — PASS

PS 10 on a patient with modest drive: VT ~500 at 18/min over-ventilates (PaCO2 high-20s) — a cue to wean the support.

| Measure | Expected | Engine |  |
|---|---|---|---|
| vent.rr | 17 – 19 | 18 | ✓ |
| vent.vte | 400 – 650 | 531 | ✓ |
| vent.pip | 14 – 16.5 | 15 | ✓ |
| spo2 | 96 – 100 | 99 | ✓ |
| paco2 | 22 – 40 | 25 | ✓ |

## Known simplifications (for reviewers)

- Single-compartment lungs: no regional heterogeneity, no recruitment/derecruitment hysteresis on the P-V loop.
- One pump-and-curve circulation per side; no valve disease. Coronary perfusion is one "myocardial oxygen debt" state (desaturation or low aortic − RA pressure), not a coronary circulation.
- CPR is a compression pump of fixed shape: depth and rate only (no leaning / incomplete recoil, no feedback from a real manikin) — the instructor sets the quality the team is achieving.
- Shock success depends on VF duration (oxygen debt), energy and amiodarone; no pad position, impedance or waveform type.
- Hypoxic and low-flow arrests become PEA, then asystole; the engine never turns hypoxia or ischaemia into VF on its own.
- After ROSC the heart recovers as the remaining oxygen debt is repaid; no prolonged post-arrest stunning, acidosis or hyperkalaemia. Adrenaline 1 mg keeps the blood pressure high for several minutes after ROSC.
- Drug effects use one generic onset/offset + sigmoid model per drug; no tachyphylaxis or interactions beyond effects adding up.
- Crystalloid is not excreted by the kidneys; it stays in the body (vessels or tissues) for the length of a scenario.
- Pplat and PEEPtot are static (hold-manoeuvre) values each breath; real ventilators measure them only on request.
