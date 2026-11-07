import type { StringKey, Translator } from '@/i18n';
import { formatNumber } from '@/math/format';
import { convert } from '@/units/conversions';
import type { AreaUnit } from '@/units/definitions';

export interface ReferenceRow {
  /** "1 Ropani" */
  lhs: string;
  /** ["16 Aana", "64 Paisa", …] */
  rhs: string[];
}

export interface ReferenceSection {
  title: StringKey;
  rows: ReferenceRow[];
}

/** [unit, targets]. Every number is computed from definitions.ts, never typed by hand. */
const TABLE: { title: StringKey; rows: [AreaUnit, AreaUnit[]][] }[] = [
  {
    title: 'ref_ropaniSystem',
    rows: [
      ['ropani', ['aana', 'paisa', 'daam', 'sqft', 'sqm']],
      ['aana', ['paisa', 'daam', 'sqft', 'sqm']],
      ['paisa', ['daam', 'sqft', 'sqm']],
      ['daam', ['sqft', 'sqm']],
    ],
  },
  {
    title: 'ref_bighaSystem',
    rows: [
      ['bigha', ['kattha', 'dhur', 'sqft', 'sqm']],
      ['kattha', ['dhur', 'sqft', 'sqm']],
      ['dhur', ['sqft', 'sqm']],
    ],
  },
  {
    title: 'ref_cross',
    rows: [
      ['bigha', ['ropani']],
      ['ropani', ['kattha', 'dhur']],
      ['kattha', ['ropani', 'aana']],
      ['aana', ['dhur']],
    ],
  },
  {
    title: 'ref_metric',
    rows: [
      ['sqm', ['sqft']],
      ['acre', ['sqft', 'sqm', 'ropani', 'bigha']],
      ['hectare', ['sqm', 'ropani', 'bigha']],
    ],
  },
];

export function buildReference(tr: Translator): ReferenceSection[] {
  const name = (u: AreaUnit) => tr.t(`unit_${u}` as StringKey);
  return TABLE.map((section) => ({
    title: section.title,
    rows: section.rows.map(([from, targets]) => ({
      lhs: `${tr.n('1')} ${name(from)}`,
      rhs: targets.map((to) => {
        const v = convert(1, from, to);
        const dp = v.isInteger() ? 0 : v.lt(1) ? 4 : 2;
        return `${tr.n(formatNumber(v, { maxDp: dp }))} ${name(to)}`;
      }),
    })),
  }));
}
