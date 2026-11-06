---
title: Plan
---

# Jagga Napi — build plan

App: **Jagga Napi: Ropani Calculator** (`com.suryanshuverma.jagganapi`). An offline Nepal land unit converter
and plot area calculator, monetised with AdMob only.

## Platform facts checked on 2026-11-06

| Item | Value | Source |
| --- | --- | --- |
| Expo SDK | **58** (`expo@58.0.23`) | `npm view expo dist-tags` |
| React Native / React | 0.88.1 / 19.3.0 | Expo SDK 58 reference page |
| New Architecture | Always on (cannot be disabled since SDK 55) | docs.expo.dev/guides/new-architecture |
| Android min | Android 7+ (Expo SDK 58) | docs.expo.dev/versions/v58.0.0 |
| compileSdk / targetSdk | 37 / **36** | Expo SDK 58 defaults; pinned explicitly via `expo-build-properties` |
| Google Play target API | **API 36 (Android 16)** required for new apps and updates from 2026-08-31 | developer.android.com/google/play/requirements/target-sdk |

## Chosen libraries (exact installed versions)

| Purpose | Library | Version |
| --- | --- | --- |
| Framework | expo | 58.0.23 |
| Routing | expo-router (JS tabs via `expo-router/js-tabs`) | 58.0.30 |
| Drawings | react-native-svg | 15.16.0 |
| Storage | react-native-mmkv (+ react-native-nitro-modules) | 4.3.2 (+0.37.2) |
| Decimal maths | decimal.js-light | 2.5.1 |
| Ads + UMP consent | react-native-google-mobile-ads | 17.4.0 |
| Image capture / share | react-native-view-shot / expo-sharing | 6.1.1 / 58.0.22 |
| Clipboard | expo-clipboard | 58.0.4 |
| Review prompt | expo-store-review | 58.0.2 |
| Locale detection | expo-localization | 58.0.5 |
| Fonts (embedded at build time) | expo-font plugin + Mukta (OFL) from @expo-google-fonts/mukta | 58.0.11 / 0.4.1 |
| Native build config | expo-build-properties, expo-system-ui, expo-splash-screen | 58.x |
| Dev build | expo-dev-client | 58.0.18 |
| Tests | jest + jest-expo | 30.5.2 / 58.0.14 |
| Lint / format | eslint 9 (flat) + eslint-config-expo + prettier 3 | 9.39.5 / 58.0.4 / 3.9.10 |

## Architecture

```
src/
  app/                  expo-router routes only
    _layout.tsx         providers, root Stack, error boundary
    onboarding.tsx      first-launch language/system pick (no ads)
    (tabs)/_layout.tsx  Convert · Plot · Tools · History · More
    (tabs)/index.tsx    Converter (home)
    (tabs)/plot.tsx     Plot area calculator
    (tabs)/tools.tsx    Hub → price / divide / arithmetic
    (tabs)/history.tsx  Saved calculations
    (tabs)/more.tsx     Settings
    price.tsx divide.tsx arithmetic.tsx reference.tsx licenses.tsx
  units/                unit definitions, conversion, compound format/parse (pure TS)
  math/                 geometry, price, division, arithmetic, number formatting (pure TS)
  i18n/                 en/ne strings, numerals, Nepali grouping
  storage/              KV abstraction, versioned schema + migrations, history repo
  state/                settings context
  ads/                  consent, banner, interstitial pacing, rewarded, IDs
  share/                share-card model → text, image capture
  components/           UI building blocks (AreaInput, AreaResults, PlotPreview …)
  theme/                colours, typography, spacing
```

Rules: `src/units` and `src/math` import nothing from React or React Native. Every area is a `Decimal` of square
feet (40 significant digits); rounding happens only in display formatters.

## Milestones

| # | Scope | Gate |
| --- | --- | --- |
| M1 | Scaffold, theme, fonts, navigation, settings | lint + tsc |
| M2 | `src/units`, `src/math` with full Jest tests | all tests pass before any calculator UI |
| M3 | Converter + compound input/output | lint, tsc, tests |
| M4 | Plot calculator + SVG preview | ″ |
| M5 | Price, divide, arithmetic | ″ |
| M6 | History + share as image / text | ″ |
| M7 | Ads, UMP consent, release guard | ″ |
| M8 | Accessibility, error boundary, back guard, review prompt | ″ |
| M9 | Icon/graphics, EAS config, store listing, privacy, data safety, checklist, README | ″ |

## Verification limits on this machine

There is no Android SDK or JDK on the build machine, so native builds, the 25 MB AAB budget and the 2 s cold-start
budget can only be measured on an EAS build and a real phone. The levers used to hit them are listed in
DECISIONS.md and the measuring steps are in release-checklist.md.
