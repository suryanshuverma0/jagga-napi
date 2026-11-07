import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { evaluateArith } from '@/calc/evaluate';
import { AreaInput } from '@/components/AreaInput';
import { AreaResults } from '@/components/AreaResults';
import { CalcActions } from '@/components/CalcActions';
import { Screen } from '@/components/Screen';
import { Button, Card, ErrorNote, IconButton, Segmented, SectionTitle } from '@/components/ui';
import { useBackGuard } from '@/hooks/useBackGuard';
import { useHistoryRestore } from '@/hooks/useHistoryRestore';
import { isNegativeArea } from '@/math/arithmetic';
import { useApp } from '@/state/AppState';
import type { ArithParcel, ArithPayload } from '@/storage/types';
import { space } from '@/theme';
import { emptyAreaEntry, isAreaEntryBlank, type InputSystem } from '@/units/areaEntry';

const MAX_PARCELS = 30;

export default function ArithmeticScreen() {
  const { tr, settings, meta } = useApp();
  const { t } = tr;
  const startSystem: InputSystem = meta.lastInputSystem ?? settings.defaultSystem;
  const newParcel = (sign: 1 | -1, system: InputSystem = startSystem): ArithParcel => ({
    sign,
    area: emptyAreaEntry(system),
  });
  const [p, setP] = useState<ArithPayload>(() => ({ parcels: [newParcel(1), newParcel(1)] }));
  const [saved, setSaved] = useState<ArithPayload | null>(null);
  useHistoryRestore('arith', (x) => {
    setP(x);
    setSaved(x);
  });
  useBackGuard(p.parcels.some((x) => !isAreaEntryBlank(x.area)) && saved !== p, 'stack');

  const total = useMemo(() => evaluateArith(p), [p]);
  const update = (i: number, parcel: ArithParcel) =>
    setP((x) => ({ parcels: x.parcels.map((q, j) => (j === i ? parcel : q)) }));

  return (
    <Screen footer={<CalcActions kind="arith" payload={p} onSaved={() => setSaved(p)} />}>
      {p.parcels.map((parcel, i) => {
        const n = tr.n(String(i + 1));
        return (
          <Card key={i} style={styles.gap}>
            <View style={styles.header}>
              <SectionTitle style={{ marginBottom: 0, flex: 1 }}>{t('parcelN', { n })}</SectionTitle>
              {p.parcels.length > 1 ? (
                <IconButton
                  icon="delete"
                  label={t('removeParcel', { n })}
                  onPress={() => setP((x) => ({ parcels: x.parcels.filter((_, j) => j !== i) }))}
                />
              ) : null}
            </View>
            {i > 0 ? (
              <Segmented
                label={t('parcelN', { n })}
                value={parcel.sign === 1 ? 'plus' : 'minus'}
                onChange={(v) => update(i, { ...parcel, sign: v === 'plus' ? 1 : -1 })}
                options={[
                  { value: 'plus', label: `+ ${t('plus')}` },
                  { value: 'minus', label: `− ${t('minus')}` },
                ]}
              />
            ) : null}
            <AreaInput entry={parcel.area} onChange={(area) => update(i, { ...parcel, area })} />
          </Card>
        );
      })}
      {p.parcels.length < MAX_PARCELS ? (
        <Button
          kind="secondary"
          icon="add"
          label={t('addParcel')}
          onPress={() =>
            setP((x) => ({
              parcels: [...x.parcels, newParcel(1, x.parcels[x.parcels.length - 1]?.area.system)],
            }))
          }
        />
      ) : null}

      {total && isNegativeArea(total) ? <ErrorNote message={t('negativeResult')} /> : null}
      {total && !isNegativeArea(total) ? <AreaResults sqft={total} title={t('result')} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center' },
});
