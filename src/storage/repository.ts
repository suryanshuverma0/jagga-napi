import type { KeyValueStore } from './kv';
import {
  DEFAULT_META,
  DEFAULT_SETTINGS,
  KEYS,
  MAX_HISTORY,
  migrateSnapshot,
  sanitizeSnapshot,
  SCHEMA_VERSION,
  type RawSnapshot,
} from './schema';
import type { AppMeta, HistoryRecord, PersistedState, Settings } from './types';

function readJson(kv: KeyValueStore, key: string): unknown {
  try {
    const raw = kv.getString(key);
    return raw === undefined ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

function writeJson(kv: KeyValueStore, key: string, value: unknown): void {
  try {
    kv.set(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: keep running with in-memory state.
  }
}

/** Read the stored snapshot. A missing version key means version 0 if any data exists. */
export function readSnapshot(kv: KeyValueStore): RawSnapshot {
  const settings = readJson(kv, KEYS.settings);
  const meta = readJson(kv, KEYS.meta);
  const history = readJson(kv, KEYS.history);
  const storedVersion = readJson(kv, KEYS.version);
  const hasData = settings !== undefined || meta !== undefined || history !== undefined;
  const version =
    typeof storedVersion === 'number' && Number.isInteger(storedVersion) && storedVersion >= 0
      ? storedVersion
      : hasData
        ? 0
        : SCHEMA_VERSION;
  return { version, settings, meta, history };
}

/**
 * Load, migrate and validate everything. Never throws: corrupt or unknown data falls back to
 * defaults field by field, and the repaired state is written back at the current version.
 */
export function loadState(kv: KeyValueStore): PersistedState {
  let state: PersistedState;
  try {
    state = sanitizeSnapshot(migrateSnapshot(readSnapshot(kv)));
  } catch {
    state = { settings: { ...DEFAULT_SETTINGS }, meta: { ...DEFAULT_META }, history: [] };
  }
  writeJson(kv, KEYS.version, SCHEMA_VERSION);
  writeJson(kv, KEYS.settings, state.settings);
  writeJson(kv, KEYS.meta, state.meta);
  writeJson(kv, KEYS.history, state.history);
  return state;
}

export function saveSettings(kv: KeyValueStore, settings: Settings): void {
  writeJson(kv, KEYS.settings, settings);
}

export function saveMeta(kv: KeyValueStore, meta: AppMeta): void {
  writeJson(kv, KEYS.meta, meta);
}

export function saveHistory(kv: KeyValueStore, history: readonly HistoryRecord[]): void {
  writeJson(kv, KEYS.history, history.slice(0, MAX_HISTORY));
}

export function newId(now: number = Date.now()): string {
  return `${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
