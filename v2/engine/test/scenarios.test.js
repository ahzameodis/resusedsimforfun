/* Every preset in the scenario library settles inside its own expected ranges. */
'use strict';
const test = require('node:test');
const { R, within } = require('./helpers');
const { runScenario } = require('../tools/report');

for (const sc of R.SCENARIOS) {
  test(`scenario ${sc.id} — ${sc.label}`, () => {
    const r = runScenario(sc);
    for (const x of r.rows) within(x.val, x.lo, x.hi, x.key);
  });
}
