import { buildReference } from '@/format/reference';
import { createTranslator } from '@/i18n';
import type { DividePayload, PricePayload } from '@/storage/types';
import type { AreaEntry } from '@/units/areaEntry';
import { evaluateDivide, evaluatePrice } from '../tools';

const ropani = (quick: string): AreaEntry => ({ system: 'ropani', mode: 'quick', fields: [], quick });

describe('evaluatePrice', () => {
  const base: PricePayload = {
    mode: 'total',
    area: ropani('2-5-3-1'),
    rate: '1200000',
    rateUnit: 'aana',
    total: '',
  };

  it('total mode', () => {
    const r = evaluatePrice(base);
    expect(r.status === 'ok' && r.amount.toString()).toBe('45375000');
  });
  it('reverse mode', () => {
    const r = evaluatePrice({ ...base, mode: 'rate', total: '45375000' });
    expect(r.status === 'ok' && r.amount.toString()).toBe('1200000');
  });
  it('waits for input and reports bad numbers', () => {
    expect(evaluatePrice({ ...base, rate: '' }).status).toBe('incomplete');
    expect(evaluatePrice({ ...base, area: ropani('') }).status).toBe('incomplete');
    expect(evaluatePrice({ ...base, rate: '-5' })).toMatchObject({
      status: 'invalidNumber',
      error: 'negative',
    });
  });
  it('reverse mode with zero area', () => {
    expect(evaluatePrice({ ...base, mode: 'rate', area: ropani('0'), total: '100' }).status).toBe('areaZero');
  });
});

describe('evaluateDivide', () => {
  const base: DividePayload = {
    area: ropani('1-4-0-0'),
    mode: 'equal',
    count: '3',
    ratios: '',
    system: 'ropani',
  };

  it('equal shares', () => {
    const r = evaluateDivide(base);
    expect(r.status === 'ok' && r.division.shares).toHaveLength(3);
  });
  it('ratio shares', () => {
    const r = evaluateDivide({ ...base, mode: 'ratio', ratios: '2:1:1' });
    expect(r.status === 'ok' && r.division.shares.map(String)).toEqual(['3422.5', '1711.25', '1711.25']);
  });
  it('errors', () => {
    expect(evaluateDivide({ ...base, count: '1' })).toEqual({
      status: 'divisionError',
      error: 'tooFewShares',
    });
    expect(evaluateDivide({ ...base, count: '2.5' })).toEqual({ status: 'countError' });
    expect(evaluateDivide({ ...base, mode: 'ratio', ratios: '2:0' })).toEqual({ status: 'ratioError' });
    expect(evaluateDivide({ ...base, count: '' }).status).toBe('incomplete');
  });
});

describe('reference table', () => {
  it('is computed from the definitions', () => {
    const sections = buildReference(createTranslator('en', 'latin'));
    const ropaniRow = sections[0]?.rows[0];
    expect(ropaniRow?.lhs).toBe('1 Ropani');
    expect(ropaniRow?.rhs).toEqual(['16 Aana', '64 Paisa', '256 Daam', '5,476 Sq ft', '508.74 Sq m']);
    const cross = sections[2]?.rows[0];
    expect(cross?.rhs).toEqual(['13.31 Ropani']);
  });
  it('localises to Nepali', () => {
    const sections = buildReference(createTranslator('ne', 'devanagari'));
    expect(sections[1]?.rows[0]?.rhs[0]).toBe('२० कट्ठा');
  });
});
