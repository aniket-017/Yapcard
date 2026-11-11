import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import JSZip from 'jszip';
import type { ImportedChat, ParsedChat } from '../types';
import { parseAny, titleFromFileName } from './parseChat';

export class ImportError extends Error {}

const isZip = (name: string, bytes?: Uint8Array) =>
  /\.zip$/i.test(name) || (!!bytes && bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b);

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
  // Small fallback for engines without TextDecoder.
  let out = '';
  for (let i = 0; i < bytes.length; i += 8192) out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return decodeURIComponent(escape(out));
}

async function chatFromBytes(bytes: Uint8Array, name: string): Promise<ParsedChat> {
  let text: string;
  let innerName: string | null = null;
  if (isZip(name, bytes)) {
    const zip = await JSZip.loadAsync(bytes);
    const entries = Object.values(zip.files).filter((f) => !f.dir && /\.(txt|json)$/i.test(f.name));
    if (!entries.length) throw new ImportError('That zip has no chat file inside. Export the chat again and pick “Without media”.');
    const best = entries.find((f) => /chat/i.test(f.name)) || entries[0];
    text = await best.async('string');
    innerName = best.name.split('/').pop() || null;
  } else {
    text = decodeUtf8(bytes);
  }
  // The outer file usually carries the group name ("WhatsApp Chat - Goa Trip.zip").
  const chat = parseAny(text, titleFromFileName(name) ? name : innerName || name);
  if (chat.messages.length < 20) {
    throw new ImportError(
      chat.messages.length === 0
        ? 'Couldn’t find any messages in that file. Pick the .txt or .zip that WhatsApp’s “Export chat” creates.'
        : 'That chat is too short to wrap. Try a group with at least 20 messages.'
    );
  }
  const people = new Set(chat.messages.map((m) => m.author));
  if (people.size < 2) throw new ImportError('Only one person is talking in that file. Pick a group or 1-to-1 chat export.');
  return chat;
}

async function readUri(uri: string): Promise<Uint8Array> {
  try {
    return new Uint8Array(await new File(uri).arrayBuffer());
  } catch {
    // content:// links from other apps sometimes only open through fetch
    const res = await fetch(uri);
    return new Uint8Array(await res.arrayBuffer());
  }
}

/** Opens the system file picker. Returns null when the user cancels. */
export async function pickChatFile(): Promise<ImportedChat | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['text/plain', 'application/zip', 'application/x-zip-compressed', 'application/json', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const bytes =
    Platform.OS === 'web' && asset.file
      ? new Uint8Array(await asset.file.arrayBuffer())
      : await readUri(asset.uri);
  const name = asset.name || 'chat.txt';
  return { chat: await chatFromBytes(bytes, name), file: { bytes, name } };
}

/** Used when WhatsApp's "Export chat" shares a file straight into the app. */
export async function chatFromSharedUri(uri: string, name?: string | null): Promise<ImportedChat> {
  const bytes = await readUri(uri);
  const fileName = name || uri.split('/').pop() || 'chat.txt';
  return { chat: await chatFromBytes(bytes, fileName), file: { bytes, name: fileName } };
}
