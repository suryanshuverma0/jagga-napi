import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useApp } from '@/state/AppState';
import { useAds } from './context';
import { getAdUnitIds } from './ids';

/**
 * Anchored adaptive banner at the bottom of a screen. Hidden while the keyboard is open (so an ad
 * never sits over an input) and collapsed to nothing if there is no fill.
 */
export function BannerSlot() {
  const { canShowAds } = useAds();
  const { palette } = useApp();
  const unitId = useMemo(() => getAdUnitIds().banner, []);
  const [keyboard, setKeyboard] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!canShowAds || failed || keyboard) return null;
  return (
    <View style={[styles.slot, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
