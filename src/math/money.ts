import { Decimal, ROUND_HALF_UP, type DecimalInput } from './decimal';
import { formatNumber, groupNepali } from './format';

/** "1,23,45,678.5" → rupees with Nepali grouping, up to 2 decimals (paisa), trailing zeros trimmed. */
export function formatRupees(amount: DecimalInput): string {
  return formatNumber(amount, { maxDp: 2, minDp: 0 });
}

export type WordsLanguage = 'en' | 'ne';

const SCALES: readonly { value: Decimal; en: string; ne: string }[] = [
  { value: new Decimal('1000000000'), en: 'arab', ne: 'अर्ब' },
  { value: new Decimal('10000000'), en: 'crore', ne: 'करोड' },
  { value: new Decimal('100000'), en: 'lakh', ne: 'लाख' },
  { value: new Decimal('1000'), en: 'thousand', ne: 'हजार' },
  { value: new Decimal('100'), en: 'hundred', ne: 'सय' },
];

const RUPEES = { en: 'rupees', ne: 'रुपैयाँ' } as const;

/**
 * Amount in words the way prices are written in Nepal, using numerals with scale words:
 * 12345678 → "1 crore 23 lakh 45 thousand 6 hundred 78 rupees" / "1 करोड 23 लाख 45 हजार 6 सय 78 रुपैयाँ".
 * Rounded to whole rupees. Digits are Latin; localise them for display.
 * Amounts of 100 arab and above keep the arab count as a grouped number ("1,234 arab …").
 */
export function amountInWords(amount: DecimalInput, lang: WordsLanguage): string {
  let rest = new Decimal(amount).abs().toDecimalPlaces(0, ROUND_HALF_UP);
  const negative = new Decimal(amount).isNegative() && !rest.isZero();
  if (rest.isZero()) return `0 ${RUPEES[lang]}`;

  const words: string[] = [];
  for (const scale of SCALES) {
    const count = rest.dividedToIntegerBy(scale.value);
    if (!count.isZero()) {
      words.push(`${groupNepali(count.toFixed(0))} ${scale[lang]}`);
      rest = rest.minus(count.times(scale.value));
    }
  }
  if (!rest.isZero()) words.push(rest.toFixed(0));
  words.push(RUPEES[lang]);
  return `${negative ? '-' : ''}${words.join(' ')}`;
}
