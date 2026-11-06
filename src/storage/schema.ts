import { RATE_UNITS, type RateUnit } from '@/math/price';
import {
  fieldCount,
  INPUT_SYSTEMS,
  isCompoundSystem,
  type AreaEntry,
  type InputSystem,
} from '@/units/areaEntry';
import type { CompoundSystem } from '@/units/compound';
import type { LengthUnit } from '@/units/conversions';
import {
  CALC_KINDS,
  PLOT_SHAPES,
  type AppMeta,
  type ArithParcel,
  type CalcKind,
  type HistoryRecord,
  type PayloadByKind,
  type PersistedState,
  type Settings,
} from './types';

/**
 * Version of the persisted data shape. Bump it whenever a stored shape changes and add a
 * migration from the previous version to MIGRATIONS.
 */
export const SCHEMA_VERSION = 1;

export const KEYS = {
  version: 'schemaVersion',
  settings: 'settings',
  meta: 'meta',
  history: 'history',
} as const;

export const MAX_HISTORY = 500;
const MAX_TEXT = 64;
const MAX_NAME = 80;

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  numerals: 'latin',
  defaultSystem: 'ropani',
  defaultLengthUnit: 'ft',
  theme: 'system',
};

export const DEFAULT_META: AppMeta = {
  onboarded: false,
  sessionCount: 0,
  lastInterstitialAt: 0,
  engagementCount: 0,
  lastReviewPromptAt: 0,
  lastInputSystem: null,
  lastLengthUnit: null,
};

// ---------------------------------------------------------------------------------------------
// Primitive guards
// ---------------------------------------------------------------------------------------------

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function finiteNumber(v: unknown, fallback: number, min = 0): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min ? v : fallback;
}

function text(v: unknown, max = MAX_TEXT): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

function textArray(v: unknown, length: number): string[] {
  const arr = Array.isArray(v) ? v : [];
  return Array.from({ length }, (_, i) => text(arr[i]));
}

// ---------------------------------------------------------------------------------------------
// Sanitisers: accept anything, return a valid value. Never throw.
// ---------------------------------------------------------------------------------------------

export function sanitizeSettings(raw: unknown): Settings {
  const o = isObj(raw) ? raw : {};
  return {
    language: oneOf(o.language, ['en', 'ne'] as const, DEFAULT_SETTINGS.language),
    numerals: oneOf(o.numerals, ['latin', 'devanagari'] as const, DEFAULT_SETTINGS.numerals),
    defaultSystem: oneOf<CompoundSystem>(
      o.defaultSystem,
      ['ropani', 'bigha'],
      DEFAULT_SETTINGS.defaultSystem,
    ),
    defaultLengthUnit: oneOf<LengthUnit>(
      o.defaultLengthUnit,
      ['ft', 'm'],
      DEFAULT_SETTINGS.defaultLengthUnit,
    ),
    theme: oneOf(o.theme, ['system', 'light', 'dark'] as const, DEFAULT_SETTINGS.theme),
  };
}

export function sanitizeMeta(raw: unknown): AppMeta {
  const o = isObj(raw) ? raw : {};
  return {
    onboarded: o.onboarded === true,
    sessionCount: Math.floor(finiteNumber(o.sessionCount, 0)),
    lastInterstitialAt: finiteNumber(o.lastInterstitialAt, 0),
    engagementCount: Math.floor(finiteNumber(o.engagementCount, 0)),
    lastReviewPromptAt: finiteNumber(o.lastReviewPromptAt, 0),
    lastInputSystem:
      typeof o.lastInputSystem === 'string' &&
      (INPUT_SYSTEMS as readonly string[]).includes(o.lastInputSystem)
        ? (o.lastInputSystem as InputSystem)
        : null,
    lastLengthUnit: o.lastLengthUnit === 'ft' || o.lastLengthUnit === 'm' ? o.lastLengthUnit : null,
  };
}

export function sanitizeAreaEntry(raw: unknown, fallbackSystem: InputSystem = 'ropani'): AreaEntry {
  const o = isObj(raw) ? raw : {};
  const system = oneOf(o.system, INPUT_SYSTEMS, fallbackSystem);
  return {
    system,
    mode: isCompoundSystem(system) && o.mode === 'quick' ? 'quick' : 'fields',
    fields: textArray(o.fields, fieldCount(system)),
    quick: text(o.quick),
  };
}

function sanitizeParcel(raw: unknown): ArithParcel {
  const o = isObj(raw) ? raw : {};
  return { sign: o.sign === -1 ? -1 : 1, area: sanitizeAreaEntry(o.area) };
}

export function sanitizePayload<K extends CalcKind>(kind: K, raw: unknown): PayloadByKind[K] {
  const o = isObj(raw) ? raw : {};
  const sanitized: { [P in CalcKind]: () => PayloadByKind[P] } = {
    convert: () => ({ area: sanitizeAreaEntry(o.area) }),
    plot: () => {
      const triangles = Array.isArray(o.triangles) ? o.triangles.slice(0, 50) : [];
      return {
        shape: oneOf(o.shape, PLOT_SHAPES, 'rectangle'),
        lengthUnit: oneOf<LengthUnit>(o.lengthUnit, ['ft', 'm'], 'ft'),
        sides: textArray(o.sides, 5),
        triangles: (triangles.length > 0 ? triangles : [[]]).map((t) => textArray(t, 3)),
      };
    },
    price: () => ({
      mode: o.mode === 'rate' ? 'rate' : 'total',
      area: sanitizeAreaEntry(o.area),
      rate: text(o.rate),
      rateUnit: oneOf<RateUnit>(o.rateUnit, RATE_UNITS, 'aana'),
      total: text(o.total),
    }),
    divide: () => ({
      area: sanitizeAreaEntry(o.area),
      mode: o.mode === 'ratio' ? 'ratio' : 'equal',
      count: text(o.count),
      ratios: text(o.ratios),
      system: oneOf<CompoundSystem>(o.system, ['ropani', 'bigha'], 'ropani'),
    }),
    arith: () => {
      const parcels = Array.isArray(o.parcels) ? o.parcels.slice(0, 50).map(sanitizeParcel) : [];
      return { parcels: parcels.length > 0 ? parcels : [sanitizeParcel({})] };
    },
  };
  return sanitized[kind]() as PayloadByKind[K];
}

const DECIMAL_STRING = /^-?\d+(\.\d+)?$/;

export function sanitizeHistoryRecord(raw: unknown): HistoryRecord | null {
  if (!isObj(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id === '') return null;
  if (typeof raw.kind !== 'string' || !(CALC_KINDS as readonly string[]).includes(raw.kind)) return null;
  const kind = raw.kind as CalcKind;
  const createdAt = finiteNumber(raw.createdAt, 0);
  return {
    id: raw.id.slice(0, 40),
    kind,
    name: text(raw.name, MAX_NAME),
    createdAt,
    updatedAt: finiteNumber(raw.updatedAt, createdAt),
    areaSqft: typeof raw.areaSqft === 'string' && DECIMAL_STRING.test(raw.areaSqft) ? raw.areaSqft : '0',
    payload: sanitizePayload(kind, raw.payload),
  } as HistoryRecord;
}

export function sanitizeHistory(raw: unknown): HistoryRecord[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: HistoryRecord[] = [];
  for (const item of raw) {
    const rec = sanitizeHistoryRecord(item);
    if (rec && !seen.has(rec.id)) {
      seen.add(rec.id);
      out.push(rec);
    }
    if (out.length >= MAX_HISTORY) break;
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---------------------------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------------------------

/** Parsed-but-unvalidated stored data. */
export interface RawSnapshot {
  version: number;
  settings: unknown;
  meta: unknown;
  history: unknown;
}

export type Migration = (from: RawSnapshot) => RawSnapshot;

/**
 * MIGRATIONS[n] upgrades a version-n snapshot to version n + 1.
 * Version 0 is data written without a version key (pre-release builds); its shape matches v1.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {
  0: (s) => ({ ...s, version: 1 }),
};

/**
 * Run migrations from the snapshot's version up to `target`. A missing step, a throwing
 * migration or a version from the future never crashes: the data is passed through as-is and
 * the sanitisers repair or drop whatever does not fit.
 */
export function migrateSnapshot(
  snapshot: RawSnapshot,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): RawSnapshot {
  let current = snapshot;
  let guard = 0;
  while (current.version < target && guard++ < 100) {
    const step = migrations[current.version];
    if (!step) break;
    try {
      const next = step(current);
      if (!(next.version > current.version)) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

export function sanitizeSnapshot(snapshot: RawSnapshot): PersistedState {
  return {
    settings: sanitizeSettings(snapshot.settings),
    meta: sanitizeMeta(snapshot.meta),
    history: sanitizeHistory(snapshot.history),
  };
}
