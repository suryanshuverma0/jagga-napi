import { reloadAppAsync } from 'expo';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { translate, type Language } from '@/i18n';
import { light, TOUCH, type } from '@/theme';

interface Props {
  children: React.ReactNode;
  language: Language;
}

interface State {
  hasError: boolean;
}

/** Last-resort screen. Uses only static colours and strings so it renders even if state is broken. */
export class AppErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Unhandled render error', error);
    }
  }

  private restart = () => {
    reloadAppAsync('error boundary').catch(() => this.setState({ hasError: false }));
  };

  override render() {
    if (!this.state.hasError) return this.props.children;
    const t = (k: Parameters<typeof translate>[1]) => translate(this.props.language, k);
    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={[type.title, styles.text]}>{t('crashTitle')}</Text>
        <Text style={[type.body, styles.text]}>{t('crashBody')}</Text>
        <Pressable
          onPress={this.restart}
          accessibilityRole="button"
          accessibilityLabel={t('restart')}
          style={styles.button}
        >
          <Text style={[type.bodyStrong, { color: light.onPrimary }]}>{t('restart')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: light.bg, padding: 24, justifyContent: 'center', gap: 16 },
  text: { color: light.text, textAlign: 'center' },
  button: {
    minHeight: TOUCH,
    backgroundColor: light.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
