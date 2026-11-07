#!/usr/bin/env node
// Writes src/generated/licenses.json: the licence of every runtime dependency (direct and
// transitive, as resolved in node_modules) plus bundled assets that are not npm packages.
// Run with `npm run licenses` after changing dependencies.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function readPkg(name, fromDir) {
  let dir = fromDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', name, 'package.json');
    if (fs.existsSync(candidate))
      return { json: JSON.parse(fs.readFileSync(candidate, 'utf8')), dir: path.dirname(candidate) };
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const seen = new Map();
function walk(name, fromDir) {
  if (seen.has(name)) return;
  const found = readPkg(name, fromDir);
  if (!found) return;
  const { json, dir } = found;
  const license = typeof json.license === 'string' ? json.license : (json.license?.type ?? 'See package');
  const repo = typeof json.repository === 'string' ? json.repository : json.repository?.url;
  seen.set(name, {
    name,
    version: json.version,
    license,
    url: (json.homepage || repo || `https://www.npmjs.com/package/${name}`)
      .replace(/^git\+/, '')
      .replace(/\.git$/, ''),
  });
  for (const dep of Object.keys(json.dependencies ?? {})) walk(dep, dir);
}

// Preferred: exactly the packages Metro put in the Android bundle (from its source map).
// Fallback: every runtime dependency, recursively (over-reports build tooling).
function bundledPackages() {
  const dir = path.join(root, 'scripts', 'out', '_expo', 'static', 'js', 'android');
  if (!fs.existsSync(dir)) return null;
  const mapFile = fs.readdirSync(dir).find((f) => f.endsWith('.map'));
  if (!mapFile) return null;
  const { sources } = JSON.parse(fs.readFileSync(path.join(dir, mapFile), 'utf8'));
  const names = new Set();
  for (const s of sources) {
    const m = s.replace(/\\/g, '/').match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//g);
    if (!m) continue;
    const last = m[m.length - 1].replace(/^node_modules\//, '').replace(/\/$/, '');
    names.add(last);
  }
  return names;
}

const bundled = bundledPackages();
if (bundled) {
  for (const name of bundled) {
    const found = readPkg(name, root);
    if (found) walkOne(name, found);
  }
} else {
  console.warn('No bundle source map in scripts/out; listing all runtime dependencies instead.');
  for (const name of Object.keys(pkg.dependencies)) walk(name, root);
}

function walkOne(name, { json }) {
  const license = typeof json.license === 'string' ? json.license : (json.license?.type ?? 'See package');
  const repo = typeof json.repository === 'string' ? json.repository : json.repository?.url;
  seen.set(name, {
    name,
    version: json.version,
    license,
    url: (json.homepage || repo || `https://www.npmjs.com/package/${name}`)
      .replace(/^git\+/, '')
      .replace(/\.git$/, ''),
  });
}

const assets = [
  {
    name: 'Mukta font (Ek Type)',
    version: '@expo-google-fonts/mukta ' + (readPkg('@expo-google-fonts/mukta', root)?.json.version ?? ''),
    license: 'OFL-1.1',
    url: 'https://fonts.google.com/specimen/Mukta',
  },
  {
    name: 'Material Icons (Google)',
    version: 'path data',
    license: 'Apache-2.0',
    url: 'https://github.com/google/material-design-icons',
  },
];

const out = [...assets, ...[...seen.values()].sort((a, b) => a.name.localeCompare(b.name))];
const target = path.join(root, 'src', 'generated', 'licenses.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${out.length} entries to ${path.relative(root, target)}`);
