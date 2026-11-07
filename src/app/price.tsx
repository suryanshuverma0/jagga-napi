import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { evaluatePrice } from '@/calc/tools';
import { AreaInput } from '@/components/AreaInput';
import { AreaResults } from '@/components/AreaResults';
import { MoneyResult } from '@/components/MoneyResult';
import { NumberField } from '@/components/NumberField';
import { Screen } from '@/components/Screen';
import { AppText, Card, ErrorNote, Segmented } from '@/components/ui';
import { useBackGuard } from '@/hooks/useBackGuard';
import { useHistoryRestore } from '@/hooks/useHistoryRestore';
import type { StringKey } from '@/i18n';
import { RATE_UNITS } from '@/math/price';
import { useApp } from '@/state/AppState';
import type { PricePayload } from '@/storage/types';
import { space } from '@/theme';
import { emptyAreaEntry, isAreaEntryBlank } from '@/units/areaEntry';

export default function PriceScreen() {
  const { tr, settings, meta } = useApp();
  const { t } = tr;
  const [p, setP] = useState<PricePayload>(() => ({
    mode: 'total',
    area: emptyAreaEntry(meta.lastInputSystem ?? settings.defaultSystem),
    rate: '',
    rateUnit: settings.defaultSystem === 'bigha' ? 'dhur' : 'aana',
    total: '',
  }));
  useHistoryRestore('price', setP);
  useBackGuard(!isAreaEntryBlank(p.area) || p.rate !== '' || p.total !== '', 'stack');

  const ev = useMemo(() => evaluatePrice(p), [p]);
  const unitName = t(`unit_${p.rateUnit}` as StringKey);

  return (
    <Screen banner>
      <Segmented
        label={t('priceTitle')}
        value={p.mode}
        onChange={(mode) => setP((x) => ({ ...x, mode }))}
        options={[
          { value: 'total', label: t('priceMode_total') },
          { value: 'rate', label: t('priceMode_rate') },
        ]}
      />
      <Card>
        <AreaInput entry={p.area} onChange={(area) => setP((x) => ({ ...x, area }))} label={t('area')} />
      </Card>
      <Card>
        <AppText variant="label" muted>
          {t('ratePer')}
        </AppText>
        <View style={{ height: space.xs }} />
        <Segmented
          label={t('ratePer')}
          value={p.rateUnit}
          onChange={(rateUnit) => setP((x) => ({ ...x, rateUnit }))}
          options={RATE_UNITS.map((u) => ({ value: u, label: t(`unit_${u}` as StringKey) }))}
        />
        <View style={{ height: space.md }} />
        {p.mode === 'total' ? (
          <NumberField
            label={t('ratePerUnit', { unit: unitName })}
            value={p.rate}
            onChange={(rate) => setP((x) => ({ ...x, rate }))}
            invalid={ev.status === 'invalidNumber'}
          />
        ) : (
          <NumberField
            label={t('totalPriceInput')}
            value={p.total}
            onChange={(total) => setP((x) => ({ ...x, total }))}
            invalid={ev.status === 'invalidNumber'}
          />
        )}
      </Card>

      {ev.status === 'invalidNumber' ? (
        <ErrorNote message={t(ev.error === 'negative' ? 'error_negative' : 'error_invalid')} />
      ) : null}
      {ev.status === 'areaZero' ? <ErrorNote message={t('areaZero')} /> : null}
      {ev.status === 'ok' ? (
        <>
          {ev.mode === 'total' ? (
            <MoneyResult label={t('totalPrice')} amount={ev.amount} />
          ) : (
            <MoneyResult label={t('rateResult', { unit: unitName })} amount={ev.amount} />
          )}
          <AreaResults sqft={ev.areaSqft} title={t('area')} />
        </>
      ) : null}
    </Screen>
  );
}
