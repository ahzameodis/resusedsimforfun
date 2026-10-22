'use strict';
const assert = require('node:assert/strict');
const R = require('..');

const sim = (params, opts) => new R.Sim(params || {}, Object.assign({ seed: 3 }, opts));
const merge = (...objs) => objs.reduce((a, b) => R.util.deepMerge(a, R.util.clone(b || {})), {});
const scenario = (id, extra) => merge(R.scenario(id).params, extra);

// Record sample channels for `seconds`.
function record(s, seconds, keys) {
  const out = { t: [] };
  for (const k of keys) out[k] = [];
  s.step(seconds, (x) => { out.t.push(x.t); for (const k of keys) out[k].push(x[k]); });
  return out;
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };
const cv = (a) => sd(a) / mean(a);

function within(v, lo, hi, label) {
  assert.ok(v != null && !Number.isNaN(v) && v >= lo && v <= hi, `${label} = ${v == null ? v : (+v).toFixed(2)}, expected ${lo}–${hi}`);
}

// Steady-state vitals after `seconds` (default 40) of simulated time.
const settle = (params, seconds, opts) => { const s = sim(params, opts); s.run(seconds == null ? 40 : seconds); return s; };

// Mechanical beats recorded in the last `window` seconds.
const recentBeats = (s, window) => s.beats.filter((b) => b.mech && s.t - b.t <= window);

module.exports = { R, assert, sim, merge, scenario, record, mean, sd, cv, within, settle, recentBeats };
