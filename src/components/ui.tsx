import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useApp } from '@/state/AppState';
import { radius, space, TOUCH, type } from '@/theme';
import { Icon, type IconName } from './Icon';

type TextVariant = keyof typeof type;

export function AppText({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; muted?: boolean; color?: string }) {
  const { palette } = useApp();
  return (
    <Text
      {...rest}
      style={[type[variant], { color: color ?? (muted ? palette.textMuted : palette.text) }, style]}
    />
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useApp();
  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>
      {children}
    </View>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  accessibilityHint,
  style,
  compact,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const { palette } = useApp();
  const colors: Record<ButtonKind, { bg: string; fg: string; border: string }> = {
    primary: { bg: palette.primary, fg: palette.onPrimary, border: palette.primary },
    secondary: { bg: palette.primarySoft, fg: palette.onPrimarySoft, border: palette.primarySoft },
    ghost: { bg: 'transparent', fg: palette.primary, border: palette.border },
    danger: { bg: palette.errorSoft, fg: palette.onErrorSoft, border: palette.errorSoft },
  };
  const c = colors[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: palette.border }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={c.fg} /> : null}
      <Text style={[type.bodyStrong, { color: c.fg, flexShrink: 1, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 22,
  ...rest
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
} & Omit<PressableProps, 'onPress' | 'children'>) {
  const { palette } = useApp();
  return (
    <Pressable
      {...rest}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      android_ripple={{ color: palette.border, borderless: true, radius: TOUCH / 2 }}
      style={styles.iconButton}
    >
      <Icon name={icon} size={size} color={color ?? palette.textMuted} />
    </Pressable>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** A row of large, labelled toggle buttons — no fiddly pickers. Wraps onto two lines if needed. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { palette } = useApp();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmented}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={o.hint ? `${o.label}, ${o.hint}` : o.label}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? palette.primary : palette.surface,
                borderColor: selected ? palette.primary : palette.border,
              },
            ]}
          >
            <View style={styles.segmentInner}>
              {selected ? <Icon name="check" size={16} color={palette.onPrimary} /> : null}
              <Text
                style={[
                  type.bodyStrong,
                  { color: selected ? palette.onPrimary : palette.text, textAlign: 'center' },
                ]}
              >
                {o.label}
              </Text>
            </View>
            {o.hint ? (
              <Text
                style={[
                  type.small,
                  { color: selected ? palette.onPrimary : palette.textMuted, textAlign: 'center' },
                ]}
              >
                {o.hint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Error message with an icon and an "Error:" prefix, so it never relies on colour alone. */
export function ErrorNote({ message, style }: { message: string; style?: StyleProp<ViewStyle> }) {
  const { palette, tr } = useApp();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.note, { backgroundColor: palette.errorSoft }, style]}
    >
      <Icon name="error" size={20} color={palette.onErrorSoft} />
      <Text style={[type.small, { color: palette.onErrorSoft, flex: 1 }]}>
        <Text style={{ fontWeight: '700' }}>{tr.t('errorPrefix')}: </Text>
        {message}
      </Text>
    </View>
  );
}

export function InfoNote({ message, style }: { message: string; style?: StyleProp<ViewStyle> }) {
  const { palette } = useApp();
  return (
    <View style={[styles.note, { backgroundColor: palette.surfaceAlt }, style]}>
      <Icon name="info" size={20} color={palette.textMuted} />
      <Text style={[type.small, { color: palette.text, flex: 1 }]}>{message}</Text>
    </View>
  );
}

export function SectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <AppText variant="heading" accessibilityRole="header" style={[{ marginBottom: space.sm }, style]}>
      {children}
    </AppText>
  );
}

export function Gap({ size = space.md }: { size?: number }) {
  return <View style={{ height: size }} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
  },
  button: {
    minHeight: TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonCompact: { paddingHorizontal: space.md },
  iconButton: {
    minWidth: TOUCH,
    minHeight: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  segment: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 88,
    minHeight: TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    justifyContent: 'center',
  },
  segmentInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    borderRadius: radius.md,
    padding: space.md,
  },
});
