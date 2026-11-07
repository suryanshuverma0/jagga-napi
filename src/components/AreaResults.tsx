import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { buildAreaLines, type ResultLine } from '@/format/areaLines';
import type { Decimal } from '@/math/decimal';
import { useApp } from '@/state/AppState';
import { space, TOUCH } from '@/theme';
import type { CompoundSystem } from '@/units/compound';
import { copyText } from './feedback';
import { Icon } from './Icon';
import { AppText, Card, SectionTitle } from './ui';

export function ResultRow({ line, emphasis }: { line: ResultLine; emphasis?: boolean }) {
  const { palette, tr } = useApp();
  const copy = () => void copyText(line.copyText, tr.t('copied'));
  return (
    <Pressable
      onPress={copy}
      accessibilityRole="button"
      accessibilityLabel={`${line.label}: ${line.detail ?? line.value}`}
      accessibilityHint={tr.t('copyValue', { label: line.label })}
      android_ripple={{ color: palette.border }}
      style={[styles.row, { borderBottomColor: palette.border }]}
    >
      <View style={styles.rowText}>
        <AppText variant="label" muted>
          {line.label}
        </AppText>
        <AppText variant={emphasis ? 'display' : 'value'} selectable>
          {line.value}
        </AppText>
        {line.detail ? (
          <AppText variant="small" muted>
            {line.detail}
          </AppText>
        ) : null}
      </View>
      <View style={styles.copy} importantForAccessibility="no-hide-descendants">
        <Icon name="copy" size={22} color={palette.primary} />
      </View>
    </Pressable>
  );
}

/** The same block of results under every calculator: all systems, each line copyable. */
export function AreaResults({
  sqft,
  title,
  preferred,
}: {
  sqft: Decimal;
  title?: string;
  preferred?: CompoundSystem;
}) {
  const { tr, settings } = useApp();
  const lines = useMemo(
    () => buildAreaLines(sqft, tr, preferred ?? settings.defaultSystem),
    [sqft, tr, preferred, settings.defaultSystem],
  );
  return (
    <Card>
      <SectionTitle>{title ?? tr.t('resultsTitle')}</SectionTitle>
      <AppText variant="small" muted>
        {tr.t('tapToCopy')}
      </AppText>
      {lines.map((line, i) => (
        <ResultRow key={line.key} line={line} emphasis={i === 0} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
  },
  rowText: { flex: 1 },
  copy: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
});
