/* Build "ResusSim v2.html" in the project root.
 *
 * Takes v1's bundle ("ResusSim (1).html") as the base — its loader, libraries (React,
 * MQTT, QR), fonts and design system — then swaps in this folder's template.html +
 * app.js and adds the physiology engine (../engine/dist/resus-engine.js) as one more
 * gzip/base64 asset, loaded by the template exactly like the MQTT library.
 *
 *   node build.js        (from v2/app; run `node build.js` in ../engine first if src/ changed)
 *
 * v1 itself is only read, never modified.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const BASE = path.join(ROOT, 'ResusSim (1).html');
const OUT = path.join(ROOT, 'ResusSim v2.html');
const ENGINE = path.join(__dirname, '..', 'engine', 'dist', 'resus-engine.js');
const ENGINE_UUID = '5f3c2a9e-7b1d-4e8a-9c6f-2d4b8e1a7c30';   // referenced by template.html

const base = fs.readFileSync(BASE, 'utf8');
function block(open) {
  const a = base.indexOf(open);
  if (a < 0) throw new Error('base bundle is missing ' + open);
  const s = a + open.length, e = base.indexOf('</script>', s);
  return [s, e];
}

// 1. app source: syntax-check before anything is written
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
new vm.Script(app, { filename: 'app.js' });

// 2. template with the app inlined
let tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
if (!tpl.includes('//@@APP@@')) throw new Error('template.html lost its //@@APP@@ marker');
if (!tpl.includes(ENGINE_UUID)) throw new Error('template.html must load the engine: <script src="' + ENGINE_UUID + '">');
tpl = tpl.replace('//@@APP@@', () => app);

// 3. manifest + engine asset
const [ms, me] = block('<script type="__bundler/manifest">');
const manifest = JSON.parse(base.slice(ms, me));
const engine = fs.readFileSync(ENGINE);
manifest[ENGINE_UUID] = { mime: 'text/javascript', compressed: true, data: zlib.gzipSync(engine, { level: 9 }).toString('base64') };

// 4. splice. A closing script tag inside the template JSON would end the outer bundler
//    <script>, so it is written as </script> — still valid JSON, invisible to HTML.
const [ts, te] = block('<script type="__bundler/template">');
const templateJson = JSON.stringify(tpl).split('</script>').join('<\\u002Fscript>');
const head = base.slice(0, ms).replace('<title>ResusSim — Simulation Patient Monitor</title>', '<title>ResusSim v2 — Simulation Patient Monitor</title>');
const out = head + JSON.stringify(manifest) + base.slice(me, ts) + templateJson + base.slice(te);

// 5. verify the result parses back the way the runtime will read it
const check = (open) => { const a = out.indexOf(open) + open.length; return out.slice(a, out.indexOf('</script>', a)); };
const back = JSON.parse(check('<script type="__bundler/template">'));
if (back !== tpl) throw new Error('template did not round-trip');
const man2 = JSON.parse(check('<script type="__bundler/manifest">'));
if (!man2[ENGINE_UUID] || Object.keys(man2).length !== Object.keys(manifest).length) throw new Error('manifest did not round-trip');

fs.writeFileSync(OUT, out);
console.log(`${path.basename(OUT)}: ${(out.length / 1024).toFixed(0)} KB · ${Object.keys(man2).length} assets · engine ${(engine.length / 1024).toFixed(0)} KB · app ${(app.length / 1024).toFixed(0)} KB`);
