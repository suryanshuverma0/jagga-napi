import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type ViewStyle,
} from 'react-native';

import { toLatinDigits } from '@/math/numerals';
import { cleanNumberTyping } from '@/math/parse';
import { useApp } from '@/state/AppState';
import { radius, space, TOUCH, type } from '@/theme';
import { Icon } from './Icon';
import { AppText } from './ui';

interface Props {
  label: string;
  /** Raw value with Latin digits. */
  value: string;
  onChange: (raw: string) => void;
  invalid?: boolean;
  suffix?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  /** Free text (e.g. "2-5-3-1" or "2:1:1") instead of a plain decimal. */
  freeText?: boolean;
  ref?: React.Ref<TextInputInstance>;
}

/** Large decimal-pad input that shows Latin or Devanagari digits per Settings. */
export function NumberField({
  label,
  value,
  onChange,
  invalid,
  suffix,
  placeholder,
  style,
  accessibilityHint,
  returnKeyType = 'done',
  onSubmitEditing,
  freeText,
  ref,
}: Props) {
  const { palette, tr } = useApp();
  const borderColor = invalid ? palette.error : palette.border;
  return (
    <View style={[styles.wrap, style]}>
      <AppText variant="label" muted numberOfLines={2}>
        {label}
      </AppText>
      <View
        style={[styles.box, { borderColor, backgroundColor: palette.surface, borderWidth: invalid ? 2 : 1 }]}
      >
        <TextInput
          ref={ref}
          value={tr.n(value)}
          onChangeText={(text) =>
            onChange(freeText ? toLatinDigits(text).replace(/[−–—]/g, '-') : cleanNumberTyping(text))
          }
          keyboardType={freeText ? 'numbers-and-punctuation' : 'decimal-pad'}
          inputMode={freeText ? 'text' : 'decimal'}
          placeholder={placeholder ?? tr.n('0')}
          placeholderTextColor={palette.textMuted}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          submitBehavior={returnKeyType === 'next' ? 'submit' : 'blurAndSubmit'}
          selectTextOnFocus
          autoCorrect={false}
          style={[type.input, styles.input, { color: palette.text }]}
        />
        {invalid ? <Icon name="error" size={20} color={palette.error} /> : null}
        {suffix ? (
          <AppText variant="small" muted>
            {suffix}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  box: {
    minHeight: TOUCH + 8,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  input: { flex: 1, paddingVertical: space.xs, minWidth: 0 },
});
