import type { StringKey, Translator } from '@/i18n';
import type { Decimal } from '@/math/decimal';
import { formatNumber } from '@/math/format';
import { COMPOUND_UNITS, formatCompound, toCompound, type CompoundSystem } from '@/units/compound';
import { fromSqft } from '@/units/conversions';
import type { AreaUnit } from '@/units/definitions';

export interface ResultLine {
  key: string;
  /** e.g. "Ropani-Aana-Paisa-Daam" or "Sq ft" */
  label: string;
  /** Display value with localised digits, e.g. "२-५-३-१.६" or "12,954.16" */
  value: string;
  /** Optional spelled-out form, e.g. "2 Ropani 5 Aana 3 Paisa 1.6 Daam" */
  detail?: string;
  /** What goes to the clipboard. */
  copyText: string;
}

const unitKey = (u: AreaUnit) => `unit_${u}` as StringKey;

/** "2-5-3-1.6" plus "2 Ropani 5 Aana 3 Paisa 1.6 Daam" (zero parts omitted from the detail). */
export function compoundLine(sqft: Decimal, system: CompoundSystem, tr: Translator): ResultLine {
  const cv = toCompound(sqft, system);
  const value = tr.n(formatCompound(cv));
  const units = COMPOUND_UNITS[system];
  const last = cv.parts.length - 1;
  const spelled = cv.parts
    .map((p, i) => ({
      p,
      text: formatNumber(p, { maxDp: i === last ? 2 : 0, grouping: i === 0 }),
      unit: tr.t(unitKey(units[i] as AreaUnit)),
    }))
    .filter((x) => !x.p.isZero())
    .map((x) => `${tr.n(x.text)} ${x.unit}`)
    .join(' ');
  const detail = `${cv.negative ? '-' : ''}${spelled || `${tr.n('0')} ${tr.t(unitKey(units[last] as AreaUnit))}`}`;
  const label = tr.t(system === 'ropani' ? 'systemLabel_ropani' : 'systemLabel_bigha');
  return { key: system, label, value, detail, copyText: `${value} (${label})` };
}

function simpleLine(
  sqft: Decimal,
  unit: AreaUnit,
  maxDp: number,
  tr: Translator,
  label?: string,
): ResultLine {
  const value = tr.n(formatNumber(fromSqft(sqft, unit), { maxDp }));
  const l = label ?? tr.t(unitKey(unit));
  return { key: unit, label: l, value, copyText: `${value} ${l}` };
}

/**
 * Every representation shown under a result: both compound systems (the preferred one first),
 * square feet, square metres, acre, hectare, and the totals people quote prices in (aana, dhur).
 */
export function buildAreaLines(
  sqft: Decimal,
  tr: Translator,
  preferred: CompoundSystem = 'ropani',
): ResultLine[] {
  const other: CompoundSystem = preferred === 'ropani' ? 'bigha' : 'ropani';
  const totalUnits: AreaUnit[] = preferred === 'ropani' ? ['aana', 'dhur'] : ['dhur', 'aana'];
  return [
    compoundLine(sqft, preferred, tr),
    compoundLine(sqft, other, tr),
    simpleLine(sqft, 'sqft', 2, tr),
    simpleLine(sqft, 'sqm', 2, tr),
    ...totalUnits.map((u) => {
      const line = simpleLine(sqft, u, 2, tr, tr.t('totalIn', { unit: tr.t(unitKey(u)) }));
      return { ...line, key: `total_${u}`, copyText: `${line.value} ${tr.t(unitKey(u))}` };
    }),
    simpleLine(sqft, 'acre', 4, tr),
    simpleLine(sqft, 'hectare', 4, tr),
  ];
}
