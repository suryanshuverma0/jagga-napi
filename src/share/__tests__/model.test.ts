import { createTranslator } from '@/i18n';
import type { AreaEntry } from '@/units/areaEntry';
import { buildShareModel, buildShareText, shareDate } from '../model';

const en = createTranslator('en', 'latin');
const ne = createTranslator('ne', 'devanagari');
const NOW = new Date(2026, 10, 7);
const ropani = (quick: string): AreaEntry => ({ system: 'ropani', mode: 'quick', fields: [], quick });

describe('share card model', () => {
  it('returns null until the calculation is valid', () => {
    expect(buildShareModel('convert', { area: ropani('') }, en, 'ropani', NOW)).toBeNull();
    expect(
      buildShareModel(
        'plot',
        { shape: 'triangle', lengthUnit: 'ft', sides: ['1', '2', '10', '', ''], triangles: [] },
        en,
        'ropani',
        NOW,
      ),
    ).toBeNull();
  });

  it('converter text output', () => {
    const m = buildShareModel(
      'convert',
      { area: ropani('2-5-3-1.6') },
      en,
      'ropani',
      NOW,
      ' Bhaktapur kitta 512 ',
    )!;
    expect(buildShareText(m, en)).toBe(
      [
        'Jagga Napi — Conversion: Bhaktapur kitta 512',
        '',
        'Input:',
        '• Area: 2-5-3-1.6 (Ropani-Aana-Paisa-Daam)',
        '  2 Ropani 5 Aana 3 Paisa 1.6 Daam',
        '',
        'Results:',
        '• Ropani-Aana-Paisa-Daam: 2-5-3-1.6',
        '  2 Ropani 5 Aana 3 Paisa 1.6 Daam',
        '• Bigha-Kattha-Dhur: 0-3-11.08',
        '  3 Kattha 11.08 Dhur',
        '• Sq ft: 12,954.16',
        '• Sq m: 1,203.48',
        '',
        'Date: 2026-11-07',
        'Estimate only. Official area: Napi Karyalaya & Malpot records.',
        'Calculated with Jagga Napi app',
      ].join('\n'),
    );
  });

  it('plot model carries a drawing for simple shapes', () => {
    const m = buildShareModel(
      'plot',
      { shape: 'rectangle', lengthUnit: 'm', sides: ['20', '15', '', '', ''], triangles: [] },
      en,
      'ropani',
      NOW,
    )!;
    expect(m.drawing).toEqual({ shape: 'rectangle', sides: [20, 15], unitLabel: 'm' });
    expect(m.inputs.map((i) => i.value)).toEqual(['Rectangle', '20 m', '15 m']);
    expect(m.results[3]?.value).toBe('300');
  });

  it('irregular plots list each triangle and have no drawing', () => {
    const m = buildShareModel(
      'plot',
      {
        shape: 'triangles',
        lengthUnit: 'ft',
        sides: [],
        triangles: [
          ['3', '4', '5'],
          ['6', '8', '10'],
        ],
      },
      en,
      'ropani',
      NOW,
    )!;
    expect(m.drawing).toBeUndefined();
    expect(m.inputs[1]).toMatchObject({ label: 'Triangle 1', value: '3 × 4 × 5 ft' });
    expect(m.results[2]?.value).toBe('30');
  });

  it('price model has the total and the amount in words', () => {
    const m = buildShareModel(
      'price',
      { mode: 'total', area: ropani('2-5-3-1'), rate: '1200000', rateUnit: 'aana', total: '' },
      en,
      'ropani',
      NOW,
    )!;
    expect(m.results[0]).toEqual({
      label: 'Total price',
      value: 'Rs 4,53,75,000',
      detail: 'In words: 4 crore 53 lakh 75 thousand rupees',
    });
  });

  it('divide model lists every share', () => {
    const m = buildShareModel(
      'divide',
      { area: ropani('1'), mode: 'ratio', count: '', ratios: '2:1:1', system: 'ropani' },
      en,
      'ropani',
      NOW,
    )!;
    expect(m.inputs[1]).toEqual({ label: 'Ratio', value: '2:1:1' });
    expect(m.results.map((r) => r.value)).toEqual(['0-8-0-0', '0-4-0-0', '0-4-0-0']);
  });

  it('arithmetic model shows signs', () => {
    const m = buildShareModel(
      'arith',
      {
        parcels: [
          { sign: 1, area: ropani('1-4') },
          { sign: -1, area: { system: 'sqft', mode: 'fields', fields: ['300'], quick: '' } },
        ],
      },
      en,
      'ropani',
      NOW,
    )!;
    expect(m.inputs.map((i) => i.value)).toEqual(['1-4-0-0 (Ropani-Aana-Paisa-Daam)', '− 300 Sq ft']);
  });

  it('Nepali output uses Devanagari digits and Nepali words', () => {
    const m = buildShareModel('convert', { area: ropani('1') }, ne, 'ropani', NOW)!;
    const text = buildShareText(m, ne);
    expect(text).toContain('जग्गा नापी — रूपान्तरण');
    expect(text).toContain('१-०-०-०');
    expect(text).toContain('मिति: २०२६-११-०७');
    expect(text).toContain('अनुमान मात्र।');
    expect(shareDate(NOW, ne)).toBe('२०२६-११-०७');
  });
});
