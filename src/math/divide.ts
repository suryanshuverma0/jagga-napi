import { smallestUnit, type CompoundSystem, COMPOUND_LAST_DP } from '@/units/compound';
import { SQFT_PER_UNIT } from '@/units/definitions';
import { Decimal, ROUND_DOWN, ROUND_HALF_UP, ZERO, type DecimalInput } from './decimal';
import { toLatinDigits } from './numerals';

export const MAX_SHARES = 50;

export type DivisionError = 'tooFewShares' | 'tooManyShares' | 'badRatio' | 'zeroArea';

export interface Division {
  system: CompoundSystem;
  /** Each share in square feet. They sum exactly to `totalSqft`. */
  shares: Decimal[];
  /** The total actually divided: the input rounded to 0.01 of the system's smallest unit. */
  totalSqft: Decimal;
  /**
   * Extra area given to the last share because the others were rounded down to 0.01 of the
   * smallest unit (daam or dhur). Zero when the split is exact.
   */
  remainderSqft: Decimal;
}

export type DivisionResult = { ok: true; value: Division } | { ok: false; error: DivisionError };

/**
 * Split an area by ratios (e.g. [2, 1, 1]) without losing or inventing land.
 *
 * Shares are computed in whole hundredths of the system's smallest unit (0.01 daam for the
 * Ropani system, 0.01 dhur for the Bigha system), the precision every result is shown at.
 * All shares but the last are rounded down; the last share takes whatever is left, and that
 * extra is reported in `remainderSqft` so it can be shown to the family explicitly.
 */
export function divideArea(
  totalSqft: DecimalInput,
  ratios: readonly DecimalInput[],
  system: CompoundSystem,
): DivisionResult {
  if (ratios.length < 2) return { ok: false, error: 'tooFewShares' };
  if (ratios.length > MAX_SHARES) return { ok: false, error: 'tooManyShares' };
  const r = ratios.map((x) => new Decimal(x));
  if (r.some((x) => !x.isPositive() || x.isZero())) return { ok: false, error: 'badRatio' };

  const unitSqft = SQFT_PER_UNIT[smallestUnit(system) as keyof typeof SQFT_PER_UNIT];
  const scale = 10 ** COMPOUND_LAST_DP;
  const totalTicks = new Decimal(totalSqft).div(unitSqft).times(scale).toDecimalPlaces(0, ROUND_HALF_UP);
  if (totalTicks.lte(ZERO)) return { ok: false, error: 'zeroArea' };

  const ratioSum = r.reduce<Decimal>((acc, x) => acc.plus(x), ZERO);
  const exactTicks = r.map((x) => totalTicks.times(x).div(ratioSum));
  const ticks = exactTicks.map((x) => x.toDecimalPlaces(0, ROUND_DOWN));
  const allButLast = ticks.slice(0, -1).reduce<Decimal>((acc, x) => acc.plus(x), ZERO);
  const lastTicks = totalTicks.minus(allButLast);
  const remainderTicks = lastTicks.minus(ticks[ticks.length - 1] as Decimal);
  ticks[ticks.length - 1] = lastTicks;

  const toSqft = (t: Decimal) => t.div(scale).times(unitSqft);
  return {
    ok: true,
    value: {
      system,
      shares: ticks.map(toSqft),
      totalSqft: toSqft(totalTicks),
      remainderSqft: toSqft(remainderTicks),
    },
  };
}

export type RatioParseResult = { ok: true; ratios: Decimal[] } | { ok: false; error: 'empty' | 'invalid' };

/** Parse "2:1:1" (also "2-1-1", "2 1 1", Devanagari digits). Every part must be > 0. */
export function parseRatios(text: string): RatioParseResult {
  const s = toLatinDigits(text).trim();
  if (s === '') return { ok: false, error: 'empty' };
  const tokens = s.split(/\s*[:：\-/,]\s*|\s+/);
  if (!tokens.every((t) => /^(\d+\.?\d*|\.\d+)$/.test(t))) return { ok: false, error: 'invalid' };
  const ratios = tokens.map((t) => new Decimal(t.endsWith('.') ? t.slice(0, -1) : t));
  if (ratios.some((x) => x.isZero())) return { ok: false, error: 'invalid' };
  return { ok: true, ratios };
}

export function equalRatios(count: number): Decimal[] {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => new Decimal(1));
}
