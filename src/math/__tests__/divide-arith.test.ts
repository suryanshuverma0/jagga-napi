import { compoundToSqft, formatCompound, toCompound } from '@/units/compound';
import { toSqft } from '@/units/conversions';
import { combineAreas, isNegativeArea } from '../arithmetic';
import { Decimal } from '../decimal';
import { divideArea, equalRatios, parseRatios, MAX_SHARES } from '../divide';

const show = (sqft: Decimal, system: 'ropani' | 'bigha' = 'ropani') =>
  formatCompound(toCompound(sqft, system));

describe('divideArea', () => {
  it('splits 1 ropani into 4 equal shares exactly', () => {
    const r = divideArea(toSqft(1, 'ropani'), equalRatios(4), 'ropani');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.shares.map((s) => show(s))).toEqual(['0-4-0-0', '0-4-0-0', '0-4-0-0', '0-4-0-0']);
    expect(r.value.remainderSqft.isZero()).toBe(true);
  });

  it('gives the rounding remainder to the last share, and the shares sum to the total', () => {
    // 1 ropani = 256 daam = 25,600 hundredths; ÷3 = 8,533.33 → 8,533, 8,533, 8,534
    const r = divideArea(toSqft(1, 'ropani'), equalRatios(3), 'ropani');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const { shares, remainderSqft, totalSqft } = r.value;
    expect(shares.map((s) => show(s))).toEqual(['0-5-1-1.33', '0-5-1-1.33', '0-5-1-1.34']);
    expect(show(remainderSqft)).toBe('0-0-0-0.01');
    expect(shares.reduce((a, b) => a.plus(b)).eq(totalSqft)).toBe(true);
    expect(totalSqft.eq(toSqft(1, 'ropani'))).toBe(true);
  });

  it('custom ratios 2:1:1 in the Bigha system', () => {
    const r = divideArea(toSqft(1, 'bigha'), [2, 1, 1], 'bigha');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.shares.map((s) => show(s, 'bigha'))).toEqual(['0-10-0', '0-5-0', '0-5-0']);
  });

  it('uneven ratios that do not divide evenly', () => {
    // 7 dhur split 1:1:1 → 2.33, 2.33, 2.34
    const r = divideArea(toSqft(7, 'dhur'), [1, 1, 1], 'bigha');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.shares.map((s) => show(s, 'bigha'))).toEqual(['0-0-2.33', '0-0-2.33', '0-0-2.34']);
    expect(show(r.value.remainderSqft, 'bigha')).toBe('0-0-0.01');
  });

  it('decimal ratios', () => {
    const r = divideArea(toSqft(10, 'kattha'), ['1.5', '0.5'], 'bigha');
    expect(r.ok && r.value.shares.map((s) => show(s, 'bigha'))).toEqual(['0-7-10', '0-2-10']);
  });

  it('very large (1,000 bigha) and very small (1 daam) areas', () => {
    const big = divideArea(toSqft(1000, 'bigha'), equalRatios(3), 'bigha');
    expect(big.ok && big.value.shares.map((s) => show(s, 'bigha'))).toEqual([
      '333-6-13.33',
      '333-6-13.33',
      '333-6-13.34',
    ]);
    const tiny = divideArea(toSqft(1, 'daam'), equalRatios(3), 'ropani');
    expect(tiny.ok && tiny.value.shares.map((s) => show(s))).toEqual([
      '0-0-0-0.33',
      '0-0-0-0.33',
      '0-0-0-0.34',
    ]);
  });

  it('validates input', () => {
    expect(divideArea(100, [1], 'ropani')).toEqual({ ok: false, error: 'tooFewShares' });
    expect(divideArea(100, equalRatios(MAX_SHARES + 1), 'ropani')).toEqual({
      ok: false,
      error: 'tooManyShares',
    });
    expect(divideArea(100, [1, 0], 'ropani')).toEqual({ ok: false, error: 'badRatio' });
    expect(divideArea(100, [1, -1], 'ropani')).toEqual({ ok: false, error: 'badRatio' });
    expect(divideArea(0, [1, 1], 'ropani')).toEqual({ ok: false, error: 'zeroArea' });
  });
});

describe('parseRatios', () => {
  const p = (t: string) => {
    const r = parseRatios(t);
    return r.ok ? r.ratios.map(String) : r.error;
  };
  it('parses colon, dash, space and Devanagari forms', () => {
    expect(p('2:1:1')).toEqual(['2', '1', '1']);
    expect(p('2 : 1 : 1')).toEqual(['2', '1', '1']);
    expect(p('2-1-1')).toEqual(['2', '1', '1']);
    expect(p('२:१:१')).toEqual(['2', '1', '1']);
    expect(p('1.5:0.5')).toEqual(['1.5', '0.5']);
  });
  it('rejects zero, empty and malformed ratios', () => {
    expect(p('')).toBe('empty');
    expect(p('2:0:1')).toBe('invalid');
    expect(p('2::1')).toBe('invalid');
    expect(p('a:b')).toBe('invalid');
  });
});

describe('combineAreas', () => {
  it('1-4-0-0 + 0-12-2-0 − 300 sq ft (brief example)', () => {
    const total = combineAreas([
      { sign: 1, sqft: compoundToSqft([1, 4, 0, 0], 'ropani') },
      { sign: 1, sqft: compoundToSqft([0, 12, 2, 0], 'ropani') },
      { sign: -1, sqft: new Decimal(300) },
    ]);
    // 6845 + 4278.125 − 300 = 10823.125 sq ft = 505.975… daam → 505.98 = 1-15-2-1.98
    expect(total.toString()).toBe('10823.125');
    expect(show(total)).toBe('1-15-2-1.98');
  });
  it('can go negative and reports it', () => {
    const total = combineAreas([
      { sign: 1, sqft: new Decimal(100) },
      { sign: -1, sqft: new Decimal(150) },
    ]);
    expect(isNegativeArea(total)).toBe(true);
    expect(isNegativeArea(new Decimal(0))).toBe(false);
  });
  it('empty list is zero', () => {
    expect(combineAreas([]).isZero()).toBe(true);
  });
});
