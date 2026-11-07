---
title: Data safety answers
---

# Google Play Data safety — answers for Jagga Napi

Play Console → **App content → Data safety**. The answers cover the app's own code, which sends nothing
off the device, plus the Google Mobile Ads SDK (AdMob), which is the only network component.

Source for the SDK's behaviour: Google's
[Google Mobile Ads SDK Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure),
read 2026-11-07. It lists the data the SDK "collects and shares automatically for advertising, analytics,
and fraud prevention purposes": **IP address, user product interactions, diagnostic information, device
and account identifiers**, all "encrypted in transit using TLS". Google notes that the developer is
responsible for the final answers, so re-read that page before submitting in case the SDK has changed.

## Section 1: Data collection and security

| Question                                                              | Answer                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Does your app collect or share any of the required user data types?   | **Yes** (via the AdMob SDK)                                                                                                                                                                                                    |
| Is all of the user data collected by your app encrypted in transit?   | **Yes** (Google: TLS)                                                                                                                                                                                                          |
| Do you provide a way for users to request that their data is deleted? | **No**. The developer holds no user data. Saved calculations live only on the device and are deleted from History, by clearing app storage or by uninstalling. The advertising ID can be reset or deleted in Android settings. |

## Section 2: Data types

Tick **only** these. Everything else stays unticked: name, email, contacts, photos, files, messages,
precise location, financial info, health and so on. Saved calculations and settings never leave the
device, and on-device-only data is not "collected" under Play's definition.

| Play category → data type                     | Collected | Shared | Processed ephemerally? | Required or optional | Purposes                                                                        |
| --------------------------------------------- | --------- | ------ | ---------------------- | -------------------- | ------------------------------------------------------------------------------- |
| **Location → Approximate location**           | Yes       | Yes    | No                     | Required             | Advertising or marketing; Analytics; Fraud prevention, security, and compliance |
| **App activity → App interactions**           | Yes       | Yes    | No                     | Required             | Advertising or marketing; Analytics; Fraud prevention, security, and compliance |
| **App info and performance → Crash logs**     | Yes       | Yes    | No                     | Required             | Analytics; Fraud prevention, security, and compliance                           |
| **App info and performance → Diagnostics**    | Yes       | Yes    | No                     | Required             | Analytics; Fraud prevention, security, and compliance                           |
| **Device or other IDs → Device or other IDs** | Yes       | Yes    | No                     | Required             | Advertising or marketing; Analytics; Fraud prevention, security, and compliance |

Notes on judgement calls (also in DECISIONS.md):

- **Approximate location.** Google's page lists "IP address" and says it "may be used to estimate the
  general location of a device", but doesn't name a Play category. The app requests no location
  permission. Declaring Approximate location is the conservative, commonly used answer for AdMob apps.
- **Shared = Yes.** Google's page is headed "Data collected and shared automatically", and AdMob uses the
  data for its own advertising purposes, so it is not just a service provider acting for the developer.
- **Required.** Users can't turn ad data collection off inside the app. Consent choices exist only where
  UMP requires them, so "Required" is the accurate answer.

## Section 3: Other Play Console declarations that relate to data

| Item                                          | Answer                                                                                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advertising ID (App content → Advertising ID) | **Yes**, the app uses an advertising ID. Purpose: **Advertising or marketing** (and **Analytics**). AdMob's manifest merges `com.google.android.gms.permission.AD_ID`. |
| Ads (App content → Ads)                       | **Yes, my app contains ads**                                                                                                                                           |
| Privacy policy URL                            | https://suryanshuverma0.github.io/jagga-napi/privacy/                                                                                                                  |
| Account creation                              | The app has no accounts, so the account-deletion requirement does not apply.                                                                                           |
