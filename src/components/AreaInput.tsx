import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import type { StringKey } from '@/i18n';
import { useApp } from '@/state/AppState';
import { space } from '@/theme';
import {
  evaluateAreaEntry,
  INPUT_SYSTEMS,
  isCompoundSystem,
  normalisedCompoundText,
  reexpressEntry,
  toggleEntryMode,
  type AreaEntry,
  type AreaEntryError,
  type InputSystem,
} from '@/units/areaEntry';
import { COMPOUND_UNITS } from '@/units/compound';
import { NumberField } from './NumberField';
import { AppText, Button, ErrorNote, InfoNote, Segmented } from './ui';

export function areaErrorKey(error: AreaEntryError, system: InputSystem): StringKey {
  if (error === 'tooManyParts')
    return system === 'bigha' ? 'error_tooManyParts_bigha' : 'error_tooManyParts_ropani';
  return error === 'negative' ? 'error_negative' : 'error_invalid';
}

/**
 * Area entry in any system. Compound systems get one big field per sub-unit (ropani / aana /
 * paisa / daam) or a single quick-entry field accepting "2-5-3-1".
 */
export function AreaInput({
  entry,
  onChange,
  systems = INPUT_SYSTEMS,
  label,
  showSystemPicker = true,
}: {
  entry: AreaEntry;
  onChange: (next: AreaEntry) => void;
  systems?: readonly InputSystem[];
  label?: string;
  showSystemPicker?: boolean;
}) {
  const { tr } = useApp();
  const { t } = tr;
  const refs = useRef<(TextInputInstance | null)[]>([]);
  const result = useMemo(() => evaluateAreaEntry(entry), [entry]);
  const compound = isCompoundSystem(entry.system);

  const setField = (i: number, value: string) => {
    const fields = [...entry.fields];
    fields[i] = value;
    onChange({ ...entry, fields });
  };

  // "0-20-0-0" is accepted and shown back normalised as "1-4-0-0".
  const normalised = useMemo(() => normalisedCompoundText(entry), [entry]);

  return (
    <View style={styles.root}>
      {showSystemPicker ? (
        <>
          <AppText variant="label" muted>
            {label ?? t('inputSystem')}
          </AppText>
          <Segmented
            label={label ?? t('inputSystem')}
            value={entry.system}
            onChange={(s) => onChange(reexpressEntry(entry, s))}
            options={systems.map((s) => ({ value: s, label: t(`system_${s}` as StringKey) }))}
          />
        </>
      ) : null}

      {compound && entry.mode === 'quick' ? (
        <NumberField
          label={t(entry.system === 'bigha' ? 'systemLabel_bigha' : 'systemLabel_ropani')}
          value={entry.quick}
          onChange={(quick) => onChange({ ...entry, quick })}
          placeholder={t(entry.system === 'bigha' ? 'quickEntryHint_bigha' : 'quickEntryHint_ropani')}
          invalid={result.status === 'error'}
          freeText
        />
      ) : compound && isCompoundSystem(entry.system) ? (
        <View style={styles.fields}>
          {COMPOUND_UNITS[entry.system].map((unit, i, all) => (
            <NumberField
              key={unit}
              ref={(r) => {
                refs.current[i] = r;
              }}
              style={styles.field}
              label={t(`unit_${unit}` as StringKey)}
              value={entry.fields[i] ?? ''}
              onChange={(v) => setField(i, v)}
              invalid={result.status === 'error' && result.field === i}
              returnKeyType={i < all.length - 1 ? 'next' : 'done'}
              onSubmitEditing={() => refs.current[i + 1]?.focus()}
            />
          ))}
        </View>
      ) : (
        <NumberField
          label={t(`system_${entry.system}` as StringKey)}
          value={entry.fields[0] ?? ''}
          onChange={(v) => setField(0, v)}
          invalid={result.status === 'error'}
        />
      )}

      {compound ? (
        <Button
          kind="ghost"
          compact
          label={entry.mode === 'quick' ? t('separateFields') : t('quickEntry')}
          onPress={() => onChange(toggleEntryMode(entry))}
          style={styles.modeToggle}
        />
      ) : null}

      {result.status === 'error' ? <ErrorNote message={t(areaErrorKey(result.error, entry.system))} /> : null}
      {normalised && result.status === 'ok' ? (
        <InfoNote message={t('normalisedNote', { value: tr.n(normalised) })} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  field: { flexGrow: 1, flexBasis: 70, minWidth: 70 },
  modeToggle: { alignSelf: 'flex-start' },
});
