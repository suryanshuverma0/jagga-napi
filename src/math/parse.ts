import { Decimal } from './decimal';
import { toLatinDigits } from './numerals';

export type NumberParseError = 'empty' | 'negative' | 'invalid';
export type NumberParseResult = { ok: true; value: Decimal } | { ok: false; error: NumberParseError };

const MINUS_SIGNS = /[−–—-]/;
const NON_NEGATIVE_NUMBER = /^(\d+\.?\d*|\.\d+)$/;

/**
 * Normalise user-typed number text: Devanagari → Latin digits, drop grouping commas and spaces,
 * accept the Devanagari danda-free decimal point only ('.').
 */
export function normalizeNumberText(text: string): string {
  return toLatinDigits(text)
    .replace(/[,\s ]/g, '')
    .replace(/[٫․]/g, '.');
}

/** Parse a non-negative decimal typed by the user (Latin or Devanagari digits, grouping allowed). */
export function parseNonNegative(text: string): NumberParseResult {
  const s = normalizeNumberText(text);
  if (s === '') return { ok: false, error: 'empty' };
  if (MINUS_SIGNS.test(s.charAt(0))) return { ok: false, error: 'negative' };
  if (!NON_NEGATIVE_NUMBER.test(s)) return { ok: false, error: 'invalid' };
  return { ok: true, value: new Decimal(s.endsWith('.') ? s.slice(0, -1) : s) };
}

/** Like parseNonNegative but also rejects zero. */
export function parsePositive(text: string): NumberParseResult {
  const r = parseNonNegative(text);
  if (r.ok && r.value.isZero()) return { ok: false, error: 'invalid' };
  return r;
}

/**
 * Live input cleaning: Devanagari digits → Latin, keep digits, one decimal point and minus signs.
 * Minus signs are kept on purpose so parseNonNegative can report "negative" instead of the
 * value silently changing sign.
 */
export function cleanNumberTyping(text: string): string {
  const latin = toLatinDigits(text)
    .replace(/[−–—]/g, '-')
    .replace(/[^0-9.-]/g, '');
  const firstDot = latin.indexOf('.');
  if (firstDot === -1) return latin;
  return latin.slice(0, firstDot + 1) + latin.slice(firstDot + 1).replace(/\./g, '');
}
