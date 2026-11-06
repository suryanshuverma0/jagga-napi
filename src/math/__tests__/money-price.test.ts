import { toSqft } from '@/units/conversions';
import { amountInWords, formatRupees } from '../money';
import { ratePerUnit, totalPrice, RATE_UNITS } from '../price';

describe('totalPrice', () => {
  it('rate per aana × area', () => {
    // 1 ropani = 16 aana at Rs 25,00,000 per aana = Rs 4 crore
    expect(totalPrice(toSqft(1, 'ropani'), '2500000', 'aana').toString()).toBe('40000000');
  });
  it('rate per dhur, kattha, ropani and sq ft', () => {
    const area = toSqft(1, 'bigha');
    expect(totalPrice(area, 1000, 'dhur').toString()).toBe('400000');
    expect(totalPrice(area, 1000, 'kattha').toString()).toBe('20000');
    expect(totalPrice(toSqft(2, 'ropani'), 1000, 'ropani').toString()).toBe('2000');
    expect(totalPrice(1500, '1250.50', 'sqft').toString()).toBe('1875750');
  });
  it('mixed units: 2-5-3-1 ropani at Rs 12 lakh per aana', () => {
    // 2-5-3-1 = 37 aana + 3 paisa + 1 daam = 37.8125 aana
    const area = toSqft(2, 'ropani').plus(toSqft(5, 'aana')).plus(toSqft(3, 'paisa')).plus(toSqft(1, 'daam'));
    expect(totalPrice(area, 1200000, 'aana').toString()).toBe('45375000');
  });
  it('zero area or zero rate gives zero', () => {
    expect(totalPrice(0, 1000, 'aana').isZero()).toBe(true);
    expect(totalPrice(1000, 0, 'aana').isZero()).toBe(true);
  });
});

describe('ratePerUnit (reverse mode)', () => {
  it('total ÷ area in the chosen unit', () => {
    expect(ratePerUnit(toSqft(1, 'ropani'), 40000000, 'aana')?.toString()).toBe('2500000');
    expect(ratePerUnit(toSqft(1, 'kattha'), 500000, 'dhur')?.toString()).toBe('25000');
  });
  it('round-trips with totalPrice for every unit', () => {
    const area = toSqft('3.37', 'ropani');
    for (const u of RATE_UNITS) {
      const rate = ratePerUnit(area, 12345678, u)!;
      expect(totalPrice(area, rate, u).toDecimalPlaces(20).toString()).toBe('12345678');
    }
  });
  it('returns null for zero area', () => {
    expect(ratePerUnit(0, 1000, 'aana')).toBeNull();
  });
});

describe('formatRupees', () => {
  it('uses Nepali grouping and up to two decimals', () => {
    expect(formatRupees('45375000')).toBe('4,53,75,000');
    expect(formatRupees('1234.5')).toBe('1,234.5');
    expect(formatRupees('1234.567')).toBe('1,234.57');
    expect(formatRupees(0)).toBe('0');
  });
});

describe('amountInWords', () => {
  it('English: lakh, crore, arab', () => {
    expect(amountInWords('12345678', 'en')).toBe('1 crore 23 lakh 45 thousand 6 hundred 78 rupees');
    expect(amountInWords('100000', 'en')).toBe('1 lakh rupees');
    expect(amountInWords('2500000000', 'en')).toBe('2 arab 50 crore rupees');
    expect(amountInWords('45', 'en')).toBe('45 rupees');
  });
  it('Nepali: लाख, करोड, अर्ब', () => {
    expect(amountInWords('12345678', 'ne')).toBe('1 करोड 23 लाख 45 हजार 6 सय 78 रुपैयाँ');
    expect(amountInWords('1000000000', 'ne')).toBe('1 अर्ब रुपैयाँ');
    expect(amountInWords('450000', 'ne')).toBe('4 लाख 50 हजार रुपैयाँ');
  });
  it('rounds paisa to the nearest rupee', () => {
    expect(amountInWords('999.5', 'en')).toBe('1 thousand rupees');
    expect(amountInWords('0.4', 'en')).toBe('0 rupees');
  });
  it('keeps very large arab counts as a grouped number', () => {
    expect(amountInWords('123456000000000', 'en')).toBe('1,23,456 arab rupees');
  });
});
