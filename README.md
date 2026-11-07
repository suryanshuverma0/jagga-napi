# Jagga Napi: Ropani Calculator

An offline Android app for Nepal: land unit converter (Ropani / Bigha systems, sq ft, m², acre, hectare),
plot area calculator, land price, land division and parcel arithmetic, in Nepali and English.

- Expo SDK 58 · React Native 0.88 · TypeScript (strict) · Expo Router · MMKV · decimal.js-light · AdMob
- Package: `com.suryanshuverma.jagganapi` · Target API 36
- Docs: [plan](docs/PLAN.md) · [decisions](docs/DECISIONS.md) · [release checklist](docs/release-checklist.md)
  · [store listing](docs/store-listing.md) · [data safety](docs/data-safety.md) · [screenshots](docs/screenshots.md)

## Setup

Requires Node.js ≥ 22.13.

```sh
npm ci
npm run check        # ESLint + tsc --noEmit + Jest
```

## Project layout

```
src/app/          routes (Expo Router): tabs Convert · Plot · Tools · History · More; stack screens
src/units/        unit definitions (exact sq ft), conversions, compound R-A-P-D / B-K-D format & parse
src/math/         pure maths: Decimal setup, geometry (stable Heron), price, money words, division
src/calc/         evaluation of each calculator's inputs (pure)
src/share/        share-card model + text output (pure)
src/storage/      versioned MMKV storage, migrations, sanitisers
src/ads/          UMP consent, banner, interstitial pacing, rewarded (with .web stubs)
src/components/   UI building blocks
config/ad-ids.js  AdMob ID resolution + production release guard
scripts/          licences generator, listing checker, app-ads.txt line, brand renderer
docs/             GitHub Pages site (privacy policy) + project docs
store/            Play icon, feature graphic and their SVG sources
```

`src/units` and `src/math` must not import React or Expo (enforced by ESLint).

## Running on a phone

AdMob needs native code, so the app runs in a **development build**, not Expo Go.

```sh
npx eas-cli@latest build -p android --profile development   # once; install the APK from the link
npm start                                                    # then open the project in the dev build
```

With the Android SDK installed locally you can use `npm run android` instead.

Development builds always use Google's **test** ad units. In Settings, the debug-only **Screenshot mode**
fills History with realistic sample calculations.

Quick layout check without a phone: `npx expo export --platform web` renders the UI with React Native
Web (ads disabled via `.web.tsx` stubs; fonts fall back to system fonts).

## Tests

```sh
npm test             # all Jest suites
npm run test:watch
```

Covered: every function in `src/units` and `src/math` (including 1,000 bigha, 1 daam, degenerate
triangles and uneven splits), compound formatting and parsing, calculator evaluation, storage migrations
and corrupt-data recovery, share-card text, review and interstitial pacing, and the AdMob release guard.

## Building

| Profile     | Output                | Ads             | Command                                                     |
| ----------- | --------------------- | --------------- | ----------------------------------------------------------- |
| development | APK + dev client      | test            | `npx eas-cli@latest build -p android --profile development` |
| preview     | release APK           | test            | `npx eas-cli@latest build -p android --profile preview`     |
| production  | AAB, auto versionCode | real (required) | `npx eas-cli@latest build -p android --profile production`  |

Production builds read `ADMOB_APP_ID`, `ADMOB_BANNER_ID`, `ADMOB_INTERSTITIAL_ID` and `ADMOB_REWARDED_ID`
from the EAS **production** environment. The build fails if any is missing or is a Google test ID.

## Releasing

Follow [docs/release-checklist.md](docs/release-checklist.md): GitHub Pages, AdMob, EAS secrets,
production AAB, Play Console content declarations, a closed test with 12 testers for 14 days, the
pre-launch report, then a staged rollout from 20% to 100%.

## Regenerating assets

```sh
npm run licenses                      # open-source licence list from the actual bundle
CHROME_PATH=/path/to/chrome node scripts/brand/render.js   # icon, adaptive layers, splash, store art
node scripts/check-listing.js         # Play listing length limits + search terms
ADMOB_APP_ID=ca-app-pub-…~… npm run app-ads               # app-ads.txt line
```

## Disclaimer

Estimates for reference only. Official area is determined by the Survey Office (Napi Karyalaya) and Land
Revenue Office records. This app is not affiliated with the Government of Nepal.
