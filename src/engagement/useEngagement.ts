import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';

import { useAds } from '@/ads/AdsProvider';
import { useApp } from '@/state/AppState';
import { shouldRequestReview } from './policy';

/**
 * Call after every successful save or share. Counts the engagement, then either asks for a
 * Play review (3rd engagement onward, once per 30 days) or lets the ad layer decide on an
 * interstitial, never both at once.
 */
export function useEngagement() {
  const { meta, updateMeta } = useApp();
  const ads = useAds();

  return useCallback(async () => {
    const now = Date.now();
    const engagementCount = meta.engagementCount + 1;
    updateMeta({ engagementCount });
    if (shouldRequestReview({ engagementCount, lastReviewPromptAt: meta.lastReviewPromptAt }, now)) {
      try {
        if (await StoreReview.isAvailableAsync()) {
          updateMeta({ lastReviewPromptAt: now });
          await StoreReview.requestReview();
          return;
        }
      } catch {
        // Review flow unavailable (e.g. no Play Store): fall through.
      }
    }
    ads.afterEngagement();
  }, [meta.engagementCount, meta.lastReviewPromptAt, updateMeta, ads]);
}
