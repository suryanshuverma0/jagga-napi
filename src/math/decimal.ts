import DecimalBase, { type Numeric } from 'decimal.js-light';

/**
 * The single Decimal constructor used by every calculation in the app.
 *
 * 40 significant digits is far beyond any land area or price a person will type
 * (1,000 bigha in daam is ~3.4 million; the most precise exact factor, 0.09290304, has 8 dp),
 * so repeated conversions never accumulate visible error.
 */
export const Decimal = DecimalBase.clone({
  precision: 40,
  rounding: DecimalBase.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

// A value and a type with the same name, like a class.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Decimal = DecimalBase;
export type DecimalInput = Numeric;

export const ROUND_HALF_UP = DecimalBase.ROUND_HALF_UP;
export const ROUND_DOWN = DecimalBase.ROUND_DOWN;

export const ZERO: Decimal = new Decimal(0);
export const ONE: Decimal = new Decimal(1);

export function d(value: DecimalInput): Decimal {
  return new Decimal(value);
}

export function sum(values: readonly Decimal[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(v), ZERO);
}

/** Largest integer ≤ x (decimal.js-light has no floor()). */
export function floor(x: Decimal): Decimal {
  const truncated = x.toDecimalPlaces(0, ROUND_DOWN);
  return x.isNegative() && !truncated.eq(x) ? truncated.minus(1) : truncated;
}
