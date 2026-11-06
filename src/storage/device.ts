import { createMMKV } from 'react-native-mmkv';
import type { KeyValueStore } from './kv';
import { createMemoryStore } from './kv';

let store: KeyValueStore | null = null;

/** The app's persistent store (MMKV). Falls back to memory if the native module is unavailable. */
export function getDeviceStore(): KeyValueStore {
  if (store) return store;
  try {
    const mmkv = createMMKV({ id: 'jagga-napi' });
    store = {
      getString: (k) => mmkv.getString(k),
      set: (k, v) => mmkv.set(k, v),
      remove: (k) => void mmkv.remove(k),
    };
  } catch {
    store = createMemoryStore();
  }
  return store;
}
