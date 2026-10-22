/* Concatenate src/*.js (in numeric order) into dist/resus-engine.js — one classic
 * <script> that defines window.ResusEngine. Run: node build.js */
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src');
const files = fs.readdirSync(dir).filter((n) => /^\d\d-.*\.js$/.test(n)).sort();
const header = '/* RESUS Sim v2 engine — built ' + new Date().toISOString() + ' from ' + files.join(', ') + '\n' +
  ' * TRAINING SIMULATION — NOT A MEDICAL DEVICE · NOT FOR CLINICAL USE. Do not edit; edit src/ and rebuild. */\n';
const out = header + files.map((f) => '\n/* ---- ' + f + ' ---- */\n' + fs.readFileSync(path.join(dir, f), 'utf8')).join('');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'resus-engine.js'), out);
console.log('dist/resus-engine.js', out.length, 'bytes from', files.length, 'files');
