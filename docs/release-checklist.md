---
title: Release checklist
---

# Release checklist — Jagga Napi

Everything below needs your own logins (GitHub, Expo/EAS, AdMob, Google Play Console), so do these
steps yourself in order. Commands run from the project root. `npx eas-cli@latest` works without a global
install.

## 0. Before anything

- [ ] `npm ci && npm run check` passes (lint, types, tests).
- [ ] `node scripts/check-listing.js` passes.

## 1. GitHub repo + privacy policy site

1. [ ] Create a **public** repo `jagga-napi` under the GitHub account **suryanshuverma0**. The privacy URL
       `https://suryanshuverma0.github.io/jagga-napi/privacy` depends on this exact owner and name.
2. [ ] Push:
   ```sh
   git remote add origin https://github.com/suryanshuverma0/jagga-napi.git
   git push -u origin main
   ```
3. [ ] GitHub → repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch **main**, folder
       **/docs** → Save.
4. [ ] After about a minute, open https://suryanshuverma0.github.io/jagga-napi/privacy and check that the
       policy loads (it redirects to `/privacy/`). Internal docs (PLAN, DECISIONS, checklists) are excluded
       by `docs/_config.yml`.

## 2. AdMob (real ad IDs)

1. [ ] https://admob.google.com → **Apps → Add app** → Android → "Is the app listed on a supported app
       store?" **No** (for now) → name "Jagga Napi". Copy the **App ID** (`ca-app-pub-…~…`).
2. [ ] In that app, create three ad units and copy each ID:
   - **Banner** (it's adaptive in code; any banner unit works)
   - **Interstitial**
   - **Rewarded**: reward name "watermark-free share", amount 1
3. [ ] **Privacy & messaging**: create and **publish** a **European regulations (GDPR)** message and a
       **US state regulations** message for this app. The in-app consent form (UMP) only appears once these
       are published.
4. [ ] **Blocking controls → Sensitive categories**: optionally block dating, gambling and politics so ads
       match a land/property tool. The code already caps content at rating "T".
5. [ ] **app-ads.txt**: run `ADMOB_APP_ID=<App ID> npm run app-ads` and put the printed line in
       `https://suryanshuverma.com.np/app-ads.txt` (template: `docs/app-ads.txt`). The website must be the
       same one entered as the developer website on Play.
6. [ ] Once the Play listing is live: AdMob → App settings → **Link to app store** → pick the Play listing.

## 3. EAS project and secrets

1. [ ] `npx eas-cli@latest login`
2. [ ] `npx eas-cli@latest init`. It prints a project ID. Because the config is dynamic (`app.config.ts`),
       paste it into `extra.eas.projectId` in place of `process.env.EAS_PROJECT_ID`, then commit.
3. [ ] Store the AdMob IDs as EAS environment variables for the **production** environment. Use
       visibility **sensitive**: the App ID ends up inside the APK anyway, and sensitive (unlike secret)
       values can be read when eas-cli evaluates the config.
   ```sh
   npx eas-cli@latest env:create --environment production --visibility sensitive --name ADMOB_APP_ID --value "ca-app-pub-…~…"
   npx eas-cli@latest env:create --environment production --visibility sensitive --name ADMOB_BANNER_ID --value "ca-app-pub-…/…"
   npx eas-cli@latest env:create --environment production --visibility sensitive --name ADMOB_INTERSTITIAL_ID --value "ca-app-pub-…/…"
   npx eas-cli@latest env:create --environment production --visibility sensitive --name ADMOB_REWARDED_ID --value "ca-app-pub-…/…"
   ```
   Don't set them for `development` or `preview`; those builds use Google's test IDs automatically.
4. [ ] Release guard: a `production` build **fails on the EAS worker** if any of the four is missing or is
       a Google test ID (`config/ad-ids.js`). To check locally with the real values exported:
       `JAGGA_STRICT_AD_GUARD=1 EAS_BUILD_PROFILE=production npx expo config --type public`.

## 4. Test on your phone

1. [ ] Dev build: `npx eas-cli@latest build -p android --profile development`, install the APK from the
       link, then `npm start` on the same Wi-Fi and open it in the dev build.
2. [ ] Preview APK (a release build with test ads) for friends:
       `npx eas-cli@latest build -p android --profile preview`.
3. [ ] On a **2 GB RAM phone**, measure cold start (target < 2 s):
   ```sh
   adb shell am force-stop com.suryanshuverma.jagganapi
   adb shell am start -W -n com.suryanshuverma.jagganapi/.MainActivity
   ```
   Read `TotalTime`, take the median of 5 runs, and use the preview (release) build, not the dev build.
4. [ ] Manual checks: largest system font size, TalkBack on Converter and Plot, dark mode, Nepali +
       Devanagari numbers, back button with unsaved input, share to Viber/WhatsApp/Messenger, rewarded ad,
       no ads on onboarding or while the keyboard is open.

## 5. Production build

1. [ ] `npx eas-cli@latest build -p android --profile production`. This produces an AAB, and EAS
       auto-increments `versionCode` (`appVersionSource: remote`). Signing is EAS-managed: let EAS generate
       the upload keystore the first time, and keep **Play App Signing** on in Play Console.
2. [ ] **Size budget (< 25 MB AAB):** check the AAB size on the EAS build page. Release builds ship ARM
       ABIs only (armeabi-v7a, arm64-v8a) with R8 minify and resource shrinking. If it's over budget, check
       Play Console → **App bundle explorer** for the per-device download size and tell me the numbers.

## 6. Google Play Console

1. [ ] **Create app**: name "Jagga Napi: Ropani Calculator", default language English (US), **App**,
       **Free**, accept the declarations.
2. [ ] **Store listing** from `docs/store-listing.md` (en-US + ne-NP translation), icon
       `store/play-icon-512.png`, feature graphic `store/feature-graphic-1024x500.png`, 8 screenshots
       (`docs/screenshots.md`). Category **Tools**, email, website.
3. [ ] **App content**:
   - Privacy policy: `https://suryanshuverma0.github.io/jagga-napi/privacy/`
   - **Ads: Yes, my app contains ads**
   - App access: **All functionality is available without special access**
   - Content rating (IARC questionnaire): category **Utility, Productivity, Communication or Other**.
     Answer **No** to violence, sexuality, language, controlled substances, gambling, user-to-user
     communication/interaction, sharing location, and digital purchases. The expected result is
     Everyone / PEGI 3 / IARC 3+. Ads don't change the rating.
   - **Target audience: 18 and over only.** "Could the app unintentionally appeal to children?" **No**.
   - Data safety: exactly as in `docs/data-safety.md`
   - Advertising ID: **Yes**, for advertising and analytics
   - Government apps: **No**, not developed by or for a government. The non-affiliation disclaimer
     is already in both descriptions and in the app (Settings, Reference and every shared image).
   - Financial features: **My app doesn't provide any financial features** (price arithmetic only)
   - Health, News, COVID-19: not applicable
4. [ ] **Internal testing** track: create a release and upload the first AAB **manually** in the
       console (Google requires one manual upload before API/EAS Submit uploads work). Add yourself as a
       tester and install from the opt-in link.
5. [ ] (Optional) For `eas submit`: create a Google Cloud service account with Play Console access, upload
       its JSON key in EAS (`npx eas-cli@latest credentials`), then run
       `npx eas-cli@latest submit -p android --profile production` (it uploads a draft to **internal**).

## 7. Closed testing (required for new personal accounts)

- [ ] Create a **Closed testing** track with a Google Group or email list of **at least 12 testers**.
- [ ] Every tester must stay **opted in continuously for 14 days**. Someone who opts out and back in
      restarts their 14 days, and people who leave early don't count. Recruit 15–20 to keep a margin.
      (Source: Play Console Help, "App testing requirements for new personal developer accounts".)
- [ ] Ask testers to actually use it (convert, plot, share) and collect feedback, because Google asks
      about the test when you apply.
- [ ] Day 15 or later: Dashboard → **Apply for production** and answer the questions about the test.
      Review usually takes up to 7 days.

## 8. Pre-launch report

- [ ] Play Console → Testing → **Pre-launch report** for the latest closed/production AAB. Fix any crash,
      ANR or accessibility warning (touch targets, contrast, missing labels) before production. Screenshots
      from the robot runs show ads in test mode; that's expected.

## 9. Production rollout

1. [ ] Production → Create release → reuse the tested AAB → release notes in English and Nepali.
2. [ ] **Staged rollout 20%**. Watch Android vitals (crash rate < 1.09%, ANR rate < 0.47%) and reviews for
       2–3 days.
3. [ ] Increase to **100%**.
4. [ ] Link the AdMob app to the live Play listing (step 2.6) and check app-ads.txt shows as verified in
       AdMob after about 24 h.

## For every update

- [ ] Bump `version` in `app.config.ts` for user-visible releases (versionCode is automatic).
- [ ] `npm run check`, `npm run licenses` if dependencies changed, `node scripts/check-listing.js`.
- [ ] Production build → internal test → staged rollout.
- [ ] Keep `targetSdkVersion` at Google Play's current requirement (API 36 since 31 Aug 2026; check
      https://developer.android.com/google/play/requirements/target-sdk each year).
