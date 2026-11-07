import { formatNumber, groupNepali } from '../format';
import { localizeDigits, toDevanagariDigits, toLatinDigits } from '../numerals';
import { cleanNumberTyping, normalizeNumberText, parseNonNegative, parsePositive } from '../parse';

describe('groupNepali', () => {
  it.each([
    ['0', '0'],
    ['999', '999'],
    ['1000', '1,000'],
    ['12345', '12,345'],
    ['100000', '1,00,000'],
    ['1234567', '12,34,567'],
    ['10000000', '1,00,00,000'],
    ['123456789012', '1,23,45,67,89,012'],
  ])('%s → %s', (input, expected) => expect(groupNepali(input)).toBe(expected));
});

describe('formatNumber', () => {
  it('groups, rounds half-up and trims trailing zeros', () => {
    expect(formatNumber('1234567.891', { maxDp: 2 })).toBe('12,34,567.89');
    expect(formatNumber('0.125', { maxDp: 2 })).toBe('0.13');
    expect(formatNumber('5476.00', { maxDp: 2 })).toBe('5,476');
    expect(formatNumber('5476.5', { maxDp: 2, minDp: 2 })).toBe('5,476.50');
    expect(formatNumber('99.995', { maxDp: 2 })).toBe('100');
  });
  it('can disable grouping', () => {
    expect(formatNumber('123456', { maxDp: 0, grouping: false })).toBe('123456');
  });
  it('formats negatives and avoids negative zero', () => {
    expect(formatNumber('-1234.5', { maxDp: 1 })).toBe('-1,234.5');
    expect(formatNumber('-0.001', { maxDp: 2 })).toBe('0');
  });
  it('handles zero and huge values', () => {
    expect(formatNumber(0, { maxDp: 2 })).toBe('0');
    expect(formatNumber('72900000000', { maxDp: 2 })).toBe('72,90,00,00,000');
  });
});

describe('numerals', () => {
  it('converts both ways', () => {
    expect(toDevanagariDigits('12,34,567.89')).toBe('१२,३४,५६७.८९');
    expect(toLatinDigits('१२,३४,५६७.८९')).toBe('12,34,567.89');
    expect(toDevanagariDigits('2-5-3-1.6 ropani')).toBe('२-५-३-१.६ ropani');
  });
  it('localizeDigits respects the script', () => {
    expect(localizeDigits('2024', 'latin')).toBe('2024');
    expect(localizeDigits('2024', 'devanagari')).toBe('२०२४');
  });
});

describe('parsing user input', () => {
  const val = (r: ReturnType<typeof parseNonNegative>) => (r.ok ? r.value.toString() : r.error);

  it('accepts Latin and Devanagari digits, grouping and spaces', () => {
    expect(val(parseNonNegative('12.5'))).toBe('12.5');
    expect(val(parseNonNegative('१२.५'))).toBe('12.5');
    expect(val(parseNonNegative('1,00,000'))).toBe('100000');
    expect(val(parseNonNegative(' 42 '))).toBe('42');
    expect(val(parseNonNegative('.5'))).toBe('0.5');
    expect(val(parseNonNegative('7.'))).toBe('7');
    expect(val(parseNonNegative('0'))).toBe('0');
  });
  it('rejects negatives, empties and garbage', () => {
    expect(val(parseNonNegative('-3'))).toBe('negative');
    expect(val(parseNonNegative('−3'))).toBe('negative');
    expect(val(parseNonNegative(''))).toBe('empty');
    expect(val(parseNonNegative('1.2.3'))).toBe('invalid');
    expect(val(parseNonNegative('abc'))).toBe('invalid');
    expect(val(parseNonNegative('.'))).toBe('invalid');
  });
  it('parsePositive also rejects zero', () => {
    expect(val(parsePositive('0'))).toBe('invalid');
    expect(val(parsePositive('0.01'))).toBe('0.01');
  });
  it('normalizeNumberText strips grouping', () => {
    expect(normalizeNumberText('१,२३४')).toBe('1234');
  });
  it('cleanNumberTyping keeps digits, one decimal point and minus signs', () => {
    expect(cleanNumberTyping('12.3.4')).toBe('12.34');
    expect(cleanNumberTyping('५a.५')).toBe('5.5');
    expect(cleanNumberTyping('−५')).toBe('-5');
    expect(cleanNumberTyping('1,00,000')).toBe('100000');
    expect(cleanNumberTyping('')).toBe('');
    expect(val(parseNonNegative(cleanNumberTyping('-3')))).toBe('negative');
  });
});
