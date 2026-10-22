const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(process.argv[2], 'utf8');

// 1. All four bundler script tags still present
for (const t of ['manifest','ext_resources','page_order','template']) {
  const present = html.indexOf('<script type="__bundler/'+t+'">') !== -1;
  if (!present) { console.error('MISSING bundler script:', t); process.exit(1); }
}

// 2. Extract + JSON.parse the template payload exactly as the runtime would
const startTag = '<script type="__bundler/template">';
const i = html.indexOf(startTag) + startTag.length;
const end = html.indexOf('</script>', i);
const payload = html.slice(i, end).trim();
let template;
try { template = JSON.parse(payload); }
catch (e) { console.error('template JSON.parse FAILED:', e.message); process.exit(1); }
console.log('template parsed OK, length', template.length);

// 3. Manifest still parses and asset count intact
const mStart = html.indexOf('<script type="__bundler/manifest">') + '<script type="__bundler/manifest">'.length;
const mEnd = html.indexOf('</script>', mStart);
const manifest = JSON.parse(html.slice(mStart, mEnd).trim());
console.log('manifest assets:', Object.keys(manifest).length);

// 4. Extract app script and syntax-check via vm.compileFunction (no execution)
const m = template.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.error('app script not found in template'); process.exit(1); }
try { new vm.Script(m[1]); console.log('app script syntax OK'); }
catch (e) { console.error('app script SYNTAX ERROR:', e.message); process.exit(1); }

// 5. Feature checks
const checks = {
  'disclaimer banner': /Training simulation — not a medical device/,
  'home disclaimer': /For training and education only/,
  'flow pattern chips (logic)': /flowPatChips/,
  'flow pattern card (markup)': /Inspiratory flow pattern/,
  'insp pause param': /vPause:\s*\{ label:'Insp\. pause'/,
  'decel model branch': /pat==='decel'/,
  'Ti display': /Ti \{\{ tiDisp \}\}s/,
  'PS trigger notch': /TRIGDIP/,
  'expiration held at PEEP comment': /expiration held at set PEEP/,
};
let ok = true;
for (const [name, re] of Object.entries(checks)) {
  const found = re.test(template);
  console.log((found?'  ok  ':' MISS ')+name);
  if (!found) ok = false;
}
process.exit(ok ? 0 : 1);
