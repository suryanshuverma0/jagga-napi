import * as Clipboard from 'expo-clipboard';
import { AccessibilityInfo, Platform, ToastAndroid } from 'react-native';

/** Short confirmation: a toast on Android plus a screen-reader announcement. */
export function notify(message: string) {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  AccessibilityInfo.announceForAccessibility(message);
}

export async function copyText(text: string, confirmation: string) {
  try {
    await Clipboard.setStringAsync(text);
    notify(confirmation);
  } catch {
    // Clipboard unavailable: nothing useful to do.
  }
}
