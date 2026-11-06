import { createMemoryStore } from '../kv';
import { loadState, readSnapshot, saveHistory, saveSettings } from '../repository';
import {
  DEFAULT_META,
  DEFAULT_SETTINGS,
  KEYS,
  MAX_HISTORY,
  migrateSnapshot,
  sanitizeAreaEntry,
  sanitizeHistory,
  sanitizeMeta,
  sanitizePayload,
  sanitizeSettings,
  SCHEMA_VERSION,
  type Migration,
  type RawSnapshot,
} from '../schema';

const goodRecord = {
  id: 'abc',
  kind: 'convert',
  name: 'Bhaktapur kitta 512',
  createdAt: 1000,
  updatedAt: 2000,
  areaSqft: '2823.5625',
  payload: { area: { system: 'ropani', mode: 'fields', fields: ['0', '8', '2', '0'], quick: '' } },
};

describe('loadState', () => {
  it('returns defaults on a fresh install and writes the current version', () => {
    const kv = createMemoryStore();
    const state = loadState(kv);
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.meta).toEqual(DEFAULT_META);
    expect(state.history).toEqual([]);
    expect(kv.dump()[KEYS.version]).toBe(String(SCHEMA_VERSION));
  });

  it('round-trips saved settings and history', () => {
    const kv = createMemoryStore();
    loadState(kv);
    saveSettings(kv, { ...DEFAULT_SETTINGS, language: 'ne', numerals: 'devanagari' });
    saveHistory(kv, sanitizeHistory([goodRecord]));
    const state = loadState(kv);
    expect(state.settings.language).toBe('ne');
    expect(state.settings.numerals).toBe('devanagari');
    expect(state.history).toHaveLength(1);
    expect(state.history[0]?.name).toBe('Bhaktapur kitta 512');
  });

  it('never crashes on corrupt JSON and falls back to defaults', () => {
    const kv = createMemoryStore({
      [KEYS.version]: '1',
      [KEYS.settings]: '{not json',
      [KEYS.meta]: 'null',
      [KEYS.history]: '"a string"',
    });
    const state = loadState(kv);
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.meta).toEqual(DEFAULT_META);
    expect(state.history).toEqual([]);
  });

  it('repairs wrong field types one by one, keeping what is valid', () => {
    const kv = createMemoryStore({
      [KEYS.version]: '1',
      [KEYS.settings]: JSON.stringify({
        language: 'ne',
        numerals: 42,
        theme: 'purple',
        defaultSystem: 'bigha',
      }),
      [KEYS.meta]: JSON.stringify({ onboarded: true, sessionCount: -5, lastInputSystem: 'furlong' }),
    });
    const state = loadState(kv);
    expect(state.settings).toEqual({ ...DEFAULT_SETTINGS, language: 'ne', defaultSystem: 'bigha' });
    expect(state.meta.onboarded).toBe(true);
    expect(state.meta.sessionCount).toBe(0);
    expect(state.meta.lastInputSystem).toBeNull();
  });

  it('treats data without a version key as version 0 and migrates it', () => {
    const kv = createMemoryStore({ [KEYS.settings]: JSON.stringify({ language: 'ne' }) });
    expect(readSnapshot(kv).version).toBe(0);
    const state = loadState(kv);
    expect(state.settings.language).toBe('ne');
    expect(readSnapshot(kv).version).toBe(SCHEMA_VERSION);
  });

  it('keeps working with data from a newer app version (downgrade)', () => {
    const kv = createMemoryStore({
      [KEYS.version]: '99',
      [KEYS.settings]: JSON.stringify({ language: 'ne', futureField: true }),
    });
    expect(loadState(kv).settings.language).toBe('ne');
  });
});

describe('migrateSnapshot', () => {
  const base: RawSnapshot = { version: 1, settings: { lang: 'np' }, meta: {}, history: [] };

  it('runs every step in order up to the target', () => {
    const migrations: Record<number, Migration> = {
      1: (s) => ({
        ...s,
        version: 2,
        settings: { language: (s.settings as { lang: string }).lang === 'np' ? 'ne' : 'en' },
      }),
      2: (s) => ({ ...s, version: 3, meta: { onboarded: true } }),
    };
    const out = migrateSnapshot(base, migrations, 3);
    expect(out.version).toBe(3);
    expect(sanitizeSettings(out.settings).language).toBe('ne');
    expect(sanitizeMeta(out.meta).onboarded).toBe(true);
  });

  it('stops safely when a step is missing, throws, or does not advance', () => {
    expect(migrateSnapshot(base, {}, 3).version).toBe(1);
    const throwing = {
      1: () => {
        throw new Error('boom');
      },
    };
    expect(migrateSnapshot(base, throwing, 3).version).toBe(1);
    const stuck = { 1: (s: RawSnapshot) => s };
    expect(migrateSnapshot(base, stuck, 3).version).toBe(1);
  });

  it('the built-in v0 → v1 step only stamps the version', () => {
    const out = migrateSnapshot({ ...base, version: 0 });
    expect(out.version).toBe(1);
    expect(out.settings).toBe(base.settings);
  });
});

describe('history sanitising', () => {
  it('drops records with missing ids or unknown kinds, and de-duplicates', () => {
    const out = sanitizeHistory([
      goodRecord,
      { ...goodRecord },
      { ...goodRecord, id: '' },
      { ...goodRecord, id: 'x', kind: 'teleport' },
      null,
      42,
    ]);
    expect(out.map((r) => r.id)).toEqual(['abc']);
  });

  it('sorts newest first and caps the list', () => {
    const many = Array.from({ length: MAX_HISTORY + 20 }, (_, i) => ({
      ...goodRecord,
      id: `r${i}`,
      updatedAt: i,
    }));
    const out = sanitizeHistory(many);
    expect(out).toHaveLength(MAX_HISTORY);
    expect(out[0]!.updatedAt).toBeGreaterThan(out[1]!.updatedAt);
  });

  it('replaces an invalid stored area with 0 rather than crashing', () => {
    const [rec] = sanitizeHistory([{ ...goodRecord, areaSqft: 'NaN' }]);
    expect(rec?.areaSqft).toBe('0');
  });

  it('repairs payloads per kind', () => {
    const plot = sanitizePayload('plot', { shape: 'hexagon', sides: [1, '20'], triangles: 'x' });
    expect(plot).toEqual({
      shape: 'rectangle',
      lengthUnit: 'ft',
      sides: ['', '20', '', '', ''],
      triangles: [['', '', '']],
    });
    const price = sanitizePayload('price', { mode: 'rate', rateUnit: 'furlong' });
    expect(price.mode).toBe('rate');
    expect(price.rateUnit).toBe('aana');
    const arith = sanitizePayload('arith', {
      parcels: [{ sign: -1, area: { system: 'sqft', fields: ['300'] } }],
    });
    expect(arith.parcels[0]).toEqual({
      sign: -1,
      area: { system: 'sqft', mode: 'fields', fields: ['300'], quick: '' },
    });
  });

  it('sanitizeAreaEntry pads or trims fields to the system size', () => {
    expect(sanitizeAreaEntry({ system: 'bigha', fields: ['1', '2', '3', '4', '5'] }).fields).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(sanitizeAreaEntry({ system: 'ropani', fields: ['1'] }).fields).toEqual(['1', '', '', '']);
    expect(sanitizeAreaEntry({ system: 'sqft', mode: 'quick' }).mode).toBe('fields');
    expect(sanitizeAreaEntry('garbage').system).toBe('ropani');
  });
});
