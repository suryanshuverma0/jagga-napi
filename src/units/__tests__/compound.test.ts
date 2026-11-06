import { compoundToSqft, formatCompound, parseCompoundText, toCompound } from '../compound';
import { toSqft } from '../conversions';

const fmt = (sqft: Parameters<typeof toCompound>[0], system: 'ropani' | 'bigha') =>
  formatCompound(toCompound(sqft, system));

describe('toCompound / formatCompound — Ropani system (R-A-P-D)', () => {
  it('formats the brief example 2-5-3-1.6', () => {
    const sqft = compoundToSqft(['2', '5', '3', '1.6'], 'ropani');
    expect(sqft.toString()).toBe('12954.1625');
    expect(fmt(sqft, 'ropani')).toBe('2-5-3-1.6');
  });

  it('whole units', () => {
    expect(fmt(5476, 'ropani')).toBe('1-0-0-0');
    expect(fmt(342.25, 'ropani')).toBe('0-1-0-0');
    expect(fmt(85.5625, 'ropani')).toBe('0-0-1-0');
    expect(fmt(21.390625, 'ropani')).toBe('0-0-0-1');
  });

  it('never shows 0-16-0-0: input above the natural maximum is normalised', () => {
    expect(fmt(compoundToSqft([0, 16, 0, 0], 'ropani'), 'ropani')).toBe('1-0-0-0');
    expect(fmt(compoundToSqft([0, 20, 0, 0], 'ropani'), 'ropani')).toBe('1-4-0-0');
    expect(fmt(compoundToSqft([0, 0, 0, 4], 'ropani'), 'ropani')).toBe('0-0-1-0');
    expect(fmt(compoundToSqft([1, 15, 3, 4], 'ropani'), 'ropani')).toBe('2-0-0-0');
  });

  it('rounding the last part up carries all the way to the top', () => {
    expect(fmt(toSqft('255.999', 'daam'), 'ropani')).toBe('1-0-0-0');
    expect(fmt(toSqft('255.994', 'daam'), 'ropani')).toBe('0-15-3-3.99');
  });

  it('keeps up to 2 decimals on the last part, trailing zeros trimmed', () => {
    expect(fmt(toSqft('1.25', 'daam'), 'ropani')).toBe('0-0-0-1.25');
    expect(fmt(toSqft('1.5', 'daam'), 'ropani')).toBe('0-0-0-1.5');
    expect(fmt(toSqft('1.005', 'daam'), 'ropani')).toBe('0-0-0-1.01');
  });

  it('zero, very small and very large values', () => {
    expect(fmt(0, 'ropani')).toBe('0-0-0-0');
    expect(fmt(toSqft('0.001', 'daam'), 'ropani')).toBe('0-0-0-0');
    // 3,408,035.06 daam = 13,312 ropani (3,407,872) + 10 aana (160) + 0 paisa + 3.06 daam
    expect(fmt(toSqft(1000, 'bigha'), 'ropani')).toBe('13,312-10-0-3.06');
  });

  it('negative values get a leading minus; negative zero does not', () => {
    expect(fmt(-5476, 'ropani')).toBe('-1-0-0-0');
    expect(fmt('-0.0001', 'ropani')).toBe('0-0-0-0');
  });

  it('exposes whole-number parts', () => {
    const v = toCompound(compoundToSqft([2, 5, 3, '1.6'], 'ropani'), 'ropani');
    expect(v.parts.map(String)).toEqual(['2', '5', '3', '1.6']);
  });
});

describe('toCompound / formatCompound — Bigha system (B-K-D)', () => {
  it('formats the brief example 0-3-7.25', () => {
    const sqft = compoundToSqft(['0', '3', '7.25'], 'bigha');
    expect(sqft.toString()).toBe('12256.3125');
    expect(fmt(sqft, 'bigha')).toBe('0-3-7.25');
  });

  it('whole units and carries', () => {
    expect(fmt(72900, 'bigha')).toBe('1-0-0');
    expect(fmt(3645, 'bigha')).toBe('0-1-0');
    expect(fmt(182.25, 'bigha')).toBe('0-0-1');
    expect(fmt(compoundToSqft([0, 20, 0], 'bigha'), 'bigha')).toBe('1-0-0');
    expect(fmt(compoundToSqft([0, 19, 20], 'bigha'), 'bigha')).toBe('1-0-0');
    expect(fmt(toSqft('399.996', 'dhur'), 'bigha')).toBe('1-0-0');
  });

  it('1,000 bigha', () => {
    expect(fmt(toSqft(1000, 'bigha'), 'bigha')).toBe('1,000-0-0');
  });

  it('1 ropani in bigha system', () => {
    // 5476 / 182.25 = 30.0466… dhur
    expect(fmt(5476, 'bigha')).toBe('0-1-10.05');
  });
});

describe('compoundToSqft', () => {
  it('missing trailing parts count as zero', () => {
    expect(compoundToSqft([2], 'ropani').toString()).toBe('10952');
    expect(compoundToSqft([], 'bigha').toString()).toBe('0');
  });
});

describe('parseCompoundText', () => {
  const parts = (text: string, system: 'ropani' | 'bigha' = 'ropani') => {
    const r = parseCompoundText(text, system);
    return r.ok ? r.parts.map(String) : r.error;
  };

  it('parses full and partial forms', () => {
    expect(parts('2-5-3-1')).toEqual(['2', '5', '3', '1']);
    expect(parts('2-5')).toEqual(['2', '5', '0', '0']);
    expect(parts('2')).toEqual(['2', '0', '0', '0']);
    expect(parts('0-3-7.25', 'bigha')).toEqual(['0', '3', '7.25']);
  });

  it('accepts slashes, spaces, en dashes and Devanagari digits', () => {
    expect(parts('2/5/3/1')).toEqual(['2', '5', '3', '1']);
    expect(parts(' 2 5 3 1 ')).toEqual(['2', '5', '3', '1']);
    expect(parts('2 - 5 - 3')).toEqual(['2', '5', '3', '0']);
    expect(parts('2–5–3–1')).toEqual(['2', '5', '3', '1']);
    expect(parts('२-५-३-१.६')).toEqual(['2', '5', '3', '1.6']);
  });

  it('accepts values above the natural maximum', () => {
    expect(parts('0-20-0-0')).toEqual(['0', '20', '0', '0']);
  });

  it('rejects negatives', () => {
    expect(parts('-2-5')).toBe('negative');
    expect(parts('2--5')).toBe('negative');
    expect(parts('−1')).toBe('negative');
  });

  it('rejects empty, malformed and too-long input', () => {
    expect(parts('')).toBe('empty');
    expect(parts('   ')).toBe('empty');
    expect(parts('2-a-3')).toBe('invalid');
    expect(parts('2-')).toBe('invalid');
    expect(parts('1.2.3')).toBe('invalid');
    expect(parts('1-2-3-4-5')).toBe('tooManyParts');
    expect(parts('1-2-3-4', 'bigha')).toBe('tooManyParts');
  });
});
