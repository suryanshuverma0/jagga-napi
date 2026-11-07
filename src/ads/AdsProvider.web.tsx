import React from 'react';

import { AdsContext, NO_ADS } from './context';

export { useAds } from './context';

/** Web previews and tests: no ad SDK. */
export function AdsProvider({ children }: { children: React.ReactNode }) {
  return <AdsContext.Provider value={NO_ADS}>{children}</AdsContext.Provider>;
}
