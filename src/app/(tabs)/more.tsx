import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, Share, View } from 'react-native';

import { useAds } from '@/ads/AdsProvider';
import { ListRow } from '@/components/ListRow';
import { Screen } from '@/components/Screen';
import { AppText, Card, Segmented, SectionTitle } from '@/components/ui';
import { PACKAGE_ID, PLAY_URL, PRIVACY_URL, SUPPORT_EMAIL } from '@/constants';
import { buildScreenshotSeed } from '@/debug/screenshotSeed';
import { useApp } from '@/state/AppState';
import { space } from '@/theme';

export default function SettingsScreen() {
  const { tr, settings, updateSettings, updateMeta, replaceHistory, history } = useApp();
  const { privacyOptionsRequired, openPrivacyOptions } = useAds();
  const { t } = tr;
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const openStore = () => {
    Linking.openURL(`market://details?id=${PACKAGE_ID}`).catch(() =>
      Linking.openURL(PLAY_URL).catch(() => {}),
    );
  };

  return (
    <Screen>
      <Card>
        <SectionTitle>{t('language')}</SectionTitle>
        <Segmented
          label={t('language')}
          value={settings.language}
          onChange={(language) => updateSettings({ language })}
          options={[
            { value: 'en', label: 'English' },
            { value: 'ne', label: 'नेपाली' },
          ]}
        />
        <View style={{ height: space.lg }} />
        <SectionTitle>{t('numerals')}</SectionTitle>
        <Segmented
          label={t('numerals')}
          value={settings.numerals}
          onChange={(numerals) => updateSettings({ numerals })}
          options={[
            { value: 'latin', label: t('numerals_latin') },
            { value: 'devanagari', label: t('numerals_devanagari') },
          ]}
        />
      </Card>

      <Card>
        <SectionTitle>{t('defaultSystem')}</SectionTitle>
        <Segmented
          label={t('defaultSystem')}
          value={settings.defaultSystem}
          onChange={(defaultSystem) => {
            updateSettings({ defaultSystem });
            updateMeta({ lastInputSystem: null });
          }}
          options={[
            { value: 'ropani', label: t('system_ropani'), hint: t('systemHint_ropani') },
            { value: 'bigha', label: t('system_bigha'), hint: t('systemHint_bigha') },
          ]}
        />
        <View style={{ height: space.lg }} />
        <SectionTitle>{t('defaultLength')}</SectionTitle>
        <Segmented
          label={t('defaultLength')}
          value={settings.defaultLengthUnit}
          onChange={(defaultLengthUnit) => {
            updateSettings({ defaultLengthUnit });
            updateMeta({ lastLengthUnit: null });
          }}
          options={[
            { value: 'ft', label: t('length_ft') },
            { value: 'm', label: t('length_m') },
          ]}
        />
        <View style={{ height: space.lg }} />
        <SectionTitle>{t('theme')}</SectionTitle>
        <Segmented
          label={t('theme')}
          value={settings.theme}
          onChange={(theme) => updateSettings({ theme })}
          options={[
            { value: 'system', label: t('theme_system') },
            { value: 'light', label: t('theme_light') },
            { value: 'dark', label: t('theme_dark') },
          ]}
        />
      </Card>

      <Card>
        <ListRow icon="list" title={t('reference')} onPress={() => router.push('/reference')} />
        <ListRow
          icon="shield"
          title={t('privacyPolicy')}
          onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
        />
        {privacyOptionsRequired ? (
          <ListRow icon="shield" title={t('privacyOptions')} onPress={() => void openPrivacyOptions()} />
        ) : null}
        <ListRow icon="star" title={t('rateApp')} onPress={openStore} />
        <ListRow
          icon="share"
          title={t('shareApp')}
          onPress={() => Share.share({ message: `${t('shareAppMessage')}\n${PLAY_URL}` }).catch(() => {})}
        />
        <ListRow icon="code" title={t('licenses')} onPress={() => router.push('/licenses')} />
        <ListRow
          icon="mail"
          title={t('contact', { email: SUPPORT_EMAIL })}
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Jagga%20Napi%20${version}`).catch(() => {})
          }
        />
      </Card>

      <Card>
        <SectionTitle>{t('disclaimer')}</SectionTitle>
        <AppText>{t('disclaimerFull')}</AppText>
      </Card>

      {__DEV__ ? (
        <Card>
          <ListRow
            icon="image"
            title={t('screenshotMode')}
            onPress={() => {
              replaceHistory([...buildScreenshotSeed(Date.now()), ...history]);
              Alert.alert(t('screenshotSeeded'));
            }}
          />
        </Card>
      ) : null}

      <AppText variant="small" muted style={{ textAlign: 'center' }}>
        {tr.n(t('version', { version }))}
      </AppText>
    </Screen>
  );
}
