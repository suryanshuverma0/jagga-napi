#!/usr/bin/env node
// Turns an Expo web export into a self-hosted demo that works from any sub-path, including
// GitHub Pages (https://suryanshuverma0.github.io/jagga-napi/demo/).
//
// Usage:
//   npx expo export --platform web --output-dir dist-web
//   node scripts/make-web-demo.js dist-web docs/demo
//
// What it changes, and why:
//  - `_expo/` → `expo-static/`, leading "_" stripped from JS names: Jekyll (GitHub Pages) drops
//    files and folders that start with "_".
//  - `assets/node_modules/expo-router/assets/` → `assets/router/`: Jekyll excludes node_modules.
//  - Absolute chunk and asset paths become relative, and the chunk loader resolves them against
//    window.__JN_BASE__ (the demo's own folder) instead of the site root.
const fs = require('fs');
const path = require('path');

const [, , src, out] = process.argv;
if (!src || !out) {
  console.error('Usage: node scripts/make-web-demo.js <expo-web-export-dir> <out-dir>');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// JavaScript
const srcJs = path.join(src, '_expo', 'static', 'js', 'web');
const outJs = path.join(out, 'expo-static', 'js');
fs.mkdirSync(outJs, { recursive: true });
const rename = (name) => name.replace(/^_+/, '');
for (const f of fs.readdirSync(srcJs)) {
  let s = fs.readFileSync(path.join(srcJs, f), 'utf8');
  s = s.replace(/"\/_expo\/static\/js\/web\/_*/g, '"expo-static/js/');
  s = s.split('uri:"/assets/node_modules/expo-router/assets/').join('uri:"assets/router/');
  s = s
    .split('url:location.origin+location.pathname')
    .join('url:(globalThis.__JN_BASE__||location.origin+location.pathname)');
  fs.writeFileSync(path.join(outJs, rename(f)), s);
}

// Images used by expo-router (back arrow, etc.)
const srcAssets = path.join(src, 'assets', 'node_modules', 'expo-router', 'assets');
if (fs.existsSync(srcAssets)) fs.cpSync(srcAssets, path.join(out, 'assets', 'router'), { recursive: true });

// Page
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/src="\/_expo\/static\/js\/web\/([^"]+)"/g)].map(
  (m) => `expo-static/js/${rename(m[1])}`,
);
fs.writeFileSync(path.join(out, 'index.html'), page(scripts));
console.log(`Demo written to ${out} (${scripts.length} entry scripts)`);

function page(entryScripts) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Jagga Napi — web preview</title>
<meta name="description" content="Try Jagga Napi: ropani, aana, bigha, kattha, dhur converter and plot area calculator for Nepal.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700&display=swap">
<style>
  :root { --bg:#e9eee8; --frame:#16201a; --ink:#16201a; --muted:#4f5d55; --brand:#1b6b4a; --chip:#d9eee2;
          --font:'Mukta','Noto Sans Devanagari',system-ui,sans-serif; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#0b0f0d; --frame:#2a3630; --ink:#e7eee9; --muted:#a6b3ab; --brand:#63c99a; --chip:#1e3b2d; color-scheme:dark; }
  }
  html, body { height: 100%; margin: 0; }
  body { background: var(--bg); color: var(--ink); font-family: var(--font); overflow: hidden;
         display: flex; flex-direction: column; align-items: center; gap: 10px; box-sizing: border-box;
         padding: max(10px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
                  max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)); }
  .note { width: 100%; max-width: 420px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px;
          font-size: 13px; line-height: 1.4; color: var(--muted); }
  .note strong { color: var(--brand); font-size: 14px; }
  .chip { background: var(--chip); color: var(--ink); border-radius: 999px; padding: 0 8px; font-size: 12px; font-weight: 600; }
  .frame { flex: 1; min-height: 0; width: 100%; max-width: 420px; border: 6px solid var(--frame); border-radius: 28px;
           overflow: hidden; display: flex; background: var(--bg); box-sizing: border-box; }
  #root { display: flex; flex: 1; height: 100%; min-width: 0; }
  @media (max-width: 460px) { .frame { border-width: 0; border-radius: 14px; } }
</style>
</head>
<body>
<div class="note" role="note">
  <strong>Jagga Napi</strong><span class="chip">Web preview</span>
  <span>The real app running in your browser. Ads and image sharing work only in the Android app.</span>
</div>
<div class="frame"><div id="root"></div></div>
<script>
  // The app routes by URL path: remember where its files live, then start the router at "/".
  (function () {
    var dir = new URL('.', document.baseURI).href;
    window.__JN_BASE__ = dir;
    try { var b = document.createElement('base'); b.href = dir; document.head.appendChild(b); } catch (e) {}
    try { history.replaceState(history.state, '', '/'); } catch (e) {}
  })();
</script>
${entryScripts.map((s) => `<script src="${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}
