import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';

import { AdsProvider } from '@/ads/AdsProvider';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { AppStateProvider, useApp } from '@/state/AppState';
import { type } from '@/theme';

function ThemedStack() {
  const { palette, tr, settings } = useApp();
  const navTheme = useMemo(() => {
    const base = palette.scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.primary,
        background: palette.bg,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
      },
    };
  }, [palette]);

  return (
    <AppErrorBoundary language={settings.language}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={palette.scheme === 'dark' ? 'light' : 'dark'} />
        <AdsProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: palette.surface },
              headerTintColor: palette.text,
              headerTitleStyle: { fontFamily: type.title.fontFamily, fontWeight: '700' },
              contentStyle: { backgroundColor: palette.bg },
              orientation: 'portrait',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="price" options={{ title: tr.t('priceTitle') }} />
            <Stack.Screen name="divide" options={{ title: tr.t('divideTitle') }} />
            <Stack.Screen name="arithmetic" options={{ title: tr.t('arithTitle') }} />
            <Stack.Screen name="reference" options={{ title: tr.t('referenceTitle') }} />
            <Stack.Screen name="licenses" options={{ title: tr.t('licenses') }} />
          </Stack>
        </AdsProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <ThemedStack />
    </AppStateProvider>
  );
}
