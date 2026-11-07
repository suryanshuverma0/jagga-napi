import { router, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { BannerSlot } from '@/ads/BannerSlot';
import { NameDialog } from '@/components/NameDialog';
import { AppText, IconButton } from '@/components/ui';
import { compoundLine } from '@/format/areaLines';
import { d } from '@/math/decimal';
import { shareDate } from '@/share/model';
import { useApp } from '@/state/AppState';
import type { CalcKind, HistoryRecord } from '@/storage/types';
import { radius, space, TOUCH } from '@/theme';

const ROUTE: Record<CalcKind, string> = {
  convert: '/',
  plot: '/plot',
  price: '/price',
  divide: '/divide',
  arith: '/arithmetic',
};

export default function HistoryScreen() {
  const { tr, palette, history, settings, renameHistory, deleteHistory } = useApp();
  const { t } = tr;
  const [renaming, setRenaming] = useState<HistoryRecord | null>(null);

  const open = (r: HistoryRecord) =>
    router.navigate({ pathname: ROUTE[r.kind], params: { historyId: r.id } } as unknown as Href);

  const confirmDelete = useCallback(
    (r: HistoryRecord) => {
      const name = r.name || t('untitled');
      Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmBody', { name }), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteHistory(r.id) },
      ]);
    },
    [t, deleteHistory],
  );

  const renderItem = ({ item }: { item: HistoryRecord }) => {
    const name = item.name || t('untitled');
    const area = compoundLine(d(item.areaSqft), settings.defaultSystem, tr);
    const subtitle = `${t(`kind_${item.kind}`)} · ${shareDate(new Date(item.updatedAt), tr)}`;
    return (
      <View style={[styles.item, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Pressable
          onPress={() => open(item)}
          accessibilityRole="button"
          accessibilityLabel={`${name}. ${subtitle}. ${area.label}: ${area.value}`}
          accessibilityHint={t('open')}
          android_ripple={{ color: palette.border }}
          style={styles.main}
        >
          <AppText variant="bodyStrong" numberOfLines={2}>
            {name}
          </AppText>
          <AppText variant="small" muted>
            {subtitle}
          </AppText>
          <AppText variant="value">{area.value}</AppText>
          <AppText variant="small" muted>
            {area.label}
          </AppText>
        </Pressable>
        <View style={styles.actions}>
          <IconButton icon="edit" label={`${t('rename')}: ${name}`} onPress={() => setRenaming(item)} />
          <IconButton
            icon="delete"
            label={`${t('delete')}: ${name}`}
            onPress={() => confirmDelete(item)}
            color={palette.error}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <FlatList
        data={history}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={7}
        ListEmptyComponent={
          <AppText muted style={styles.empty}>
            {t('historyEmpty')}
          </AppText>
        }
      />
      <BannerSlot />
      {renaming ? (
        <NameDialog
          title={t('renameTitle')}
          initial={renaming.name}
          confirmLabel={t('save')}
          onConfirm={(name) => {
            renameHistory(renaming.id, name);
            setRenaming(null);
          }}
          onCancel={() => setRenaming(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  item: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  main: { flex: 1, padding: space.lg, gap: 2, minHeight: TOUCH },
  actions: { justifyContent: 'center', paddingRight: space.xs },
  empty: { textAlign: 'center', marginTop: space.xxl, paddingHorizontal: space.xl },
});
