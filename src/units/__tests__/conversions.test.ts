import { Decimal } from '@/math/decimal';
import { convert, fromSqft, lengthAreaToSqft, toSqft, FT_PER_M } from '../conversions';
import { AREA_UNITS, SQFT_PER_UNIT, SQM_PER_SQFT } from '../definitions';

const sqm = (unit: Parameters<typeof toSqft>[1]) => fromSqft(toSqft(1, unit), 'sqm');
const round2 = (x: Decimal) => x.toDecimalPlaces(2).toString();

describe('unit definitions (exact square feet)', () => {
  it.each([
    ['daam', '21.390625'],
    ['paisa', '85.5625'],
    ['aana', '342.25'],
    ['ropani', '5476'],
    ['dhur', '182.25'],
    ['kattha', '3645'],
    ['bigha', '72900'],
    ['acre', '43560'],
    ['sqft', '1'],
  ] as const)('1 %s = %s sq ft', (unit, expected) => {
    expect(SQFT_PER_UNIT[unit].toString()).toBe(expected);
    expect(toSqft(1, unit).toString()).toBe(expected);
  });

  it('1 sq ft is exactly 0.09290304 m²', () => {
    expect(SQM_PER_SQFT.toString()).toBe('0.09290304');
    expect(fromSqft(1, 'sqm').toString()).toBe('0.09290304');
  });

  it('ropani is 74 ft square, aana 18.5 ft square, dhur 13.5 ft square', () => {
    expect(new Decimal(74).pow(2).eq(SQFT_PER_UNIT.ropani)).toBe(true);
    expect(new Decimal('18.5').pow(2).eq(SQFT_PER_UNIT.aana)).toBe(true);
    expect(new Decimal('13.5').pow(2).eq(SQFT_PER_UNIT.dhur)).toBe(true);
  });

  it('sub-unit ratios hold exactly', () => {
    expect(convert(1, 'ropani', 'aana').toString()).toBe('16');
    expect(convert(1, 'aana', 'paisa').toString()).toBe('4');
    expect(convert(1, 'paisa', 'daam').toString()).toBe('4');
    expect(convert(1, 'bigha', 'kattha').toString()).toBe('20');
    expect(convert(1, 'kattha', 'dhur').toString()).toBe('20');
  });

  it('1 hectare = 10,000 m²', () => {
    expect(convert(1, 'hectare', 'sqm').toDecimalPlaces(20).toString()).toBe('10000');
  });
});

describe('sanity checks from the brief', () => {
  it('1 ropani is 508.73704704 m² exactly', () => {
    // NOTE: the brief lists "≈ 508.72 m²". That figure comes from the rounded factor 0.0929;
    // with the exact 0.09290304 it is 508.737…, i.e. 508.74 to two decimals. We keep the exact value
    // and only assert it is within 0.02 m² of the commonly quoted figure.
    expect(sqm('ropani').toString()).toBe('508.73704704');
    expect(sqm('ropani').minus('508.72').abs().lt('0.02')).toBe(true);
  });
  it('1 aana ≈ 31.80 m²', () => expect(round2(sqm('aana'))).toBe('31.8'));
  it('1 bigha ≈ 6,772.63 m²', () => expect(round2(sqm('bigha'))).toBe('6772.63'));
  it('1 kattha ≈ 338.63 m²', () => expect(round2(sqm('kattha'))).toBe('338.63'));
  it('1 dhur ≈ 16.93 m²', () => expect(round2(sqm('dhur'))).toBe('16.93'));
  it('1 bigha ≈ 13.31 ropani', () => expect(round2(convert(1, 'bigha', 'ropani'))).toBe('13.31'));
});

describe('round trips', () => {
  it.each(AREA_UNITS)('%s → sq ft → %s is lossless to 30 digits', (unit) => {
    for (const v of ['0', '1', '0.25', '7.125', '1000', '123456.789']) {
      const back = fromSqft(toSqft(v, unit), unit);
      expect(back.toDecimalPlaces(30).eq(v)).toBe(true);
    }
  });

  it('a long chain of conversions does not drift', () => {
    let v = new Decimal('2.5');
    const chain = ['ropani', 'sqm', 'bigha', 'hectare', 'acre', 'dhur', 'aana', 'ropani'] as const;
    for (let i = 1; i < chain.length; i++) v = convert(v, chain[i - 1]!, chain[i]!);
    expect(v.toDecimalPlaces(25).toString()).toBe('2.5');
  });

  it('handles 1,000 bigha and 1 daam', () => {
    expect(toSqft(1000, 'bigha').toString()).toBe('72900000');
    // 72,900,000 ÷ 21.390625 = 3,408,035.0620…
    expect(convert(1000, 'bigha', 'daam').toDecimalPlaces(2).toString()).toBe('3408035.06');
    // 21.390625 × 0.09290304
    expect(convert(1, 'daam', 'sqm').toString()).toBe('1.98725409');
  });

  it('zero stays zero', () => {
    for (const u of AREA_UNITS) expect(toSqft(0, u).isZero()).toBe(true);
  });
});

describe('length units', () => {
  it('feet² pass through and metres² convert exactly', () => {
    expect(lengthAreaToSqft(100, 'ft').toString()).toBe('100');
    expect(lengthAreaToSqft('0.09290304', 'm').toString()).toBe('1');
  });
  it('1 m = 3.28083989… ft', () => {
    expect(FT_PER_M.toDecimalPlaces(8).toString()).toBe('3.2808399');
  });
});
