#!/usr/bin/env node
// Checks docs/store-listing.md against Google Play's length limits and required search terms.
// Play counts characters (Unicode code points), so Devanagari is counted per code point.
const fs = require('fs');
const path = require('path');

const md = fs.readFileSync(path.join(__dirname, '..', 'docs', 'store-listing.md'), 'utf8');
const block = (tag) => {
  const m = md.match(new RegExp('```' + tag + '\\n([\\s\\S]*?)\\n```'));
  if (!m) throw new Error(`Missing block ${tag}`);
  return m[1];
};
const limits = { title: 30, short: 80, full: 4000 };
let ok = true;
for (const lang of ['en', 'ne']) {
  for (const [kind, max] of Object.entries(limits)) {
    const text = block(`${kind}-${lang}`);
    const len = [...text].length;
    const pass = len <= max;
    ok = ok && pass;
    console.log(`${pass ? 'OK  ' : 'FAIL'} ${kind}-${lang}: ${len}/${max}`);
  }
}
const all = ['en', 'ne'].flatMap((l) => ['title', 'short', 'full'].map((k) => block(`${k}-${l}`))).join('\n');
const terms = [
  'ropani to aana',
  'jagga napi',
  'land calculator',
  'bigha kattha dhur',
  'ropani to sq ft',
  'जग्गा नापी',
  'रोपनी आना',
];
for (const term of terms) {
  const found = all.toLowerCase().includes(term.toLowerCase());
  ok = ok && found;
  console.log(`${found ? 'OK  ' : 'FAIL'} term "${term}"`);
}
const disclaimer = 'not affiliated with the Government of Nepal';
if (!block('full-en').includes(disclaimer)) {
  ok = false;
  console.log('FAIL disclaimer missing from full-en');
}
process.exit(ok ? 0 : 1);
