import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText, Card, SectionTitle } from '@/components/ui';
import { buildReference } from '@/format/reference';
import { useApp } from '@/state/AppState';
import { space } from '@/theme';

export default function ReferenceScreen() {
  const { tr, palette } = useApp();
  const sections = useMemo(() => buildReference(tr), [tr]);
  return (
    <Screen>
      {sections.map((s) => (
        <Card key={s.title}>
          <SectionTitle>{tr.t(s.title)}</SectionTitle>
          {s.rows.map((row, i) => (
            <View
              key={i}
              style={[styles.row, { borderBottomColor: palette.border }]}
              accessible
              accessibilityLabel={`${row.lhs} = ${row.rhs.join(', ')}`}
            >
              <AppText variant="bodyStrong" style={styles.lhs}>
                {row.lhs} =
              </AppText>
              <View style={styles.rhs}>
                {row.rhs.map((r) => (
                  <AppText key={r} selectable>
                    {r}
                  </AppText>
                ))}
              </View>
            </View>
          ))}
        </Card>
      ))}
      <AppText variant="small" muted>
        {tr.t('disclaimerFull')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lhs: { minWidth: 110 },
  rhs: { flex: 1, minWidth: 150 },
});
