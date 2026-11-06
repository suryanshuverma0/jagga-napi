export type NumeralScript = 'latin' | 'devanagari';

const DEVANAGARI_ZERO = 0x0966; // '०'

/** Replace Latin digits 0-9 with Devanagari digits ०-९. Other characters are untouched. */
export function toDevanagariDigits(text: string): string {
  return text.replace(/[0-9]/g, (ch) => String.fromCharCode(DEVANAGARI_ZERO + (ch.charCodeAt(0) - 48)));
}

/** Replace Devanagari digits ०-९ with Latin digits 0-9. Other characters are untouched. */
export function toLatinDigits(text: string): string {
  return text.replace(/[०-९]/g, (ch) => String.fromCharCode(48 + (ch.charCodeAt(0) - DEVANAGARI_ZERO)));
}

export function localizeDigits(text: string, script: NumeralScript): string {
  return script === 'devanagari' ? toDevanagariDigits(text) : text;
}
