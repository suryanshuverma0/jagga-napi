#!/usr/bin/env node
// Prints the app-ads.txt line for https://suryanshuverma.com.np/app-ads.txt from ADMOB_APP_ID.
// Usage: ADMOB_APP_ID=ca-app-pub-1234567890123456~1234567890 npm run app-ads
// f08c47fec0942fa0 is Google's fixed certification-authority ID for AdMob entries.
const id = (process.env.ADMOB_APP_ID || '').trim();
const m = id.match(/^ca-app-pub-(\d{16})~\d+$/);
if (!m) {
  console.error('Set ADMOB_APP_ID to your real AdMob App ID (ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY).');
  process.exit(1);
}
if (m[1] === '3940256099942544') {
  console.error('That is Google’s sample (test) App ID. Use your own.');
  process.exit(1);
}
console.log(`google.com, pub-${m[1]}, DIRECT, f08c47fec0942fa0`);
