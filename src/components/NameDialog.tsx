import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useApp } from '@/state/AppState';
import { radius, space, TOUCH, type } from '@/theme';
import { AppText, Button } from './ui';

/** Small modal asking for an optional name — used for Save and Rename. */
export function NameDialog({
  title,
  initial = '',
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  initial?: string;
  confirmLabel: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const { tr, palette } = useApp();
  const [name, setName] = useState(initial);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
        accessibilityViewIsModal
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel={tr.t('cancel')} />
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="label" muted>
            {tr.t('nameOptional')}
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={tr.t('namePlaceholder')}
            placeholderTextColor={palette.textMuted}
            accessibilityLabel={tr.t('nameOptional')}
            maxLength={80}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => onConfirm(name)}
            style={[
              type.body,
              styles.input,
              { color: palette.text, borderColor: palette.border, backgroundColor: palette.bg },
            ]}
          />
          <View style={styles.row}>
            <Button kind="ghost" label={tr.t('cancel')} onPress={onCancel} style={styles.flex} />
            <Button label={confirmLabel} onPress={() => onConfirm(name)} style={styles.flex} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.xl,
    gap: space.md,
  },
  input: { minHeight: TOUCH + 4, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
