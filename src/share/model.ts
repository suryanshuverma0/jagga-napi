import { evaluateArith, evaluatePlot, SIDES_NEEDED } from '@/calc/evaluate';
import { evaluateDivide, evaluatePrice } from '@/calc/tools';
import { buildAreaLines, compoundLine } from '@/format/areaLines';
import type { StringKey, Translator } from '@/i18n';
import type { Decimal } from '@/math/decimal';
import { formatNumber } from '@/math/format';
import { amountInWords, formatRupees } from '@/math/money';
import { parseNonNegative } from '@/math/parse';
import type { CalcKind, PayloadByKind, PlotShape } from '@/storage/types';
import { evaluateAreaEntry, isCompoundSystem, type AreaEntry } from '@/units/areaEntry';
import type { CompoundSystem } from '@/units/compound';

export interface ShareLine {
  label: string;
  value: string;
  detail?: string;
}

export interface ShareDrawing {
  shape: Exclude<PlotShape, 'triangles'>;
  sides: number[];
  unitLabel: string;
}

/** Everything a shared result shows. Built once and rendered as an image or as text. */
export interface ShareCardModel {
  title: string;
  name?: string;
  inputs: ShareLine[];
  results: ShareLine[];
  drawing?: ShareDrawing;
  date: string;
  appName: string;
  watermark: string;
  disclaimer: string;
}

/** ISO-style date (unambiguous in both languages), digits localised. */
export function shareDate(now: Date, tr: Translator): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return tr.n(`${y}-${m}-${d}`);
}

function entryLine(entry: AreaEntry, label: string, tr: Translator): ShareLine | null {
  const r = evaluateAreaEntry(entry);
  if (r.status !== 'ok') return null;
  if (isCompoundSystem(entry.system)) {
    const l = compoundLine(r.sqft, entry.system, tr);
    return { label, value: `${l.value} (${l.label})`, detail: l.detail };
  }
  const v = parseNonNegative(entry.fields[0] ?? '');
  const shown = v.ok ? tr.n(formatNumber(v.value, { maxDp: 4 })) : '';
  return { label, value: `${shown} ${tr.t(`unit_${entry.system}` as StringKey)}` };
}

/** The four lines that matter on a card: both compound systems, sq ft and m². */
function areaResults(sqft: Decimal, tr: Translator, preferred: CompoundSystem): ShareLine[] {
  return buildAreaLines(sqft, tr, preferred)
    .slice(0, 4)
    .map((l) => ({ label: l.label, value: l.value, detail: l.detail }));
}

function money(amount: Decimal, tr: Translator) {
  return {
    value: `${tr.t('rupeesPrefix')} ${tr.n(formatRupees(amount))}`,
    detail: `${tr.t('inWords')}: ${tr.n(amountInWords(amount, tr.lang))}`,
  };
}

const PLOT_SIDE_LABELS: Record<Exclude<PlotShape, 'triangles'>, StringKey[]> = {
  rectangle: ['length', 'breadth'],
  triangle: ['sideA', 'sideB', 'sideC'],
  quadrilateral: ['sideAB', 'sideBC', 'sideCD', 'sideDA', 'diagonalAC'],
};

interface Body {
  inputs: ShareLine[];
  results: ShareLine[];
  drawing?: ShareDrawing;
}

type Builder<K extends CalcKind> = (
  p: PayloadByKind[K],
  tr: Translator,
  preferred: CompoundSystem,
) => Body | null;

const builders: { [K in CalcKind]: Builder<K> } = {
  convert: (p, tr, preferred) => {
    const r = evaluateAreaEntry(p.area);
    const input = entryLine(p.area, tr.t('area'), tr);
    if (r.status !== 'ok' || !input) return null;
    return {
      inputs: [input],
      results: areaResults(r.sqft, tr, isCompoundSystem(p.area.system) ? p.area.system : preferred),
    };
  },

  plot: (p, tr, preferred) => {
    const ev = evaluatePlot(p);
    if (ev.status !== 'ok') return null;
    const unit = tr.t(p.lengthUnit === 'ft' ? 'lengthShort_ft' : 'lengthShort_m');
    const num = (s: string) => {
      const v = parseNonNegative(s);
      return v.ok ? v.value : null;
    };
    const inputs: ShareLine[] = [{ label: tr.t('plotTitle'), value: tr.t(`shape_${p.shape}`) }];
    let drawing: ShareDrawing | undefined;
    if (p.shape === 'triangles') {
      p.triangles.forEach((tri, i) => {
        const sides = tri.map((s) => tr.n(formatNumber(num(s) ?? 0, { maxDp: 2 }))).join(' × ');
        const part = ev.parts[i];
        inputs.push({
          label: tr.t('triangleN', { n: tr.n(String(i + 1)) }),
          value: `${sides} ${unit}`,
          detail: part
            ? `${compoundLine(part, preferred, tr).value} · ${tr.n(formatNumber(part, { maxDp: 2 }))} ${tr.t('unit_sqft')}`
            : undefined,
        });
      });
    } else {
      const n = SIDES_NEEDED[p.shape];
      const sides = p.sides.slice(0, n).map((s) => num(s));
      PLOT_SIDE_LABELS[p.shape].forEach((key, i) => {
        const v = sides[i];
        if (v) inputs.push({ label: tr.t(key), value: `${tr.n(formatNumber(v, { maxDp: 2 }))} ${unit}` });
      });
      drawing = { shape: p.shape, sides: sides.map((v) => (v ? v.toNumber() : 0)), unitLabel: unit };
    }
    return { inputs, results: areaResults(ev.sqft, tr, preferred), drawing };
  },

  price: (p, tr, preferred) => {
    const ev = evaluatePrice(p);
    if (ev.status !== 'ok') return null;
    const area = entryLine(p.area, tr.t('area'), tr);
    const unitName = tr.t(`unit_${p.rateUnit}` as StringKey);
    const given = parseNonNegative(p.mode === 'total' ? p.rate : p.total);
    if (!area || !given.ok) return null;
    const inputs: ShareLine[] = [
      area,
      p.mode === 'total'
        ? { label: tr.t('ratePerUnit', { unit: unitName }), ...money(given.value, tr) }
        : { label: tr.t('totalPrice'), ...money(given.value, tr) },
    ];
    const headline =
      p.mode === 'total'
        ? { label: tr.t('totalPrice'), ...money(ev.amount, tr) }
        : { label: tr.t('rateResult', { unit: unitName }), ...money(ev.amount, tr) };
    return { inputs, results: [headline, ...areaResults(ev.areaSqft, tr, preferred).slice(0, 2)] };
  },

  divide: (p, tr) => {
    const ev = evaluateDivide(p);
    if (ev.status !== 'ok') return null;
    const area = entryLine(p.area, tr.t('area'), tr);
    if (!area) return null;
    const how =
      p.mode === 'equal'
        ? { label: tr.t('numberOfShares'), value: tr.n(String(ev.ratios.length)) }
        : { label: tr.t('ratios'), value: tr.n(ev.ratios.map(String).join(':')) };
    const results = ev.division.shares.map((s, i) => {
      const l = compoundLine(s, p.system, tr);
      return {
        label: tr.t('shareN', { n: tr.n(String(i + 1)) }),
        value: l.value,
        detail: `${l.detail} · ${tr.n(formatNumber(s, { maxDp: 2 }))} ${tr.t('unit_sqft')}`,
      };
    });
    return { inputs: [area, how], results };
  },

  arith: (p, tr, preferred) => {
    const total = evaluateArith(p);
    if (!total || total.isNegative()) return null;
    const inputs = p.parcels
      .map((parcel, i) => {
        const line = entryLine(parcel.area, tr.t('parcelN', { n: tr.n(String(i + 1)) }), tr);
        if (!line) return null;
        const sign = i === 0 && parcel.sign === 1 ? '' : parcel.sign === 1 ? '+ ' : '− ';
        return { ...line, value: `${sign}${line.value}` };
      })
      .filter((x): x is ShareLine => x !== null);
    return { inputs, results: areaResults(total, tr, preferred) };
  },
};

const TITLE: Record<CalcKind, StringKey> = {
  convert: 'kind_convert',
  plot: 'kind_plot',
  price: 'kind_price',
  divide: 'kind_divide',
  arith: 'kind_arith',
};

/** Build the share card for any calculator, or null when its inputs are not complete and valid. */
export function buildShareModel<K extends CalcKind>(
  kind: K,
  payload: PayloadByKind[K],
  tr: Translator,
  preferred: CompoundSystem,
  now: Date,
  name?: string,
): ShareCardModel | null {
  const body = (builders[kind] as Builder<K>)(payload, tr, preferred);
  if (!body) return null;
  return {
    title: tr.t(TITLE[kind]),
    name: name?.trim() || undefined,
    ...body,
    date: shareDate(now, tr),
    appName: tr.t('appName'),
    watermark: tr.t('watermark'),
    disclaimer: tr.t('disclaimerShort'),
  };
}

/** Plain-text version for "Copy as text" — the same content as the image. */
export function buildShareText(m: ShareCardModel, tr: Translator): string {
  const line = (l: ShareLine) => `• ${l.label}: ${l.value}${l.detail ? `\n  ${l.detail}` : ''}`;
  return [
    `${m.appName} — ${m.title}${m.name ? `: ${m.name}` : ''}`,
    '',
    `${tr.t('inputs')}:`,
    ...m.inputs.map(line),
    '',
    `${tr.t('resultsTitle')}:`,
    ...m.results.map(line),
    '',
    `${tr.t('date')}: ${m.date}`,
    m.disclaimer,
    m.watermark,
  ].join('\n');
}
