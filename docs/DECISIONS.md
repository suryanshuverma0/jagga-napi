---
title: Decisions
---

# Decisions log

One line per judgement call, with the reason.

## Platform and tooling

- Expo SDK 58 (latest stable on 2026-11-06), not a canary — stability for a production release.
- `targetSdkVersion` 36 and `compileSdkVersion` 37 pinned in `expo-build-properties` — Play requires API 36 since 2026-08-31; pinning stops a future SDK default from silently changing it.
- `react-dom@19.3.0` pinned as a dev-only peer — npm otherwise pulls 19.3.1, which conflicts with React 19.3.0 via expo-router's web-only Radix deps; it is never bundled into Android.
- `Tabs` imported from `expo-router/js-tabs` — the `expo-router` root export is deprecated in SDK 58.
- JS tabs, not native tabs — native tabs on Android need extra peers (`expo-symbols`) and offer no benefit here.
- `react-native-mmkv` v4 (Nitro) — works with Expo dev builds and the New Architecture; synchronous reads keep cold start fast.
- `decimal.js-light` at 40 significant digits — small (~12 kB), has `sqrt`, and avoids float drift.
- Mukta font, embedded at build time via the `expo-font` config plugin — it covers both Devanagari and Latin in one family, and embedding avoids an async font load at startup.
- Icons are hand-written SVG paths (Material Design Icons, Apache-2.0) rendered with react-native-svg instead of `@expo/vector-icons` — no icon font files in the bundle.
- `expo-localization` picks Nepali as the first-run language when the device locale is `ne`, otherwise English.

## Product and UX

- Tabs: Convert · Plot · Tools · History · More. Price, Divide and Add/Subtract live under Tools — five tabs is the readable maximum on a small phone.
- A short onboarding screen on first launch asks for the language and the region system (Ropani hills / Bigha Terai) — the default system matters more for Nepal than any other setting, and onboarding is ad-free as the brief requires.
- Plot lengths are decimal feet or metres only, with no feet + inches entry — the brief scopes it to "feet or metres"; noted as a v1.1 candidate.
- Amounts in words use numerals plus scale words ("1 करोड 23 लाख 45 हजार 678"), not fully spelt-out Nepali numbers — this is how prices are written in Nepali listings and on notices, and spelling out 1–99 in Nepali is irregular and error-prone.
- The price "in words" line rounds to whole rupees; the figure line keeps paisa (2 dp).
