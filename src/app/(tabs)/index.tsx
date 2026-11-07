import React, { useMemo, useState } from 'react';

import { AreaInput } from '@/components/AreaInput';
import { AreaResults } from '@/components/AreaResults';
import { CalcActions } from '@/components/CalcActions';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { useBackGuard } from '@/hooks/useBackGuard';
import { useHistoryRestore } from '@/hooks/useHistoryRestore';
import { useApp } from '@/state/AppState';
import type { ConvertPayload } from '@/storage/types';
import {
  emptyAreaEntry,
  evaluateAreaEntry,
  isAreaEntryBlank,
  isCompoundSystem,
  type AreaEntry,
} from '@/units/areaEntry';

export default function ConverterScreen() {
  const { settings, meta, updateMeta } = useApp();
  const [entry, setEntry] = useState<AreaEntry>(() =>
    emptyAreaEntry(meta.lastInputSystem ?? settings.defaultSystem),
  );
  const [savedEntry, setSavedEntry] = useState<AreaEntry | null>(null);
  useHistoryRestore('convert', (p) => {
    setEntry(p.area);
    setSavedEntry(p.area);
  });

  const result = useMemo(() => evaluateAreaEntry(entry), [entry]);
  const payload = useMemo<ConvertPayload>(() => ({ area: entry }), [entry]);
  useBackGuard(!isAreaEntryBlank(entry) && savedEntry !== entry, 'tab');

  const onChange = (next: AreaEntry) => {
    if (next.system !== entry.system) updateMeta({ lastInputSystem: next.system });
    setEntry(next);
  };

  return (
    <Screen
      banner
      footer={<CalcActions kind="convert" payload={payload} onSaved={() => setSavedEntry(entry)} />}
    >
      <Card>
        <AreaInput entry={entry} onChange={onChange} />
      </Card>
      {result.status === 'ok' ? (
        <AreaResults
          sqft={result.sqft}
          preferred={isCompoundSystem(entry.system) ? entry.system : settings.defaultSystem}
        />
      ) : null}
    </Screen>
  );
}
