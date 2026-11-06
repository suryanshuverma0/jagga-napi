import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import type { ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useApp } from '@/state/AppState';
import { type } from '@/theme';

function tabIcon(name: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color }: { color: ColorValue }) => <Icon name={name} size={24} color={color} />;
}

export default function TabsLayout() {
  const { palette, tr, meta } = useApp();
  if (!meta.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      backBehavior="firstRoute"
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border, minHeight: 60 },
        tabBarLabelStyle: { ...type.label, fontSize: 13 },
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        headerTitleStyle: { fontFamily: type.title.fontFamily, fontWeight: '700' },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tr.t('tabConvert'),
          headerTitle: tr.t('converterTitle'),
          tabBarIcon: tabIcon('convert'),
        }}
      />
      <Tabs.Screen
        name="plot"
        options={{ title: tr.t('tabPlot'), headerTitle: tr.t('plotTitle'), tabBarIcon: tabIcon('plot') }}
      />
      <Tabs.Screen
        name="tools"
        options={{ title: tr.t('tabTools'), headerTitle: tr.t('toolsTitle'), tabBarIcon: tabIcon('tools') }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: tr.t('tabHistory'),
          headerTitle: tr.t('historyTitle'),
          tabBarIcon: tabIcon('history'),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: tr.t('tabMore'), headerTitle: tr.t('settingsTitle'), tabBarIcon: tabIcon('more') }}
      />
    </Tabs>
  );
}
