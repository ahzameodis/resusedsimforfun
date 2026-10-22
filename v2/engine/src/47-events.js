/* RESUS Sim v2 engine — clinical events.
 *
 * An event ramps in with its own onset time constant (ton, s) toward its severity (0–1),
 * changes the patient through the same channels as drugs, and ramps out (toff, s) when it
 * is resolved — by its treatment action (needle decompression, pericardiocentesis, suction…)
 * or by the instructor ending it. Anaphylaxis is also damped by drugs that suppress the
 * mediator response (adrenaline), so giving adrenaline is what turns it around.
 *
 * fx(L, M, flows, ctx): L = current level (0–sev); M = modifier channels (multiply or add);
 * flows.bleed / flows.leak in mL/min.
 */
(function (R) {
  'use strict';
  const U = R.util;

  R.EVENTS = {
    anaphylaxis:   { label: 'Anaphylaxis', group: 'Circulation', sev: 0.8, ton: 90, toff: 180, actions: [],
                     fx(L, M, F, c) { const e = L * (1 - 0.85 * c.drugs.leakBlock); M.svr *= 1 - 0.7 * e; M.vu *= 1 + 0.3 * e;
                       M.spasm += 15 * e; M.vq += 0.1 * e; F.leak += 220 * e * Math.exp(-c.elapsed / 600); } },
    haemorrhage:   { label: 'Ongoing haemorrhage', group: 'Circulation', sev: 0.6, ton: 5, toff: 5, actions: [{ id: 'control', label: 'Control the bleeding' }],
                     fx(L, M, F) { F.bleed += 150 * L; } },
    tension:       { label: 'Tension pneumothorax', group: 'Circulation', sev: 1, ton: 90, toff: 10, actions: [{ id: 'decompress', label: 'Needle decompression' }],
                     fx(L, M) { M.ppl += 16 * L; M.compliance *= 1 - 0.5 * L; M.shunt += 0.3 * L; M.vobs *= 1 + 0.6 * L; } },
    tamponade:     { label: 'Cardiac tamponade', group: 'Circulation', sev: 0.9, ton: 180, toff: 15, actions: [{ id: 'drain', label: 'Pericardiocentesis' }],
                     fx(L, M) { M.peri += 16 * L; } },
    pe:            { label: 'Massive pulmonary embolism', group: 'Circulation', sev: 0.8, ton: 30, toff: 600, actions: [{ id: 'lyse', label: 'Thrombolysis' }],
                     fx(L, M) { M.pvr *= 1 + 5 * L; M.ctR *= 1 - 0.35 * L; M.ds += 0.3 * L; M.shunt += 0.1 * L; } },
    ardsWorsening: { label: 'Worsening lung injury (ARDS)', group: 'Airway & ventilator', sev: 0.7, ton: 240, toff: 600, actions: [],
                     fx(L, M) { M.shunt += 0.4 * L; M.compliance *= 1 - 0.4 * L; M.ds += 0.12 * L; } },
    bronchospasm:  { label: 'Bronchospasm', group: 'Airway & ventilator', sev: 0.7, ton: 60, toff: 90, actions: [],
                     fx(L, M) { M.spasm += 35 * L; M.vq += 0.15 * L; } },
    ettObstruction:{ label: 'ETT obstruction', group: 'Airway & ventilator', sev: 0.6, ton: 5, toff: 3, actions: [{ id: 'suction', label: 'Suction / change tube' }],
                     fx(L, M) { M.rawAdd += L >= 0.95 ? 600 : 50 * L; } },
    mainstem:      { label: 'Right main-bronchus intubation', group: 'Airway & ventilator', sev: 1, ton: 2, toff: 3, actions: [{ id: 'withdraw', label: 'Withdraw tube 2 cm' }],
                     fx(L, M) { M.compliance *= 1 - 0.45 * L; M.shunt += 0.3 * L; M.rawAdd += 3 * L; } },
    oesophageal:   { label: 'Oesophageal intubation', group: 'Airway & ventilator', sev: 1, ton: 1, toff: 1, actions: [{ id: 'reintubate', label: 'Re-intubate' }], airway: true,
                     fx(L, M) { if (L > 0.5) M.airway = 'esophageal'; } },
    disconnection: { label: 'Circuit disconnection', group: 'Airway & ventilator', sev: 1, ton: 1, toff: 1, actions: [{ id: 'reconnect', label: 'Reconnect circuit' }], airway: true,
                     fx(L, M) { if (L > 0.5) M.airway = 'disconnected'; } },
    extubation:    { label: 'Unplanned extubation', group: 'Airway & ventilator', sev: 1, ton: 1, toff: 1, actions: [{ id: 'reintubate', label: 'Re-intubate' }], airway: true,
                     fx(L, M) { if (L > 0.5) M.airway = 'extubated'; } },
  };

  class Events {
    constructor(sim) { this.sim = sim; this.list = []; this.n = 0; }

    // One live instance per event type: starting it again just changes the severity.
    start(id, sev) {
      const E = R.EVENTS[id];
      if (!E) return null;
      const s = U.clamp(sev != null ? +sev : E.sev, 0.05, 1);
      const live = this.list.find((e) => e.id === id && e.tEnd == null);
      if (live) { live.sev = s; return live.uid; }
      const ev = { uid: id + '-' + (++this.n), id, sev: s, t0: this.sim.t, tEnd: null, L: 0 };
      this.list.push(ev);
      return ev.uid;
    }
    // End an event by type or uid (instructor "end event").
    resolve(key) {
      let n = 0;
      for (const e of this.list) if ((e.id === key || e.uid === key) && e.tEnd == null) { e.tEnd = this.sim.t; n++; }
      return n;
    }
    // A treatment action resolves every live event it applies to; returns how many it fixed.
    action(actionId) {
      let n = 0;
      for (const e of this.list) {
        if (e.tEnd != null) continue;
        if ((R.EVENTS[e.id].actions || []).some((a) => a.id === actionId)) { e.tEnd = this.sim.t; n++; }
      }
      return n;
    }

    step(dt) {
      for (const e of this.list) {
        const E = R.EVENTS[e.id], on = e.tEnd == null;
        e.L += ((on ? e.sev : 0) - e.L) * (1 - Math.exp(-dt / (on ? E.ton : E.toff)));
      }
      if (this.list.length) this.list = this.list.filter((e) => e.tEnd == null || e.L > 0.004);
    }

    apply(M, drugs) {
      const F = { bleed: 0, leak: 0 };
      for (const e of this.list) R.EVENTS[e.id].fx(e.L, M, F, { drugs, elapsed: this.sim.t - e.t0 });
      return F;
    }

    summary() {
      return this.list.map((e) => {
        const E = R.EVENTS[e.id];
        return { uid: e.uid, id: e.id, label: E.label, level: e.L, sev: e.sev, elapsed: this.sim.t - e.t0, ending: e.tEnd != null, actions: E.actions || [] };
      });
    }

    // times travel as ages: every screen's simulation clock started at a different moment
    export() {
      const t = this.sim.t;
      return { n: this.n, list: this.list.map((e) => ({ uid: e.uid, id: e.id, sev: e.sev, L: e.L, age: t - e.t0, endAge: e.tEnd == null ? null : t - e.tEnd })) };
    }
    import(s) {
      if (!s) return;
      const t = this.sim.t;
      this.n = s.n || 0;
      this.list = (s.list || []).map((e) => ({ uid: e.uid, id: e.id, sev: e.sev, L: e.L, t0: t - e.age, tEnd: e.endAge == null ? null : t - e.endAge }));
    }
  }
  R.Events = Events;
})((function (g) { return g.ResusEngine || (g.ResusEngine = {}); })(typeof globalThis !== 'undefined' ? globalThis : this));
