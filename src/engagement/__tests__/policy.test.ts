import {
  INTERSTITIAL_MIN_INTERVAL_MS,
  REVIEW_INTERVAL_MS,
  shouldRequestReview,
  shouldShowInterstitial,
} from '../policy';

const NOW = 1_800_000_000_000;

describe('shouldRequestReview', () => {
  it('waits for the 3rd save or share', () => {
    expect(shouldRequestReview({ engagementCount: 2, lastReviewPromptAt: 0 }, NOW)).toBe(false);
    expect(shouldRequestReview({ engagementCount: 3, lastReviewPromptAt: 0 }, NOW)).toBe(true);
  });
  it('at most once per 30 days', () => {
    const last = NOW - REVIEW_INTERVAL_MS + 1;
    expect(shouldRequestReview({ engagementCount: 10, lastReviewPromptAt: last }, NOW)).toBe(false);
    expect(
      shouldRequestReview({ engagementCount: 10, lastReviewPromptAt: NOW - REVIEW_INTERVAL_MS }, NOW),
    ).toBe(true);
  });
});

describe('shouldShowInterstitial', () => {
  it('never in the first session', () => {
    expect(shouldShowInterstitial({ sessionCount: 1, lastInterstitialAt: 0 }, NOW)).toBe(false);
    expect(shouldShowInterstitial({ sessionCount: 2, lastInterstitialAt: 0 }, NOW)).toBe(true);
  });
  it('at most once every 3 minutes', () => {
    expect(
      shouldShowInterstitial(
        { sessionCount: 5, lastInterstitialAt: NOW - INTERSTITIAL_MIN_INTERVAL_MS + 1000 },
        NOW,
      ),
    ).toBe(false);
    expect(
      shouldShowInterstitial(
        { sessionCount: 5, lastInterstitialAt: NOW - INTERSTITIAL_MIN_INTERVAL_MS },
        NOW,
      ),
    ).toBe(true);
  });
});
