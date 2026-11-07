import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AreaResults } from '@/components/AreaResults';
import { NumberField } from '@/components/NumberField';
import { PlotPreview } from '@/components/PlotPreview';
import { Screen } from '@/components/Screen';
import {
  AppText,
  Button,
  Card,
  ErrorNote,
  IconButton,
  InfoNote,
  Segmented,
  SectionTitle,
} from '@/components/ui';
import { emptyPlot, evaluatePlot, SIDES_NEEDED } from '@/calc/evaluate';
import { compoundLine } from '@/format/areaLines';
import { useBackGuard } from '@/hooks/useBackGuard';
import { useHistoryRestore } from '@/hooks/useHistoryRestore';
import type { StringKey, Translator } from '@/i18n';
import type { Decimal } from '@/math/decimal';
import { formatNumber } from '@/math/format';
import { parseNonNegative } from '@/math/parse';
import { useApp } from '@/state/AppState';
import type { PlotPayload, PlotShape } from '@/storage/types';
import { space } from '@/theme';

const MAX_TRIANGLES = 30;

const SIDE_LABELS: Record<Exclude<PlotShape, 'triangles'>, StringKey[]> = {
  rectangle: ['length', 'breadth'],
  triangle: ['sideA', 'sideB', 'sideC'],
  quadrilateral: ['sideAB', 'sideBC', 'sideCD', 'sideDA', 'diagonalAC'],
};

/** Field-specific message for the number at `index` (flat index for irregular plots). */
function invalidMessage(p: PlotPayload, index: number, tr: Translator): string {
  let raw: string;
  let field: string;
  if (p.shape === 'triangles') {
    const t = Math.floor(index / 3);
    const s = index % 3;
    raw = p.triangles[t]?.[s] ?? '';
    field = `${tr.t('triangleN', { n: tr.n(String(t + 1)) })}, ${tr.t((['sideA', 'sideB', 'sideC'] as const)[s]!)}`;
  } else {
    raw = p.sides[index] ?? '';
    field = tr.t(SIDE_LABELS[p.shape][index]!);
  }
  const r = parseNonNegative(raw);
  if (!r.ok) return tr.t(r.error === 'negative' ? 'error_negativeField' : 'error_invalidField', { field });
  return tr.t('error_positive', { field });
}

export default function PlotScreen() {
  const { tr, settings, meta, updateMeta } = useApp();
  const { t } = tr;
  const [plot, setPlot] = useState<PlotPayload>(() =>
    emptyPlot(meta.lastLengthUnit ?? settings.defaultLengthUnit),
  );
  useHistoryRestore('plot', setPlot);

  const evaluation = useMemo(() => evaluatePlot(plot), [plot]);
  const dirty =
    plot.sides.some((s) => s.trim() !== '') || plot.triangles.some((tri) => tri.some((s) => s.trim() !== ''));
  useBackGuard(dirty, 'tab');

  const unitShort = t(plot.lengthUnit === 'ft' ? 'lengthShort_ft' : 'lengthShort_m');

  const setSide = (i: number, v: string) =>
    setPlot((p) => {
      const sides = [...p.sides];
      sides[i] = v;
      return { ...p, sides };
    });
  const setTriSide = (ti: number, si: number, v: string) =>
    setPlot((p) => ({
      ...p,
      triangles: p.triangles.map((tri, i) => (i === ti ? tri.map((s, j) => (j === si ? v : s)) : tri)),
    }));

  const sideNumbers =
    evaluation.status === 'ok' && plot.shape !== 'triangles'
      ? plot.sides.slice(0, SIDES_NEEDED[plot.shape]).map((s) => {
          const r = parseNonNegative(s);
          return r.ok ? r.value.toNumber() : 0;
        })
      : null;

  const partLine = (sqft: Decimal) =>
    `${compoundLine(sqft, settings.defaultSystem, tr).value} · ${tr.n(formatNumber(sqft, { maxDp: 2 }))} ${t('unit_sqft')}`;

  return (
    <Screen banner>
      <Card>
        <Segmented
          label={t('plotTitle')}
          value={plot.shape}
          onChange={(shape) => setPlot((p) => ({ ...p, shape }))}
          options={(['rectangle', 'triangle', 'quadrilateral', 'triangles'] as const).map((s) => ({
            value: s,
            label: t(`shape_${s}`),
          }))}
        />
        <View style={{ height: space.lg }} />
        <AppText variant="label" muted>
          {t('lengthUnit')}
        </AppText>
        <View style={{ height: space.xs }} />
        <Segmented
          label={t('lengthUnit')}
          value={plot.lengthUnit}
          onChange={(lengthUnit) => {
            updateMeta({ lastLengthUnit: lengthUnit });
            setPlot((p) => ({ ...p, lengthUnit }));
          }}
          options={[
            { value: 'ft', label: t('length_ft') },
            { value: 'm', label: t('length_m') },
          ]}
        />
      </Card>

      {plot.shape !== 'triangles' ? (
        <Card style={styles.gap}>
          {plot.shape === 'quadrilateral' ? <InfoNote message={t('quadHelp')} /> : null}
          <View style={styles.fields}>
            {SIDE_LABELS[plot.shape].map((key, i) => (
              <NumberField
                key={key}
                style={styles.field}
                label={t(key)}
                suffix={unitShort}
                value={plot.sides[i] ?? ''}
                onChange={(v) => setSide(i, v)}
                invalid={evaluation.status === 'invalidNumber' && evaluation.index === i}
              />
            ))}
          </View>
        </Card>
      ) : (
        <>
          <InfoNote message={t('trianglesHelp')} />
          {plot.triangles.map((tri, ti) => {
            const n = tr.n(String(ti + 1));
            const part =
              evaluation.status === 'ok' || evaluation.status === 'shapeError' ? evaluation.parts[ti] : null;
            return (
              <Card key={ti} style={styles.gap}>
                <View style={styles.triHeader}>
                  <SectionTitle style={{ marginBottom: 0, flex: 1 }}>{t('triangleN', { n })}</SectionTitle>
                  {plot.triangles.length > 1 ? (
                    <IconButton
                      icon="delete"
                      label={t('removeTriangle', { n })}
                      onPress={() =>
                        setPlot((p) => ({ ...p, triangles: p.triangles.filter((_, i) => i !== ti) }))
                      }
                    />
                  ) : null}
                </View>
                <View style={styles.fields}>
                  {(['sideA', 'sideB', 'sideC'] as const).map((key, si) => (
                    <NumberField
                      key={key}
                      style={styles.field}
                      label={t(key)}
                      suffix={unitShort}
                      value={tri[si] ?? ''}
                      onChange={(v) => setTriSide(ti, si, v)}
                      invalid={
                        (evaluation.status === 'invalidNumber' && evaluation.index === ti * 3 + si) ||
                        (evaluation.status === 'shapeError' &&
                          evaluation.issues.some((x) => x.triangle === ti + 1))
                      }
                    />
                  ))}
                </View>
                {part ? (
                  <AppText
                    variant="bodyStrong"
                    accessibilityLabel={`${t('triangleArea', { n })}: ${partLine(part)}`}
                  >
                    {t('triangleArea', { n })}: {partLine(part)}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
          {plot.triangles.length < MAX_TRIANGLES ? (
            <Button
              kind="secondary"
              icon="add"
              label={t('addTriangle')}
              onPress={() => setPlot((p) => ({ ...p, triangles: [...p.triangles, ['', '', '']] }))}
            />
          ) : null}
        </>
      )}

      {evaluation.status === 'invalidNumber' ? (
        <ErrorNote message={invalidMessage(plot, evaluation.index, tr)} />
      ) : null}
      {evaluation.status === 'rectError' ? <ErrorNote message={t('rectError_nonPositive')} /> : null}
      {evaluation.status === 'shapeError'
        ? evaluation.issues.map((issue) => (
            <ErrorNote
              key={issue.triangle}
              message={t(`shapeError_${issue.error}`, { n: tr.n(String(issue.triangle)) })}
            />
          ))
        : null}
      {evaluation.status === 'incomplete' ? (
        <AppText muted style={{ textAlign: 'center' }}>
          {t('fillAllSides')}
        </AppText>
      ) : null}

      {sideNumbers && plot.shape !== 'triangles' ? (
        <Card>
          <SectionTitle>{t('preview')}</SectionTitle>
          <PlotPreview shape={plot.shape} sides={sideNumbers} unitLabel={unitShort} />
        </Card>
      ) : null}

      {evaluation.status === 'ok' ? <AreaResults sqft={evaluation.sqft} title={t('totalArea')} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.md },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  field: { flexGrow: 1, flexBasis: 90, minWidth: 90 },
  triHeader: { flexDirection: 'row', alignItems: 'center' },
});
