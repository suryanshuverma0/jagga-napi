import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useApp } from '@/state/AppState';
import { sanitizePayload } from '@/storage/schema';
import type { CalcKind, PayloadByKind } from '@/storage/types';

/** When a screen is opened from History with ?historyId=…, load that record's inputs once. */
export function useHistoryRestore<K extends CalcKind>(kind: K, apply: (payload: PayloadByKind[K]) => void) {
  const { historyId } = useLocalSearchParams<{ historyId?: string }>();
  const { history } = useApp();
  const router = useRouter();
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    if (!historyId) return;
    const rec = history.find((r) => r.id === historyId && r.kind === kind);
    if (rec) applyRef.current(sanitizePayload(kind, rec.payload));
    router.setParams({ historyId: undefined });
    // Only react to a new id; history changes alone must not re-apply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyId, kind]);
}
