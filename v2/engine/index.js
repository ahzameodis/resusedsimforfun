/* Node entry: load the engine modules in order and export the namespace.
 * The browser uses dist/resus-engine.js instead (same code, concatenated by build.js). */
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src');
for (const f of fs.readdirSync(dir).filter((n) => /^\d\d-.*\.js$/.test(n)).sort()) require(path.join(dir, f));
module.exports = globalThis.ResusEngine;
