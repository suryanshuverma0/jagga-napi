import React, { createContext, useContext, useMemo } from 'react';

// M1 placeholder. Replaced by the AdMob implementation in M7.
interface AdsValue {
  canShowAds: boolean;
  privacyOptionsRequired: boolean;
  openPrivacyOptions: () => Promise<void>;
  /** Call after a share or a save. Shows an interstitial only if pacing rules allow. */
  afterEngagement: () => void;
  /** Resolves true if the user earned the reward. */
  showRewarded: () => Promise<boolean>;
}

const Ctx = createContext<AdsValue>({
  canShowAds: false,
  privacyOptionsRequired: false,
  openPrivacyOptions: async () => {},
  afterEngagement: () => {},
  showRewarded: async () => false,
});

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<AdsValue>(
    () => ({
      canShowAds: false,
      privacyOptionsRequired: false,
      openPrivacyOptions: async () => {},
      afterEngagement: () => {},
      showRewarded: async () => false,
    }),
    [],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAds() {
  return useContext(Ctx);
}
