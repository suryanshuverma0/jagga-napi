import { evaluatePayloadArea } from '@/calc/evaluate';
import type { CalcKind, HistoryRecord, PayloadByKind } from '@/storage/types';
import type { AreaEntry } from '@/units/areaEntry';

const ropani = (fields: string[]): AreaEntry => ({ system: 'ropani', mode: 'fields', fields, quick: '' });
const bigha = (fields: string[]): AreaEntry => ({ system: 'bigha', mode: 'fields', fields, quick: '' });

type Seed = { [K in CalcKind]: { kind: K; name: string; payload: PayloadByKind[K] } }[CalcKind];

const SEEDS: Seed[] = [
  { kind: 'convert', name: 'भक्तपुर कित्ता ५१२', payload: { area: ropani(['0', '8', '2', '0']) } },
  {
    kind: 'plot',
    name: 'Lalitpur Imadol ghaderi',
    payload: {
      shape: 'rectangle',
      lengthUnit: 'ft',
      sides: ['45', '60', '', '', ''],
      triangles: [['', '', '']],
    },
  },
  {
    kind: 'plot',
    name: 'पोखरा लेकसाइड प्लट',
    payload: {
      shape: 'quadrilateral',
      lengthUnit: 'ft',
      sides: ['52', '74', '58', '70', '96'],
      triangles: [['', '', '']],
    },
  },
  {
    kind: 'price',
    name: 'Budhanilkantha 4 aana',
    payload: {
      mode: 'total',
      area: ropani(['0', '4', '0', '0']),
      rate: '3200000',
      rateUnit: 'aana',
      total: '',
    },
  },
  {
    kind: 'divide',
    name: 'पैतृक सम्पत्ति — ३ दाजुभाइ',
    payload: { area: ropani(['1', '4', '0', '0']), mode: 'equal', count: '3', ratios: '', system: 'ropani' },
  },
  { kind: 'convert', name: 'जनकपुर खेत', payload: { area: bigha(['2', '5', '10']) } },
  {
    kind: 'arith',
    name: 'Kitta 210 + 211 − bato',
    payload: {
      parcels: [
        { sign: 1, area: ropani(['0', '6', '0', '0']) },
        { sign: 1, area: ropani(['0', '5', '2', '0']) },
        { sign: -1, area: { system: 'sqft', mode: 'fields', fields: ['250'], quick: '' } },
      ],
    },
  },
  {
    kind: 'plot',
    name: 'Dharan jagga (3 triangles)',
    payload: {
      shape: 'triangles',
      lengthUnit: 'm',
      sides: ['', '', '', '', ''],
      triangles: [
        ['18', '22', '25'],
        ['25', '20', '17'],
        ['17', '15', '12'],
      ],
    },
  },
];

/** Realistic saved calculations for store screenshots (debug builds only). */
export function buildScreenshotSeed(now: number): HistoryRecord[] {
  return SEEDS.map((s, i) => {
    const t = now - (i + 1) * 3_600_000 * 7;
    const area = evaluatePayloadArea(s.kind, s.payload as never);
    return {
      id: `seed${i}${now.toString(36)}`,
      kind: s.kind,
      name: s.name,
      createdAt: t,
      updatedAt: t,
      areaSqft: area ? area.toString() : '0',
      payload: s.payload,
    } as HistoryRecord;
  });
}
