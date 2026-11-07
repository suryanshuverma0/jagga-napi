import React, { useMemo, useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { evaluatePayloadArea } from '@/calc/evaluate';
import { useEngagement } from '@/engagement/useEngagement';
import { buildShareModel } from '@/share/model';
import { useApp } from '@/state/AppState';
import type { CalcKind, PayloadByKind } from '@/storage/types';
import { notify } from './feedback';
import { NameDialog } from './NameDialog';
import { ShareSheet } from './ShareSheet';
import { Button } from './ui';

/**
 * Save and Share buttons for the bottom action bar. Both are disabled until the calculation is
 * complete and valid. `onSaved` lets the screen clear its "unsaved input" guard.
 */
export function CalcActions<K extends CalcKind>({
  kind,
  payload,
  onSaved,
}: {
  kind: K;
  payload: PayloadByKind[K];
  onSaved?: () => void;
}) {
  const { tr, settings, addHistory } = useApp();
  const engage = useEngagement();
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [name, setName] = useState('');

  const model = useMemo(
    () => buildShareModel(kind, payload, tr, settings.defaultSystem, new Date(), name),
    [kind, payload, tr, settings.defaultSystem, name],
  );
  const enabled = model !== null;

  const save = (n: string) => {
    setSaving(false);
    const area = evaluatePayloadArea(kind, payload);
    addHistory(kind, n, payload, area ? area.toString() : '0');
    setName(n);
    notify(tr.t('saved'));
    onSaved?.();
    // Let the keyboard from the name field finish closing first: ads never show over it.
    Keyboard.dismiss();
    setTimeout(() => void engage(), 700);
  };

  return (
    <>
      <Button
        kind="secondary"
        icon="save"
        label={tr.t('save')}
        onPress={() => setSaving(true)}
        disabled={!enabled}
        style={styles.flex}
      />
      <Button
        icon="share"
        label={tr.t('share')}
        onPress={() => setSharing(true)}
        disabled={!enabled}
        style={styles.flex}
      />
      {saving ? (
        <NameDialog
          title={tr.t('saveCalculation')}
          initial={name}
          confirmLabel={tr.t('save')}
          onConfirm={save}
          onCancel={() => setSaving(false)}
        />
      ) : null}
      {sharing && model ? (
        <ShareSheet model={model} onClose={() => setSharing(false)} onShared={() => void engage()} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
