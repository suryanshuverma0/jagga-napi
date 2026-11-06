import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { createTranslator, type Translator } from '@/i18n';
import { getDeviceStore } from '@/storage/device';
import type { KeyValueStore } from '@/storage/kv';
import { loadState, newId, saveHistory, saveMeta, saveSettings } from '@/storage/repository';
import type { AppMeta, CalcKind, HistoryRecord, PayloadByKind, Settings } from '@/storage/types';
import { dark, light, type Palette } from '@/theme';

interface AppStateValue {
  settings: Settings;
  meta: AppMeta;
  history: HistoryRecord[];
  tr: Translator;
  palette: Palette;
  updateSettings: (patch: Partial<Settings>) => void;
  updateMeta: (patch: Partial<AppMeta> | ((m: AppMeta) => Partial<AppMeta>)) => void;
  addHistory: <K extends CalcKind>(
    kind: K,
    name: string,
    payload: PayloadByKind[K],
    areaSqft: string,
  ) => HistoryRecord;
  renameHistory: (id: string, name: string) => void;
  deleteHistory: (id: string) => void;
  replaceHistory: (records: HistoryRecord[]) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

let sessionCounted = false;

function initialState(kv: KeyValueStore) {
  const state = loadState(kv);
  if (!state.meta.onboarded && state.meta.sessionCount === 0) {
    // First launch ever: pick the language from the phone.
    const code = getLocales()[0]?.languageCode;
    if (code === 'ne') state.settings = { ...state.settings, language: 'ne', numerals: 'devanagari' };
  }
  if (!sessionCounted) {
    sessionCounted = true;
    state.meta = { ...state.meta, sessionCount: state.meta.sessionCount + 1 };
    saveMeta(kv, state.meta);
  }
  return state;
}

export function AppStateProvider({ children, store }: { children: React.ReactNode; store?: KeyValueStore }) {
  const [kv] = useState<KeyValueStore>(() => store ?? getDeviceStore());
  const [initial] = useState(() => initialState(kv));
  const [settings, setSettings] = useState(initial.settings);
  const [meta, setMeta] = useState(initial.meta);
  const [history, setHistory] = useState(initial.history);

  const systemScheme = useColorScheme();
  useEffect(() => {
    Appearance.setColorScheme(settings.theme === 'system' ? 'unspecified' : settings.theme);
  }, [settings.theme]);
  const scheme = settings.theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : settings.theme;
  const palette = scheme === 'dark' ? dark : light;

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(kv, next);
        return next;
      });
    },
    [kv],
  );

  const updateMeta = useCallback<AppStateValue['updateMeta']>(
    (patch) => {
      setMeta((prev) => {
        const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
        saveMeta(kv, next);
        return next;
      });
    },
    [kv],
  );

  const commitHistory = useCallback(
    (fn: (prev: HistoryRecord[]) => HistoryRecord[]) => {
      setHistory((prev) => {
        const next = fn(prev);
        saveHistory(kv, next);
        return next;
      });
    },
    [kv],
  );

  const addHistory = useCallback<AppStateValue['addHistory']>(
    (kind, name, payload, areaSqft) => {
      const now = Date.now();
      const record = {
        id: newId(now),
        kind,
        name: name.trim().slice(0, 80),
        createdAt: now,
        updatedAt: now,
        areaSqft,
        payload,
      } as HistoryRecord;
      commitHistory((prev) => [record, ...prev]);
      return record;
    },
    [commitHistory],
  );

  const renameHistory = useCallback(
    (id: string, name: string) =>
      commitHistory((prev) =>
        prev.map((r) => (r.id === id ? { ...r, name: name.trim().slice(0, 80), updatedAt: Date.now() } : r)),
      ),
    [commitHistory],
  );

  const deleteHistory = useCallback(
    (id: string) => commitHistory((prev) => prev.filter((r) => r.id !== id)),
    [commitHistory],
  );

  const replaceHistory = useCallback(
    (records: HistoryRecord[]) => commitHistory(() => records),
    [commitHistory],
  );

  const tr = useMemo(
    () => createTranslator(settings.language, settings.numerals),
    [settings.language, settings.numerals],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      settings,
      meta,
      history,
      tr,
      palette,
      updateSettings,
      updateMeta,
      addHistory,
      renameHistory,
      deleteHistory,
      replaceHistory,
    }),
    [
      settings,
      meta,
      history,
      tr,
      palette,
      updateSettings,
      updateMeta,
      addHistory,
      renameHistory,
      deleteHistory,
      replaceHistory,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStateProvider');
  return v;
}
