import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Segmented, SectionTitle } from '@/components/ui';
import { useApp } from '@/state/AppState';
import { space } from '@/theme';

/** First launch only. Deliberately ad-free. */
export default function Onboarding() {
  const { tr, settings, updateSettings, updateMeta, palette } = useApp();
  const { t } = tr;

  const finish = () => {
    updateMeta({ onboarded: true });
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <AppText variant="display" accessibilityRole="header">
            {t('onboardingTitle')}
          </AppText>
          <AppText muted>{t('onboardingBody')}</AppText>
        </View>

        <View>
          <SectionTitle>{t('chooseLanguage')}</SectionTitle>
          <Segmented
            label={t('chooseLanguage')}
            value={settings.language}
            onChange={(language) =>
              updateSettings({ language, numerals: language === 'ne' ? 'devanagari' : 'latin' })
            }
            options={[
              { value: 'ne', label: 'नेपाली' },
              { value: 'en', label: 'English' },
            ]}
          />
        </View>

        <View>
          <SectionTitle>{t('chooseNumerals')}</SectionTitle>
          <Segmented
            label={t('chooseNumerals')}
            value={settings.numerals}
            onChange={(numerals) => updateSettings({ numerals })}
            options={[
              { value: 'devanagari', label: '१२३' },
              { value: 'latin', label: '123' },
            ]}
          />
        </View>

        <View>
          <SectionTitle>{t('chooseSystem')}</SectionTitle>
          <Segmented
            label={t('chooseSystem')}
            value={settings.defaultSystem}
            onChange={(defaultSystem) => updateSettings({ defaultSystem })}
            options={[
              { value: 'ropani', label: t('system_ropani'), hint: t('systemHint_ropani') },
              { value: 'bigha', label: t('system_bigha'), hint: t('systemHint_bigha') },
            ]}
          />
        </View>

        <AppText variant="small" muted>
          {t('disclaimerFull')}
        </AppText>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={t('getStarted')} onPress={finish} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: space.xl, gap: space.xl },
  hero: { gap: space.sm, marginTop: space.xl },
  footer: { padding: space.lg },
});
