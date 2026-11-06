import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useApp } from '@/state/AppState';
import { space, TOUCH } from '@/theme';
import { Icon, type IconName } from './Icon';
import { AppText } from './ui';

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  accessibilityHint,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  const { palette } = useApp();
  const content = (
    <>
      <Icon name={icon} size={22} color={palette.primary} />
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="small" muted>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {onPress ? <Icon name="chevron" size={22} color={palette.textMuted} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: palette.border }}
      style={styles.row}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  text: { flex: 1 },
});
