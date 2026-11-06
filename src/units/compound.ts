import { Decimal, ROUND_HALF_UP, ZERO, type DecimalInput } from '@/math/decimal';
import { formatNumber } from '@/math/format';
import { toLatinDigits } from '@/math/numerals';
import { toSqft } from './conversions';
import { SQFT_PER_UNIT, type AreaUnit } from './definitions';

/** Mixed-unit systems people actually speak in. */
export type CompoundSystem = 'ropani' | 'bigha';

export const COMPOUND_UNITS = {
  /** R-A-P-D: ropani, aana, paisa, daam */
  ropani: ['ropani', 'aana', 'paisa', 'daam'],
  /** B-K-D: bigha, kattha, dhur */
  bigha: ['bigha', 'kattha', 'dhur'],
} as const satisfies Record<CompoundSystem, readonly AreaUnit[]>;

/** How many of the system's smallest unit make one of each part (largest first). */
const SMALLEST_PER_PART: Record<CompoundSystem, readonly number[]> = {
  ropani: [256, 16, 4, 1],
  bigha: [400, 20, 1],
};

/** Decimal places kept on the last (smallest) part. */
export const COMPOUND_LAST_DP = 2;
const SCALE = 10 ** COMPOUND_LAST_DP;

export interface CompoundValue {
  system: CompoundSystem;
  /** One entry per unit in COMPOUND_UNITS[system]; all but the last are whole numbers. */
  parts: Decimal[];
  negative: boolean;
}

export function smallestUnit(system: CompoundSystem): AreaUnit {
  const units = COMPOUND_UNITS[system];
  return units[units.length - 1] as AreaUnit;
}

/**
 * Express an area as whole-unit parts with the remainder carried downward.
 *
 * The total is first rounded to 0.01 of the smallest unit and then split with integer
 * arithmetic, so rounding can never produce an impossible part such as 16 aana or 4 daam:
 * 0-15-3-3.999 rounds to 1-0-0-0, not 0-16-0-0.
 */
export function toCompound(sqft: DecimalInput, system: CompoundSystem): CompoundValue {
  const value = new Decimal(sqft);
  const smallestSqft = SQFT_PER_UNIT[smallestUnit(system) as keyof typeof SQFT_PER_UNIT];
  let remaining = value.abs().div(smallestSqft).times(SCALE).toDecimalPlaces(0, ROUND_HALF_UP);
  const negative = value.isNegative() && !remaining.isZero();

  const multipliers = SMALLEST_PER_PART[system];
  const parts: Decimal[] = [];
  multipliers.forEach((m, i) => {
    if (i === multipliers.length - 1) {
      parts.push(remaining.div(SCALE));
      return;
    }
    const size = m * SCALE;
    const whole = remaining.dividedToIntegerBy(size);
    parts.push(whole);
    remaining = remaining.minus(whole.times(size));
  });
  return { system, parts, negative };
}

/** Sum compound parts (any values, including above the natural maximum) into square feet. */
export function compoundToSqft(parts: readonly DecimalInput[], system: CompoundSystem): Decimal {
  const units = COMPOUND_UNITS[system];
  return units.reduce<Decimal>((acc, unit, i) => {
    const part = parts[i];
    return part === undefined ? acc : acc.plus(toSqft(part, unit));
  }, ZERO);
}

/**
 * "2-5-3-1.6" style text with Latin digits. The first part uses Nepali grouping;
 * the last part shows up to two decimals with trailing zeros trimmed.
 */
export function formatCompound(value: CompoundValue, separator = '-'): string {
  const last = value.parts.length - 1;
  const text = value.parts
    .map((p, i) =>
      i === last
        ? formatNumber(p, { maxDp: COMPOUND_LAST_DP, grouping: false })
        : formatNumber(p, { maxDp: 0, grouping: i === 0 }),
    )
    .join(separator);
  return value.negative ? `-${text}` : text;
}

export type CompoundParseError = 'empty' | 'negative' | 'invalid' | 'tooManyParts';
export type CompoundParseResult = { ok: true; parts: Decimal[] } | { ok: false; error: CompoundParseError };

const NUMBER_TOKEN = /^(\d+\.?\d*|\.\d+)$/;

/**
 * Parse quick-mode text such as "2-5-3-1" (ropani) or "0-3-7.25" (bigha).
 *
 * - Separators: "-", "/" or spaces. Missing trailing parts count as 0 ("2-5" = 2 ropani 5 aana).
 * - Devanagari digits are accepted.
 * - Negative values are rejected; values above the natural maximum (e.g. 20 aana) are accepted
 *   and normalised later by toCompound().
 */
export function parseCompoundText(text: string, system: CompoundSystem): CompoundParseResult {
  const s = toLatinDigits(text).replace(/[−–—]/g, '-').replace(/[, ]/g, '').trim();
  if (s === '') return { ok: false, error: 'empty' };
  if (s.startsWith('-')) return { ok: false, error: 'negative' };

  const tokens = s.split(/\s*[-/]\s*|\s+/);
  if (tokens.some((t) => t === '')) {
    // "2--3" or "2-": a doubled or trailing separator. A minus right after a separator is a negative.
    return { ok: false, error: /[-/]\s*-/.test(s) ? 'negative' : 'invalid' };
  }
  if (tokens.length > COMPOUND_UNITS[system].length) return { ok: false, error: 'tooManyParts' };
  if (!tokens.every((t) => NUMBER_TOKEN.test(t))) return { ok: false, error: 'invalid' };

  const parts = COMPOUND_UNITS[system].map((_, i) => {
    const token = tokens[i];
    return token === undefined ? ZERO : new Decimal(token.endsWith('.') ? token.slice(0, -1) : token);
  });
  return { ok: true, parts };
}
