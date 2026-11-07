import { createContext, useContext } from 'react';

export interface AdsValue {
  /** True once consent allows ad requests and the SDK is initialised. */
  canShowAds: boolean;
  /** UMP says the user must be able to change their choices from Settings. */
  privacyOptionsRequired: boolean;
  openPrivacyOptions: () => Promise<void>;
  /** Call after a share or a save. Shows an interstitial only if pacing rules allow. */
  afterEngagement: () => void;
  /** Shows a rewarded ad. Resolves true only if the reward was earned. */
  showRewarded: () => Promise<boolean>;
}

export const NO_ADS: AdsValue = {
  canShowAds: false,
  privacyOptionsRequired: false,
  openPrivacyOptions: async () => {},
  afterEngagement: () => {},
  showRewarded: async () => false,
};

export const AdsContext = createContext<AdsValue>(NO_ADS);

export function useAds(): AdsValue {
  return useContext(AdsContext);
}
