import { Decimal, ROUND_HALF_UP, type DecimalInput } from './decimal';

/**
 * Nepali/South-Asian digit grouping: the last three digits, then groups of two.
 * "1234567" → "12,34,567". Expects digits only (no sign, no decimals).
 */
export function groupNepali(intDigits: string): string {
  if (intDigits.length <= 3) return intDigits;
  const last3 = intDigits.slice(-3);
  let head = intDigits.slice(0, -3);
  const groups: string[] = [];
  while (head.length > 2) {
    groups.unshift(head.slice(-2));
    head = head.slice(0, -2);
  }
  if (head.length > 0) groups.unshift(head);
  return `${groups.join(',')},${last3}`;
}

export interface NumberFormatOptions {
  /** Maximum decimal places shown (rounded half-up). */
  maxDp: number;
  /** Minimum decimal places shown (zero-padded). Default 0. */
  minDp?: number;
  /** Apply Nepali grouping to the integer part. Default true. */
  grouping?: boolean;
}

/**
 * Format a decimal for display with Latin digits. This is the only place the app rounds
 * a value for presentation; everything upstream keeps full precision.
 */
export function formatNumber(value: DecimalInput, options: NumberFormatOptions): string {
  const { maxDp, minDp = 0, grouping = true } = options;
  const rounded = new Decimal(value).toDecimalPlaces(maxDp, ROUND_HALF_UP);
  const negative = rounded.isNegative() && !rounded.isZero();
  const fixed = rounded.abs().toFixed(maxDp);
  let [intPart = '0', fracPart = ''] = fixed.split('.');
  // Trim trailing zeros, but keep at least minDp digits.
  let end = fracPart.length;
  while (end > minDp && fracPart[end - 1] === '0') end--;
  fracPart = fracPart.slice(0, end);
  if (grouping) intPart = groupNepali(intPart);
  return `${negative ? '-' : ''}${intPart}${fracPart ? `.${fracPart}` : ''}`;
}
