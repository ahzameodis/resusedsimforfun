const fs = require('fs');
const path = require('path');

const origPath = process.argv[2];          // main bundle HTML to update
const templatePath = process.argv[3];       // modified template.html

const orig = fs.readFileSync(origPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');

const startTag = '<script type="__bundler/template">';
const idx = orig.indexOf(startTag);
if (idx < 0) { console.error('template tag not found'); process.exit(1); }
const i = idx + startTag.length;
const end = orig.indexOf('</script>', i);   // real closing tag (payload has none, it is escaped)
if (end < 0) { console.error('closing tag not found'); process.exit(1); }

// Serialize the template as a JSON string, then neutralize every </script>
// so it cannot close the outer bundler <script> tag. / is the escaped
// solidus: valid JSON (parses back to "/") and invisible to the HTML parser.
let serialized = JSON.stringify(template);
serialized = serialized.split('</script>').join('<\\u002Fscript>');

if (serialized.indexOf('</script>') !== -1) {
  console.error('bare </script> remains!'); process.exit(1);
}

const out = orig.slice(0, i) + '\n' + serialized + '\n  ' + orig.slice(end);
fs.writeFileSync(origPath, out);
console.log('Wrote', origPath);
console.log('old size', orig.length, '-> new size', out.length);
