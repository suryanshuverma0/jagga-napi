import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

import { shouldShowInterstitial } from '@/engagement/policy';
import { useApp } from '@/state/AppState';
import { AdsContext, type AdsValue } from './context';
import { getAdUnitIds } from './ids';

export { useAds } from './context';

/**
 * Consent (UMP) → SDK init → preloaded interstitial and rewarded ads.
 * Nothing runs until onboarding is finished, so the first screen a new user sees is ad-free.
 * Every failure is silent: no fill or no consent simply means no ads.
 */
export function AdsProvider({ children }: { children: React.ReactNode }) {
  const { meta, updateMeta } = useApp();
  const [canShowAds, setCanShowAds] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const ids = useMemo(() => getAdUnitIds(), []);
  const interstitial = useRef<InterstitialAd | null>(null);
  const interstitialLoaded = useRef(false);
  const rewarded = useRef<RewardedAd | null>(null);
  const rewardedLoaded = useRef(false);
  const started = useRef(false);
  const metaRef = useRef(meta);
  useEffect(() => {
    metaRef.current = meta;
  });

  // 1. Consent and initialisation, once, after onboarding.
  useEffect(() => {
    if (!meta.onboarded || started.current) return;
    started.current = true;
    (async () => {
      try {
        const info = await AdsConsent.gatherConsent();
        setPrivacyOptionsRequired(
          info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
        );
        if (!info.canRequestAds) return;
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.T,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
        setCanShowAds(true);
      } catch {
        // Consent or SDK failure: run without ads.
      }
    })();
  }, [meta.onboarded]);

  // 2. Preload full-screen ads, and reload each one after it is shown.
  useEffect(() => {
    if (!canShowAds) return;
    const inter = InterstitialAd.createForAdRequest(ids.interstitial);
    const rew = RewardedAd.createForAdRequest(ids.rewarded);
    interstitial.current = inter;
    rewarded.current = rew;
    const subs = [
      inter.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoaded.current = true;
      }),
      inter.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialLoaded.current = false;
        inter.load();
      }),
      inter.addAdEventListener(AdEventType.ERROR, () => {
        interstitialLoaded.current = false;
      }),
      rew.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewardedLoaded.current = true;
      }),
      rew.addAdEventListener(AdEventType.ERROR, () => {
        rewardedLoaded.current = false;
      }),
    ];
    inter.load();
    rew.load();
    return () => {
      subs.forEach((unsubscribe) => unsubscribe());
      interstitial.current = null;
      rewarded.current = null;
    };
  }, [canShowAds, ids]);

  const afterEngagement = useCallback(() => {
    const inter = interstitial.current;
    const now = Date.now();
    if (!canShowAds || !inter || !interstitialLoaded.current) return;
    if (Keyboard.isVisible()) return;
    if (!shouldShowInterstitial(metaRef.current, now)) return;
    updateMeta({ lastInterstitialAt: now });
    interstitialLoaded.current = false;
    inter.show().catch(() => inter.load());
  }, [canShowAds, updateMeta]);

  const showRewarded = useCallback(async () => {
    const rew = rewarded.current;
    if (!canShowAds || !rew || !rewardedLoaded.current) {
      rew?.load();
      return false;
    }
    rewardedLoaded.current = false;
    return new Promise<boolean>((resolve) => {
      let earned = false;
      const offEarned = rew.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      });
      const finish = () => {
        offEarned();
        offClosed();
        offError();
        rew.load();
        resolve(earned);
      };
      const offClosed = rew.addAdEventListener(AdEventType.CLOSED, finish);
      const offError = rew.addAdEventListener(AdEventType.ERROR, finish);
      rew.show().catch(finish);
    });
  }, [canShowAds]);

  const openPrivacyOptions = useCallback(async () => {
    try {
      const info = await AdsConsent.showPrivacyOptionsForm();
      setPrivacyOptionsRequired(
        info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
    } catch {
      // Form unavailable: nothing to do.
    }
  }, []);

  const value = useMemo<AdsValue>(
    () => ({ canShowAds, privacyOptionsRequired, openPrivacyOptions, afterEngagement, showRewarded }),
    [canShowAds, privacyOptionsRequired, openPrivacyOptions, afterEngagement, showRewarded],
  );
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}
