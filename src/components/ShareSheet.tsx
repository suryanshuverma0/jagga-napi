import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAds } from '@/ads/AdsProvider';
import { buildShareText, type ShareCardModel } from '@/share/model';
import { useApp } from '@/state/AppState';
import { space } from '@/theme';
import { copyText, notify } from './feedback';
import { ShareCard } from './ShareCard';
import { AppText, Button } from './ui';

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function ShareSheet({
  model,
  onClose,
  onShared,
}: {
  model: ShareCardModel;
  onClose: () => void;
  /** Called after an image was handed to the share sheet or text was copied. */
  onShared: () => void;
}) {
  const { tr, palette } = useApp();
  const { t } = tr;
  const ads = useAds();
  const cardRef = useRef<React.ComponentRef<typeof View>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [watermark, setWatermark] = useState(true);
  const [busy, setBusy] = useState(false);

  const shareImage = async (withWatermark: boolean) => {
    setBusy(true);
    try {
      setWatermark(withWatermark);
      await nextFrame();
      await nextFrame();
      // view-shot's CaptureTarget type predates RN 0.88's element refs; the runtime accepts them.
      const target = cardRef as unknown as Parameters<typeof captureRef>[0];
      const uri = await captureRef(target, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('shareTitle'),
        UTI: 'public.png',
      });
      onClose();
      onShared();
    } catch {
      notify(t('shareFailed'));
    } finally {
      setWatermark(true);
      setBusy(false);
    }
  };

  const removeWatermark = async () => {
    setBusy(true);
    const earned = await ads.showRewarded();
    setBusy(false);
    if (earned) await shareImage(false);
    else notify(t('rewardUnavailable'));
  };

  const copy = async () => {
    await copyText(buildShareText(model, tr), t('textCopied'));
    onClose();
    onShared();
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={[styles.root, { backgroundColor: palette.surfaceAlt }]}>
        <AppText variant="title" accessibilityRole="header" style={styles.title}>
          {t('shareTitle')}
        </AppText>
        <ScrollView contentContainerStyle={styles.preview}>
          <View ref={cardRef} collapsable={false} style={styles.shadow}>
            <ShareCard
              width={Math.min(400, windowWidth - 2 * space.lg)}
              model={model}
              showWatermark={watermark}
              labels={{ inputs: t('inputs'), results: t('resultsTitle'), date: t('date') }}
            />
          </View>
        </ScrollView>
        <View style={[styles.actions, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
          <Button
            icon="image"
            label={t('shareImage')}
            onPress={() => void shareImage(true)}
            disabled={busy}
          />
          {ads.canShowAds ? (
            <Button
              kind="secondary"
              icon="play"
              label={t('shareNoWatermark')}
              accessibilityHint={t('shareNoWatermarkHint')}
              onPress={() => void removeWatermark()}
              disabled={busy}
            />
          ) : null}
          <View style={styles.row}>
            <Button
              kind="ghost"
              icon="text"
              label={t('copyText')}
              onPress={() => void copy()}
              disabled={busy}
              style={styles.flex}
            />
            <Button kind="ghost" label={t('close')} onPress={onClose} style={styles.flex} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  preview: { alignItems: 'center', padding: space.lg },
  shadow: { borderRadius: 16, elevation: 3, backgroundColor: '#FFFFFF' },
  actions: { padding: space.lg, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
