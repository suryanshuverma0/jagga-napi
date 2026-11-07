import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { evaluateDivide } from '@/calc/tools';
import { AreaInput } from '@/components/AreaInput';
import { ResultRow } from '@/components/AreaResults';
import { CalcActions } from '@/components/CalcActions';
import { NumberField } from '@/components/NumberField';
import { Screen } from '@/components/Screen';
import { AppText, Card, ErrorNote, InfoNote, Segmented, SectionTitle } from '@/components/ui';
import { compoundLine } from '@/format/areaLines';
import { useBackGuard } from '@/hooks/useBackGuard';
import { useHistoryRestore } from '@/hooks/useHistoryRestore';
import type { StringKey } from '@/i18n';
import { formatNumber } from '@/math/format';
import { useApp } from '@/state/AppState';
import type { DividePayload } from '@/storage/types';
import { space } from '@/theme';
import { emptyAreaEntry, isAreaEntryBlank } from '@/units/areaEntry';
import { smallestUnit } from '@/units/compound';
import { fromSqft } from '@/units/conversions';

export default function DivideScreen() {
  const { tr, settings, meta } = useApp();
  const { t } = tr;
  const [p, setP] = useState<DividePayload>(() => ({
    area: emptyAreaEntry(meta.lastInputSystem ?? settings.defaultSystem),
    mode: 'equal',
    count: '',
    ratios: '',
    system: settings.defaultSystem,
  }));
  const [saved, setSaved] = useState<DividePayload | null>(null);
  useHistoryRestore('divide', (x) => {
    setP(x);
    setSaved(x);
  });
  useBackGuard((!isAreaEntryBlank(p.area) || p.count !== '' || p.ratios !== '') && saved !== p, 'stack');

  const ev = useMemo(() => evaluateDivide(p), [p]);
  const unitName = t(`unit_${smallestUnit(p.system)}` as StringKey);

  return (
    <Screen banner footer={<CalcActions kind="divide" payload={p} onSaved={() => setSaved(p)} />}>
      <Card>
        <AreaInput entry={p.area} onChange={(area) => setP((x) => ({ ...x, area }))} label={t('area')} />
      </Card>
      <Card>
        <Segmented
          label={t('divideTitle')}
          value={p.mode}
          onChange={(mode) => setP((x) => ({ ...x, mode }))}
          options={[
            { value: 'equal', label: t('divideMode_equal') },
            { value: 'ratio', label: t('divideMode_ratio') },
          ]}
        />
        <View style={{ height: space.md }} />
        {p.mode === 'equal' ? (
          <NumberField
            label={t('numberOfShares')}
            value={p.count}
            onChange={(count) => setP((x) => ({ ...x, count: count.replace(/\./g, '') }))}
            invalid={ev.status === 'countError' || (ev.status === 'divisionError' && ev.error !== 'zeroArea')}
            placeholder={tr.n('3')}
          />
        ) : (
          <NumberField
            label={t('ratios')}
            value={p.ratios}
            onChange={(ratios) => setP((x) => ({ ...x, ratios }))}
            invalid={ev.status === 'ratioError' || (ev.status === 'divisionError' && ev.error !== 'zeroArea')}
            placeholder={t('ratiosHint')}
            freeText
          />
        )}
        <View style={{ height: space.md }} />
        <AppText variant="label" muted>
          {t('showSharesIn')}
        </AppText>
        <View style={{ height: space.xs }} />
        <Segmented
          label={t('showSharesIn')}
          value={p.system}
          onChange={(system) => setP((x) => ({ ...x, system }))}
          options={[
            { value: 'ropani', label: t('system_ropani'), hint: t('systemHint_ropani') },
            { value: 'bigha', label: t('system_bigha'), hint: t('systemHint_bigha') },
          ]}
        />
      </Card>

      {ev.status === 'countError' ? <ErrorNote message={t('divideError_count')} /> : null}
      {ev.status === 'ratioError' ? <ErrorNote message={t('ratioError_invalid')} /> : null}
      {ev.status === 'divisionError' ? <ErrorNote message={t(`divideError_${ev.error}`)} /> : null}

      {ev.status === 'ok' ? (
        <Card>
          <SectionTitle>{t('divideTitle')}</SectionTitle>
          {ev.division.shares.map((share, i) => {
            const line = compoundLine(share, p.system, tr);
            const n = tr.n(String(i + 1));
            const ratio =
              p.mode === 'ratio' ? ` · ${t('shareRatio', { r: tr.n(ev.ratios[i]!.toString()) })}` : '';
            const sqft = `${tr.n(formatNumber(share, { maxDp: 2 }))} ${t('unit_sqft')}`;
            return (
              <ResultRow
                key={i}
                line={{
                  key: `share${i}`,
                  label: `${t('shareN', { n })}${ratio}`,
                  value: line.value,
                  detail: `${line.detail} · ${sqft}`,
                  copyText: `${t('shareN', { n })}: ${line.value} (${line.label}) = ${sqft}`,
                }}
              />
            );
          })}
          {!ev.division.remainderSqft.isZero() ? (
            <InfoNote
              style={{ marginTop: space.md }}
              message={t('remainderNote', {
                unit: unitName,
                value: `${tr.n(formatNumber(fromSqft(ev.division.remainderSqft, smallestUnit(p.system)), { maxDp: 2 }))} ${unitName}`,
              })}
            />
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}
