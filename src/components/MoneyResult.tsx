import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Decimal } from '@/math/decimal';
import { amountInWords, formatRupees } from '@/math/money';
import { useApp } from '@/state/AppState';
import { space, TOUCH } from '@/theme';
import { copyText } from './feedback';
import { Icon } from './Icon';
import { AppText, Card } from './ui';

export function moneyText(amount: Decimal, tr: ReturnType<typeof useApp>['tr']) {
  const figure = `${tr.t('rupeesPrefix')} ${tr.n(formatRupees(amount))}`;
  const words = tr.n(amountInWords(amount, tr.lang));
  return { figure, words };
}

/** A rupee amount in figures (Nepali grouping) and in words, tap to copy. */
export function MoneyResult({ label, amount, suffix }: { label: string; amount: Decimal; suffix?: string }) {
  const { tr, palette } = useApp();
  const { figure, words } = moneyText(amount, tr);
  const shown = suffix ? `${figure} ${suffix}` : figure;
  return (
    <Card>
      <Pressable
        onPress={() => void copyText(`${label}: ${shown} (${words})`, tr.t('copied'))}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}. ${tr.t('inWords')}: ${words}`}
        accessibilityHint={tr.t('copyValue', { label })}
        style={styles.row}
      >
        <View style={styles.text}>
          <AppText variant="label" muted>
            {label}
          </AppText>
          <AppText variant="display" selectable>
            {shown}
          </AppText>
          <AppText variant="small" muted>
            {tr.t('inWords')}: {words}
          </AppText>
        </View>
        <Icon name="copy" size={22} color={palette.primary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: TOUCH },
  text: { flex: 1, gap: space.xs },
});
