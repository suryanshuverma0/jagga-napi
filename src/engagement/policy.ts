import type { AppMeta } from '@/storage/types';

export const REVIEW_MIN_ENGAGEMENTS = 3;
export const REVIEW_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
export const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;

/** In-app review: from the 3rd save/share onward, at most once every 30 days. */
export function shouldRequestReview(
  meta: Pick<AppMeta, 'engagementCount' | 'lastReviewPromptAt'>,
  now: number,
): boolean {
  if (meta.engagementCount < REVIEW_MIN_ENGAGEMENTS) return false;
  return meta.lastReviewPromptAt === 0 || now - meta.lastReviewPromptAt >= REVIEW_INTERVAL_MS;
}

/** Interstitial: never in the first session, and at most once every 3 minutes. */
export function shouldShowInterstitial(
  meta: Pick<AppMeta, 'sessionCount' | 'lastInterstitialAt'>,
  now: number,
): boolean {
  if (meta.sessionCount < 2) return false;
  return now - meta.lastInterstitialAt >= INTERSTITIAL_MIN_INTERVAL_MS;
}
