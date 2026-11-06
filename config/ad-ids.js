// Shared by app.config.ts (build time) and Jest. Plain CommonJS so the Expo config loader
// can require it without a TypeScript transform.

/** Google's public AdMob sample publisher. Every official test ID belongs to it. */
const GOOGLE_TEST_PUBLISHER = 'ca-app-pub-3940256099942544';

/** Official Android test IDs: https://developers.google.com/admob/android/test-ads */
const GOOGLE_TEST_IDS = Object.freeze({
  appId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/9214589741',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
});

const ENV_KEYS = Object.freeze({
  appId: 'ADMOB_APP_ID',
  banner: 'ADMOB_BANNER_ID',
  interstitial: 'ADMOB_INTERSTITIAL_ID',
  rewarded: 'ADMOB_REWARDED_ID',
});

/** @param {string | undefined} id */
function isTestOrEmpty(id) {
  const value = (id ?? '').trim();
  return value === '' || value.startsWith(GOOGLE_TEST_PUBLISHER);
}

/**
 * Resolve the ad IDs for a build.
 *
 * - Production builds on EAS (`EAS_BUILD=true`, profile `production`) throw if any ID is empty or a
 *   Google test ID, so a release can never ship test ads or crash for lack of an App ID.
 * - Every other build falls back to Google's test IDs for any variable that is not set.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ appId: string, banner: string, interstitial: string, rewarded: string, usingTestIds: boolean }}
 */
function resolveAdIds(env) {
  const raw = {
    appId: env[ENV_KEYS.appId],
    banner: env[ENV_KEYS.banner],
    interstitial: env[ENV_KEYS.interstitial],
    rewarded: env[ENV_KEYS.rewarded],
  };

  const isProductionBuild = env.EAS_BUILD_PROFILE === 'production';
  const onEasWorker = env.EAS_BUILD === 'true' || env.EAS_BUILD === '1';

  /** @type {(keyof typeof raw)[]} */
  const keys = ['appId', 'banner', 'interstitial', 'rewarded'];
  const bad = keys.filter((k) => isTestOrEmpty(raw[k]));

  if (isProductionBuild && bad.length > 0) {
    const names = bad.map((k) => ENV_KEYS[k]).join(', ');
    const message =
      `Release guard: ${names} must be set to your real AdMob IDs for a production build ` +
      `(empty values and Google test IDs are not allowed).`;
    if (onEasWorker || env.JAGGA_STRICT_AD_GUARD === '1') {
      throw new Error(message);
    }
    // eas-cli also evaluates the config on your computer, where EAS "secret" variables are not
    // readable. The build worker re-evaluates it with the real values and enforces the guard there.
    console.warn(`[jagga-napi] ${message} (enforced on the EAS build worker)`);
  }

  const pick = (/** @type {keyof typeof raw} */ k) =>
    isTestOrEmpty(raw[k]) ? GOOGLE_TEST_IDS[k] : /** @type {string} */ (raw[k]).trim();

  const resolved = {
    appId: pick('appId'),
    banner: pick('banner'),
    interstitial: pick('interstitial'),
    rewarded: pick('rewarded'),
  };
  return { ...resolved, usingTestIds: keys.some((k) => isTestOrEmpty(resolved[k])) };
}

module.exports = { GOOGLE_TEST_IDS, GOOGLE_TEST_PUBLISHER, ENV_KEYS, isTestOrEmpty, resolveAdIds };
