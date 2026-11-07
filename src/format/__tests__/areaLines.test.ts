import { createTranslator } from '@/i18n';
import { d } from '@/math/decimal';
import {
  emptyAreaEntry,
  normalisedCompoundText,
  reexpressEntry,
  toggleEntryMode,
  type AreaEntry,
} from '@/units/areaEntry';
import { compoundToSqft } from '@/units/compound';
import { buildAreaLines, compoundLine } from '../areaLines';

const en = createTranslator('en', 'latin');
const ne = createTranslator('ne', 'devanagari');

describe('buildAreaLines', () => {
  const sqft = compoundToSqft(['2', '5', '3', '1.6'], 'ropani');

  it('lists every system with the preferred compound system first', () => {
    const lines = buildAreaLines(sqft, en, 'ropani');
    expect(lines.map((l) => l.key)).toEqual([
      'ropani',
      'bigha',
      'sqft',
      'sqm',
      'total_aana',
      'total_dhur',
      'acre',
      'hectare',
    ]);
    expect(lines[0]?.value).toBe('2-5-3-1.6');
    expect(lines[0]?.detail).toBe('2 Ropani 5 Aana 3 Paisa 1.6 Daam');
    expect(lines[2]?.value).toBe('12,954.16');
    expect(lines[4]?.value).toBe('37.85');
    expect(buildAreaLines(sqft, en, 'bigha')[0]?.key).toBe('bigha');
  });

  it('localises digits and unit names in Nepali', () => {
    const [first] = buildAreaLines(sqft, ne, 'ropani');
    expect(first?.value).toBe('२-५-३-१.६');
    expect(first?.detail).toBe('२ रोपनी ५ आना ३ पैसा १.६ दाम');
    expect(first?.label).toBe('रोपनी-आना-पैसा-दाम');
  });

  it('copy text carries the unit', () => {
    const lines = buildAreaLines(d(5476), en, 'ropani');
    expect(lines[0]?.copyText).toBe('1-0-0-0 (Ropani-Aana-Paisa-Daam)');
    expect(lines[3]?.copyText).toBe('508.74 Sq m');
  });

  it('zero shows a single zero part in the detail', () => {
    expect(compoundLine(d(0), 'bigha', en).detail).toBe('0 Dhur');
  });
});

describe('area entry helpers', () => {
  const ropani = (fields: string[]): AreaEntry => ({ system: 'ropani', mode: 'fields', fields, quick: '' });

  it('reexpressEntry carries the value to the new system', () => {
    expect(reexpressEntry(ropani(['1', '0', '0', '0']), 'sqft').fields).toEqual(['5476']);
    expect(reexpressEntry(ropani(['1', '0', '0', '0']), 'bigha').fields).toEqual(['0', '1', '10.05']);
    expect(reexpressEntry({ ...emptyAreaEntry('sqft'), fields: ['72900'] }, 'bigha').fields).toEqual([
      '1',
      '0',
      '0',
    ]);
    expect(reexpressEntry(ropani(['', '', '', '']), 'sqm')).toEqual(emptyAreaEntry('sqm'));
  });

  it('normalisedCompoundText flags non-normal input only', () => {
    expect(normalisedCompoundText(ropani(['0', '20', '0', '0']))).toBe('1-4-0-0');
    expect(normalisedCompoundText(ropani(['1.5', '', '', '']))).toBe('1-8-0-0');
    expect(normalisedCompoundText(ropani(['2', '5', '', '']))).toBeNull();
    expect(normalisedCompoundText({ ...ropani([]), mode: 'quick', quick: '2-5-3-1' })).toBeNull();
    expect(normalisedCompoundText({ ...ropani([]), mode: 'quick', quick: '0-16' })).toBe('1-0-0-0');
    expect(normalisedCompoundText(emptyAreaEntry('sqft'))).toBeNull();
  });

  it('toggleEntryMode carries values between fields and quick entry', () => {
    const quick = toggleEntryMode(ropani(['2', '', '3', '']));
    expect(quick).toMatchObject({ mode: 'quick', quick: '2-0-3-0' });
    const back = toggleEntryMode({ ...quick, quick: '1-2' });
    expect(back).toMatchObject({ mode: 'fields', fields: ['1', '2', '', ''] });
    expect(toggleEntryMode(ropani(['', '', '', ''])).quick).toBe('');
  });
});
