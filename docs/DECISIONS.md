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
- Brief's sanity value "1 ropani ≈ 508.72 m²" contradicts its own exact definitions (5,476 × 0.09290304 = 508.737 m² → 508.74). The app keeps the exact value; the test documents the discrepancy. 508.72 comes from using the rounded factor 0.0929.
- Switching input system carries the current value across (2 dp on the last compound part, 4 dp otherwise) instead of clearing the field — fewer retypes on a small phone.
- Compound input accepts "-", "/" or spaces as separators, and missing trailing parts count as 0 ("2-5" = 2 ropani 5 aana).
- Plot fields stay as text until each one parses, and "0" is reported as "must be more than zero" for the named field rather than as a generic triangle error.
- Division works in hundredths of daam/dhur (the display precision), rounds every share down except the last, and states the extra on the last share — sums always equal the displayed total.
- Share card is always light (white card, green band) regardless of app theme, so shared images look the same to every recipient; width fits the screen up to 400 dp.
- Dates on share cards/history use YYYY-MM-DD (AD) with localised digits. A Bikram Sambat date would be nicer but needs a BS calendar table, which I would have to source and verify — out of scope for v1.
- The "copy as text" output keeps the app-name line (the rewarded ad removes the watermark from images only, as the brief specifies).
- Back guard: tab screens confirm only when back would exit the app (other tabs keep state); stack screens use `usePreventRemove`. Saving a calculation clears the guard until the next edit.

## Accessibility and quality

- Every tappable element is ≥ 48 dp (buttons, segments, icon buttons, list rows ≥ 56 dp, number fields 56 dp); heights are `minHeight` so text scaling grows them instead of clipping.
- Errors always carry an icon and an "Error:" / "त्रुटि:" prefix and use `accessibilityRole="alert"` with a polite live region; invalid fields also get a thicker border and an icon, never colour alone.
- Copy actions announce "Copied" to screen readers as well as showing a toast.
- The licences screen lists exactly the 58 packages Metro bundles (derived from the bundle source map via `npm run licenses`), plus the Mukta font (OFL) and Material Icons (Apache-2.0).
- The Add/Subtract screen has no banner — the brief lists banners only on Converter, Plot, Price, Divide and History.
- Nepali "Save" button label is "सुरक्षित" (one word) so it fits on one line on 360 dp phones.

## Release

- Icon: an irregular surveyed-plot outline with "रो" inside and a saffron tape-measure dimension line under it, on brand green. No flag, emblem or map. Text is rendered with the bundled Mukta font in headless Chrome (`scripts/brand/render.js`) so Devanagari is shaped correctly; SVG sources are kept in `store/source/`.
- Adaptive icon art sits inside the central 60% (Android's safe zone is 66%), and the monochrome layer is a single-colour silhouette for Android 13+ themed icons.
- EAS `appVersionSource: "remote"` + `autoIncrement` on production: versionCode can never be reused by accident; `version` (user-facing) stays in app.config.ts.
- `eas submit` targets the **internal** track as a **draft**, so nothing reaches users without a manual promote.
- Release profiles build ARM ABIs only (armeabi-v7a, arm64-v8a) with R8 minify and resource shrinking, to stay under the 25 MB AAB budget; development keeps all ABIs for emulators. x86 Chromebooks generally run ARM apps through translation.
- Privacy page permalink is `/privacy/` (GitHub Pages redirects `/privacy` to it, so the URL in the brief works). Internal docs are excluded from the public site by `docs/_config.yml`.
- Privacy policy refers to "the developer of Jagga Napi" plus the website and email, rather than a personal name, which the brief does not give.
- Data safety: declares Approximate location (from IP), App interactions, Crash logs, Diagnostics and Device or other IDs as collected **and shared**, required, for advertising/analytics/fraud prevention. This is the conservative reading of Google's SDK disclosure page; reasons are in data-safety.md.
- Store listing uses "land calculator for Nepal" (natural English) rather than the exact phrase "land calculator nepal"; Play's search matches the words, and keyword-stuffed phrasing risks a metadata-policy rejection.
- Release notes, the IARC questionnaire answers and the "Government apps: No" declaration are written into the checklist because they need the Play Console login.

## Ads

- `BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER`: v17 deprecates `ANCHORED_ADAPTIVE_BANNER` in favour of this; it is still the anchored adaptive format the brief asks for.
- Consent (`AdsConsent.gatherConsent`) and SDK init run only after onboarding, so the very first screen is ad-free, as required.
- Request config: `maxAdContentRating: T`, `tagForChildDirectedTreatment: false`, `tagForUnderAgeOfConsent: false` (brief: not child-directed, 18+ audience).
- Interstitial only via `afterEngagement()` (save/share), skipped when the keyboard is visible, in session 1, or within 3 minutes of the last one; preloaded again after each show. No fill = silently nothing.
- When the review prompt fires (3rd save/share, ≤ once per 30 days) the interstitial is skipped for that engagement, so the user never gets two interruptions at once.
- Release guard lives in `config/ad-ids.js`: it throws on the EAS build worker (`EAS_BUILD=true`) for profile `production` if any ID is empty or from Google's sample publisher `ca-app-pub-3940256099942544`. Locally (where EAS "secret" variables are unreadable) it warns instead; `JAGGA_STRICT_AD_GUARD=1` makes it strict locally too.
- Development builds (`__DEV__`) always use Google test units even if real IDs are configured, so real ads are never requested while developing.
- `delayAppMeasurementInit`, `optimizeInitialization`, `optimizeAdLoading` enabled in the AdMob plugin — faster cold start on low-end phones.
- iOS is not shipped in v1; the plugin's `iosAppId` uses Google's sample iOS App ID only to satisfy the plugin.
- Web/test builds use `.web.tsx` stubs so React Native Web previews never load the ads SDK.
