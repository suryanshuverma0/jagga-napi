import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { BannerSlot } from '@/ads/BannerSlot';
import { useApp } from '@/state/AppState';
import { space } from '@/theme';

/**
 * Standard screen: scrollable content, an optional action bar pinned to the bottom (primary actions
 * stay in thumb reach), and the anchored banner below it when `banner` is set.
 */
export function Screen({
  children,
  footer,
  banner = false,
  scroll = true,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  banner?: boolean;
  scroll?: boolean;
}) {
  const { palette } = useApp();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
      {footer ? (
        <View style={[styles.footer, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
          {footer}
        </View>
      ) : null}
      {banner ? <BannerSlot /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.lg },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
