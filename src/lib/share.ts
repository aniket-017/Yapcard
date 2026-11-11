import { Alert, Platform } from 'react-native';
import type { RefObject } from 'react';
import type { ViewRef } from '../types';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { APP_NAME } from '../theme';

/** Turns a view into a PNG and opens the share sheet (WhatsApp, Instagram Stories, …). */
export async function shareView(ref: RefObject<ViewRef | null>, title: string): Promise<boolean> {
  if (!ref.current) return false;
  if (Platform.OS === 'web') {
    Alert.alert('Sharing works in the mobile app');
    return false;
  }
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing isn’t available on this device');
      return false;
    }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: `${title} · ${APP_NAME}` });
    return true;
  } catch (e) {
    Alert.alert('Couldn’t share that', String((e as Error)?.message || e));
    return false;
  }
}

/** Files shared into the app from another app's share sheet (needs an installed build, not Expo Go). */
export async function takeIncomingShare(): Promise<{ uri: string; name: string | null } | null> {
  if (Platform.OS === 'web') return null;
  try {
    if (!Sharing.getSharedPayloads().length) return null;
    const payloads = await Sharing.getResolvedSharedPayloadsAsync();
    Sharing.clearSharedPayloads();
    const files = payloads.filter((p) => !!p.contentUri);
    const pick =
      files.find((p) => /\.(txt|zip|json)$/i.test(p.originalName || p.contentUri || '')) ||
      files.find((p) => /text|zip|json/i.test(p.contentMimeType || p.mimeType || '')) ||
      null;
    return pick?.contentUri ? { uri: pick.contentUri, name: pick.originalName } : null;
  } catch {
    return null;
  }
}
