---
title: Screenshots
---

# Play Store screenshots

Eight phone screenshots, portrait, 1080 × 1920 or larger (Play: 16:9 or 9:16, each side 320–3840 px).
Upload the Nepali-captioned set to the **ne-NP** listing and the same shots with English captions to
**en-US**.

## Getting realistic data (screenshot mode)

1. Install a **development** build (`eas build --profile development`, see README).
2. Open **More → Screenshot mode (debug)**. It only exists in debug builds (`__DEV__`) and adds 8
   realistic saved calculations to History: Bhaktapur kitta 512, Lalitpur Imadol ghaderi, a Pokhara
   four-sided plot, a Budhanilkantha price, a 3-brother inheritance split, a Janakpur khet in bigha, a
   parcel sum and a Dharan irregular plot.
3. Set **Language: नेपाली**, **Numbers: १२३** for the Nepali set and **English / 123** for the English set.
   Capture light mode for shots 1–7 and dark mode for shot 8.
4. Open each record from **History** to load its exact inputs, then capture with the phone's screenshot
   button. Turn off the status-bar clutter first (Android: Developer options → System UI demo mode).

The seed is defined in `src/debug/screenshotSeed.ts`, and a test checks that every seed evaluates to a valid
area.

## Shot list

| #   | Screen and state                                                     | Nepali caption                                     | English caption                                            |
| --- | -------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Converter, Ropani quick entry `2-5-3-1.6`, results visible           | रोपनी-आना-पैसा-दाम लेख्नुहोस्, सबै एकाइमा तुरुन्तै | Type ropani-aana-paisa-daam, see every unit instantly      |
| 2   | Converter, Bigha system, record "जनकपुर खेत" (2-5-10)                | तराईको बिघा-कट्ठा-धुर पनि                          | Terai bigha-kattha-dhur too                                |
| 3   | Plot, four sides, record "पोखरा लेकसाइड प्लट", drawing + total       | फित्ताले नापेको जग्गाको क्षेत्रफल, नक्सासहित       | Plot area from tape measurements, with a to-scale drawing  |
| 4   | Plot, irregular, record "Dharan jagga (3 triangles)"                 | अमिनले जस्तै त्रिभुजमा बाँडेर नाप्नुहोस्           | Split irregular land into triangles, like a surveyor       |
| 5   | Price, record "Budhanilkantha 4 aana", total and words               | प्रति आना दरबाट जम्मा मूल्य, लाख-करोडमा            | Total land price from the rate per aana, in lakh and crore |
| 6   | Divide, record "पैतृक सम्पत्ति — ३ दाजुभाइ", shares + remainder note | अंश बण्डा: बराबर वा अनुपातमा, एक धुर पनि नहराई     | Divide land equally or by ratio, nothing lost              |
| 7   | Share sheet preview for shot 3's plot                                | Viber, WhatsApp मा सफा फोटो सेयर गर्नुहोस्         | Share a clean result image on Viber and WhatsApp           |
| 8   | History list (dark mode)                                             | सुरक्षित हिसाब, अँध्यारो रङमा पनि                  | Saved calculations, with dark mode                         |

## Framing (optional)

Captions can be added above each screenshot on a 1080 × 2160 canvas in brand green `#1B6B4A` with white
Mukta Bold text. Keep the disclaimer out of screenshots. It is already in the description, and the share
card in shot 7 shows its one-line version.

Don't show real people's names, real kitta (plot) numbers tied to real owners, or any government logo.
The seed uses generic place names only.
