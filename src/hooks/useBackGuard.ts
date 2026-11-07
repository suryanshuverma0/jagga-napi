import { useFocusEffect, usePreventRemove, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, BackHandler } from 'react-native';

import { useApp } from '@/state/AppState';

function confirmDiscard(t: ReturnType<typeof useApp>['tr']['t'], onDiscard: () => void) {
  Alert.alert(t('unsavedTitle'), t('unsavedBody'), [
    { text: t('keepEditing'), style: 'cancel' },
    { text: t('discard'), style: 'destructive', onPress: onDiscard },
  ]);
}

/**
 * Never lose typed input to the Android back button without asking.
 *
 * - Stack screens (price, divide, …): blocks removal with usePreventRemove.
 * - Tab screens: if back would leave the app (nothing to go back to), asks first. Switching tabs
 *   keeps each tab's state, so back from another tab to the first one needs no prompt.
 */
export function useBackGuard(dirty: boolean, kind: 'stack' | 'tab') {
  const { tr } = useApp();
  const router = useRouter();
  // Set only immediately before the blocked removal is repeated, i.e. as the screen goes away.
  const [allowLeave, setAllowLeave] = useState(false);

  usePreventRemove(kind === 'stack' && dirty && !allowLeave, ({ repeat }) => {
    confirmDiscard(tr.t, () => {
      setAllowLeave(true);
      repeat();
    });
  });

  useFocusEffect(
    useCallback(() => {
      if (kind !== 'tab' || !dirty) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (router.canGoBack()) return false;
        confirmDiscard(tr.t, () => BackHandler.exitApp());
        return true;
      });
      return () => sub.remove();
    }, [kind, dirty, router, tr]),
  );
}
