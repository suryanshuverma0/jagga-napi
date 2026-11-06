import { buildScreenshotSeed } from '@/debug/screenshotSeed';
import type { PlotPayload } from '@/storage/types';
import { evaluateAreaEntry } from '@/units/areaEntry';
import { evaluateArith, evaluatePayloadArea, evaluatePlot } from '../evaluate';

const plot = (p: Partial<PlotPayload>): PlotPayload => ({
  shape: 'rectangle',
  lengthUnit: 'ft',
  sides: ['', '', '', '', ''],
  triangles: [['', '', '']],
  ...p,
});

describe('evaluateAreaEntry', () => {
  it('blank compound fields are empty; partly filled fields count blanks as zero', () => {
    expect(
      evaluateAreaEntry({ system: 'ropani', mode: 'fields', fields: ['', '', '', ''], quick: '' }).status,
    ).toBe('empty');
    const r = evaluateAreaEntry({ system: 'ropani', mode: 'fields', fields: ['', '4', '', ''], quick: '' });
    expect(r.status === 'ok' && r.sqft.toString()).toBe('1369');
  });

  it('reports which field is bad', () => {
    const r = evaluateAreaEntry({ system: 'ropani', mode: 'fields', fields: ['1', '-2', '', ''], quick: '' });
    expect(r).toEqual({ status: 'error', error: 'negative', field: 1 });
  });

  it('quick mode and simple systems', () => {
    const q = evaluateAreaEntry({ system: 'bigha', mode: 'quick', fields: [], quick: '0-3-7.25' });
    expect(q.status === 'ok' && q.sqft.toString()).toBe('12256.3125');
    const m = evaluateAreaEntry({ system: 'sqm', mode: 'fields', fields: ['0.09290304'], quick: '' });
    expect(m.status === 'ok' && m.sqft.toString()).toBe('1');
    expect(evaluateAreaEntry({ system: 'sqft', mode: 'fields', fields: [''], quick: '' }).status).toBe(
      'empty',
    );
  });
});

describe('evaluatePlot', () => {
  it('rectangle in feet and metres', () => {
    const ft = evaluatePlot(plot({ sides: ['74', '74', '', '', ''] }));
    expect(ft.status === 'ok' && ft.sqft.toString()).toBe('5476');
    const m = evaluatePlot(plot({ lengthUnit: 'm', sides: ['10', '10', '', '', ''] }));
    expect(m.status === 'ok' && m.sqft.toDecimalPlaces(4).toString()).toBe('1076.391');
  });

  it('waits for every field, but flags a bad number at once', () => {
    expect(evaluatePlot(plot({ sides: ['74', '', '', '', ''] })).status).toBe('incomplete');
    expect(evaluatePlot(plot({ sides: ['abc', '', '', '', ''] }))).toEqual({
      status: 'invalidNumber',
      index: 0,
    });
    expect(evaluatePlot(plot({ sides: ['0', '5', '', '', ''] }))).toEqual({
      status: 'invalidNumber',
      index: 0,
    });
  });

  it('triangle and quadrilateral', () => {
    const t = evaluatePlot(plot({ shape: 'triangle', sides: ['3', '4', '5', '', ''] }));
    expect(t.status === 'ok' && t.sqft.toString()).toBe('6');
    const q = evaluatePlot(plot({ shape: 'quadrilateral', sides: ['30', '40', '30', '40', '50'] }));
    expect(q.status === 'ok' && q.sqft.toString()).toBe('1200');
    const bad = evaluatePlot(plot({ shape: 'triangle', sides: ['1', '2', '10', '', ''] }));
    expect(bad.status === 'shapeError' && bad.issues).toEqual([{ triangle: 1, error: 'inequality' }]);
  });

  it('irregular plot names the bad triangle', () => {
    const r = evaluatePlot(
      plot({
        shape: 'triangles',
        triangles: [
          ['3', '4', '5'],
          ['1', '1', '5'],
        ],
      }),
    );
    expect(r.status === 'shapeError' && r.issues).toEqual([{ triangle: 2, error: 'inequality' }]);
    const bad = evaluatePlot(
      plot({
        shape: 'triangles',
        triangles: [
          ['3', '4', '5'],
          ['1', 'x', ''],
        ],
      }),
    );
    expect(bad).toEqual({ status: 'invalidNumber', index: 4 });
  });
});

describe('evaluateArith and evaluatePayloadArea', () => {
  it('adds and subtracts mixed units', () => {
    const total = evaluateArith({
      parcels: [
        { sign: 1, area: { system: 'ropani', mode: 'quick', fields: [], quick: '1-4-0-0' } },
        { sign: 1, area: { system: 'ropani', mode: 'quick', fields: [], quick: '0-12-2-0' } },
        { sign: -1, area: { system: 'sqft', mode: 'fields', fields: ['300'], quick: '' } },
      ],
    });
    expect(total?.toString()).toBe('10823.125');
  });

  it('every screenshot seed evaluates to a positive area', () => {
    for (const rec of buildScreenshotSeed(Date.UTC(2026, 10, 1))) {
      const area = evaluatePayloadArea(rec.kind, rec.payload as never);
      expect(area?.isPositive()).toBe(true);
      expect(rec.areaSqft).not.toBe('0');
    }
  });
});
