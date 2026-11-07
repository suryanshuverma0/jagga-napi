import React, { useMemo, useState } from 'react';

import { AreaInput } from '@/components/AreaInput';
import { AreaResults } from '@/components/AreaResults';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { useBackGuard } from '@/hooks/useBackGuard';
import { useHistoryRestore } from '@/hooks/useHistoryRestore';
import { useApp } from '@/state/AppState';
import { emptyAreaEntry, evaluateAreaEntry, isAreaEntryBlank, type AreaEntry } from '@/units/areaEntry';
import { isCompoundSystem } from '@/units/areaEntry';

export default function ConverterScreen() {
  const { settings, meta, updateMeta } = useApp();
  const [entry, setEntry] = useState<AreaEntry>(() =>
    emptyAreaEntry(meta.lastInputSystem ?? settings.defaultSystem),
  );
  useHistoryRestore('convert', (p) => setEntry(p.area));

  const result = useMemo(() => evaluateAreaEntry(entry), [entry]);
  useBackGuard(!isAreaEntryBlank(entry), 'tab');

  const onChange = (next: AreaEntry) => {
    if (next.system !== entry.system) updateMeta({ lastInputSystem: next.system });
    setEntry(next);
  };

  return (
    <Screen banner>
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
