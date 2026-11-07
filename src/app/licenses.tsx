import React from 'react';
import { FlatList, Linking, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui';
import licenses from '@/generated/licenses.json';
import { useApp } from '@/state/AppState';
import { space, TOUCH } from '@/theme';

interface Entry {
  name: string;
  version: string;
  license: string;
  url: string;
}

export default function LicensesScreen() {
  const { palette } = useApp();
  return (
    <FlatList
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.list}
      data={licenses as Entry[]}
      keyExtractor={(e) => e.name}
      initialNumToRender={20}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => Linking.openURL(item.url).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`${item.name} ${item.version}, ${item.license}`}
          style={[styles.row, { borderBottomColor: palette.border }]}
        >
          <AppText variant="bodyStrong">{item.name}</AppText>
          <AppText variant="small" muted>
            {item.version} · {item.license}
          </AppText>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg },
  row: { minHeight: TOUCH, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});
