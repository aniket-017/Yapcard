import type { Msg, MsgKind, ParsedChat } from '../types';

// Invisible direction marks WhatsApp sprinkles into exports.
const MARKS = /[‎‏‪-‮⁦-⁩﻿]/g;
const NBSP = /[  ]/g;

// Android: "31/12/23, 9:15 PM - Name: text"
// iOS:     "[31/12/23, 9:15:03 PM] Name: text"
const LINE =
  /^\[?(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?(?:\s*([AaPp])\.?\s?[Mm]\.?)?\]?\s*(?:[-–]\s)?(.*)$/;

const MEDIA =
  /^(<media omitted>|<attached: .+>|(image|video|audio|sticker|gif|document|contact card|video note|voice message) omitted|.+\(file attached\))$/i;
const DELETED = /^(this message was deleted\.?|you deleted this message\.?)$/i;
const EDITED = /\s*<this message was edited>$/i;

type Raw = { a: number; b: number; c: number; h: number; mi: number; s: number; ap: string; author: string; text: string; sys: boolean };

function classify(text: string): MsgKind {
  if (MEDIA.test(text)) return 'media';
  if (DELETED.test(text)) return 'deleted';
  return 'text';
}

function toTs(r: Raw, order: 'dmy' | 'mdy' | 'ymd'): number {
  let y: number, m: number, d: number;
  if (order === 'ymd') [y, m, d] = [r.a, r.b, r.c];
  else if (order === 'dmy') [d, m, y] = [r.a, r.b, r.c];
  else [m, d, y] = [r.a, r.b, r.c];
  if (y < 100) y += 2000;
  let h = r.h;
  if (r.ap) {
    const pm = r.ap.toLowerCase() === 'p';
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  return new Date(y, m - 1, d, h, r.mi, r.s).getTime();
}

function backwardJumps(raws: Raw[], order: 'dmy' | 'mdy'): number {
  let n = 0;
  let prev = -Infinity;
  for (const r of raws) {
    const t = toTs(r, order);
    if (t < prev - 60000) n++;
    prev = t;
  }
  return n;
}

export function titleFromFileName(name: string | null | undefined): string | null {
  if (!name) return null;
  const base = name.replace(/\.(txt|zip|json)$/i, '').replace(/_/g, ' ').trim();
  const m = base.match(/^WhatsApp Chat (?:with|-)\s*(.+)$/i);
  if (m) return m[1].trim();
  if (/^(_?chat|result)$/i.test(base)) return null;
  return base || null;
}

export function parseWhatsApp(input: string, fileName?: string | null): ParsedChat {
  const lines = input.split(/\r?\n/);
  const raws: Raw[] = [];
  let cur: Raw | null = null;

  for (const original of lines) {
    const line = original.replace(NBSP, ' ').replace(/^[‎‏﻿]+/, '');
    const m = LINE.exec(line);
    if (!m) {
      if (cur) cur.text += '\n' + line.replace(MARKS, '');
      continue;
    }
    const rest = m[8];
    const idx = rest.indexOf(': ');
    if (idx <= 0 || idx > 80) {
      cur = null; // system line such as "X added Y"
      continue;
    }
    const author = rest.slice(0, idx).replace(MARKS, '').replace(/^~\s*/, '').trim();
    const bodyRaw = rest.slice(idx + 2);
    // iOS marks system notices and attachments with a leading U+200E.
    const marked = /^[‎‏]/.test(bodyRaw);
    const text = bodyRaw.replace(MARKS, '').replace(EDITED, '').trim();
    const sys = marked && classify(text) === 'text';
    cur = {
      a: +m[1], b: +m[2], c: +m[3], h: +m[4], mi: +m[5], s: m[6] ? +m[6] : 0, ap: m[7] || '',
      author, text, sys,
    };
    if (author) raws.push(cur);
  }

  let order: 'dmy' | 'mdy' | 'ymd' = 'dmy';
  if (raws.some((r) => r.a > 31)) order = 'ymd';
  else if (raws.some((r) => r.a > 12)) order = 'dmy';
  else if (raws.some((r) => r.b > 12)) order = 'mdy';
  else order = backwardJumps(raws, 'mdy') < backwardJumps(raws, 'dmy') ? 'mdy' : 'dmy';

  const messages: Msg[] = [];
  for (const r of raws) {
    if (r.sys) continue;
    const ts = toTs(r, order);
    if (!isFinite(ts)) continue;
    const text = r.text.trim();
    if (!text || text === 'null') continue;
    messages.push({ ts, author: r.author, text, kind: classify(text) });
  }
  messages.sort((x, y) => x.ts - y.ts);

  return { title: titleFromFileName(fileName) || 'Your group chat', source: 'whatsapp', messages };
}

type TgText = string | (string | { text?: string })[];

export function parseTelegram(json: any, fileName?: string | null): ParsedChat {
  const list: any[] = Array.isArray(json?.messages) ? json.messages : [];
  const messages: Msg[] = [];
  for (const m of list) {
    if (m?.type !== 'message' || !m.from) continue;
    const t: TgText = m.text ?? '';
    const text = (typeof t === 'string' ? t : t.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('')).trim();
    const ts = m.date_unixtime ? Number(m.date_unixtime) * 1000 : new Date(m.date).getTime();
    if (!isFinite(ts)) continue;
    const hasMedia = !!(m.media_type || m.photo || m.file);
    if (!text && !hasMedia) continue;
    messages.push({ ts, author: String(m.from), text: text || '<media>', kind: text ? 'text' : 'media' });
  }
  messages.sort((x, y) => x.ts - y.ts);
  return { title: json?.name || titleFromFileName(fileName) || 'Your group chat', source: 'telegram', messages };
}

export function parseAny(content: string, fileName?: string | null): ParsedChat {
  const head = content.slice(0, 200).trimStart();
  if (head.startsWith('{')) {
    try {
      return parseTelegram(JSON.parse(content), fileName);
    } catch {
      // fall through and try WhatsApp
    }
  }
  return parseWhatsApp(content, fileName);
}
