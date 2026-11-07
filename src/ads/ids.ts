import Constants from 'expo-constants';
import { TestIds } from 'react-native-google-mobile-ads';

export interface AdUnitIds {
  banner: string;
  interstitial: string;
  rewarded: string;
}

/**
 * Unit IDs baked into the build by app.config.ts (from ADMOB_* env vars). Development builds
 * always use Google's test units so we never request real ads while developing.
 * Production builds cannot contain test IDs: app.config.ts refuses to build them.
 */
export function getAdUnitIds(): AdUnitIds {
  if (__DEV__) {
    return {
      banner: TestIds.ADAPTIVE_BANNER,
      interstitial: TestIds.INTERSTITIAL,
      rewarded: TestIds.REWARDED,
    };
  }
  const extra = (Constants.expoConfig?.extra ?? {}) as { ads?: Partial<AdUnitIds> };
  return {
    banner: extra.ads?.banner || TestIds.ADAPTIVE_BANNER,
    interstitial: extra.ads?.interstitial || TestIds.INTERSTITIAL,
    rewarded: extra.ads?.rewarded || TestIds.REWARDED,
  };
}
