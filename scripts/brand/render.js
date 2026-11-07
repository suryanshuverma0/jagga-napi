#!/usr/bin/env node
// Renders scripts/brand/designs.js to every PNG the app and the Play listing need.
// Usage: CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node scripts/brand/render.js
// (any Chromium works; on Linux/macOS point CHROME_PATH at chrome/chromium).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const designs = require('./designs');

const root = path.resolve(__dirname, '..', '..');
const fontDir = path.join(root, 'node_modules', '@expo-google-fonts', 'mukta');
const font = (w, file) =>
  `@font-face{font-family:Mukta;font-weight:${w};src:url(data:font/ttf;base64,${fs
    .readFileSync(path.join(fontDir, file))
    .toString('base64')}) format('truetype');}`;
const css =
  font(400, '400Regular/Mukta_400Regular.ttf') +
  font(500, '500Medium/Mukta_500Medium.ttf') +
  font(600, '600SemiBold/Mukta_600SemiBold.ttf') +
  font(700, '700Bold/Mukta_700Bold.ttf');

const outputs = [
  ['icon', 'assets/icon.png', 1024, 1024],
  ['foreground', 'assets/android-icon-foreground.png', 1024, 1024],
  ['backgroundLayer', 'assets/android-icon-background.png', 1024, 1024],
  ['monochrome', 'assets/android-icon-monochrome.png', 1024, 1024],
  ['splash', 'assets/splash-icon.png', 1024, 1024],
  ['icon', 'assets/favicon.png', 48, 48],
  ['icon', 'store/play-icon-512.png', 512, 512],
  ['icon', 'store/icon-48-preview.png', 48, 48],
  ['feature', 'store/feature-graphic-1024x500.png', 1024, 500],
];

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  for (const [key, file, w, h] of outputs) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const svg = designs[key].replace(
      /<svg ([^>]*)width="\d+" height="\d+"/,
      `<svg $1width="${w}" height="${h}"`,
    );
    await page.setContent(
      `<html><head><style>${css} html,body{margin:0;background:transparent}</style></head><body>${svg}</body></html>`,
    );
    await page.evaluate(() => document.fonts.ready);
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    await page.close();
    console.log(`${file} (${w}×${h})`);
  }
  for (const key of Object.keys(designs)) {
    fs.writeFileSync(path.join(root, 'store', 'source', `${key}.svg`), designs[key]);
  }
  await browser.close();
}

fs.mkdirSync(path.join(root, 'store', 'source'), { recursive: true });
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
