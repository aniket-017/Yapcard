import type { GroupStats, GroupVibe, MemberCardData, ParsedChat, RoastLevel } from '../types';

/**
 * Address of your roast server (see /server). Set it in a .env file:
 *   EXPO_PUBLIC_API_URL=https://your-server.example.com
 * When it is empty the app uses its built-in roasts and nothing leaves the phone.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
export const aiAvailable = () => API_URL.length > 0;

export type AiPayload = {
  level: RoastLevel;
  group: {
    members: number;
    messages: number;
    perDay: number;
    busiestHour: number;
    longestSilenceDays: number;
    topEmojis: string[];
    topWords: string[];
  };
  members: { id: string; award: string; stat: string; share: number; avgWords: number; nightShare: number; replyMin: number | null }[];
  sample: { a: string; t: string }[];
};

export type AiResult = {
  members: { id: string; roast: string }[];
  vibe?: { name: string; line: string; emoji?: string };
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Build what gets sent: stats plus a small sample, with every name swapped for P1, P2… */
export function buildAiPayload(chat: ParsedChat, g: GroupStats, cards: MemberCardData[], level: RoastLevel) {
  const ids = new Map<string, string>();
  const names: Record<string, string> = {};
  g.members.forEach((m, i) => {
    ids.set(m.name, `P${i + 1}`);
    names[`P${i + 1}`] = m.name;
  });

  // Longest names first so "Rahul Sharma" is replaced before "Rahul".
  const parts: { re: RegExp; id: string }[] = [];
  for (const m of g.members) {
    const id = ids.get(m.name)!;
    const tokens = [m.name, ...m.name.split(/\s+/)].filter((t) => t.length >= 3 && !/^[+\d\s()-]+$/.test(t));
    for (const t of tokens) parts.push({ re: new RegExp(escapeRe(t), 'gi'), id });
  }
  parts.sort((a, b) => b.re.source.length - a.re.source.length);

  const scrub = (text: string) => {
    let t = text
      .replace(/https?:\/\/\S+|www\.\S+/gi, '[link]')
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
      .replace(/\+?\d[\d\s()-]{6,}\d/g, '[number]');
    for (const p of parts) t = t.replace(p.re, p.id);
    return t.length > 160 ? t.slice(0, 160) + '…' : t;
  };

  const from = g.start;
  const to = g.end;
  const texts = chat.messages.filter((m) => m.kind === 'text' && m.ts >= from && m.ts <= to && ids.has(m.author));
  const want = 120;
  const sample: AiPayload['sample'] = [];
  if (texts.length <= want) {
    for (const m of texts) sample.push({ a: ids.get(m.author)!, t: scrub(m.text) });
  } else {
    // Six evenly spaced runs of 20 so the model sees real back-and-forth.
    const chunk = 20;
    const runs = want / chunk;
    for (let r = 0; r < runs; r++) {
      const startIdx = Math.floor(((texts.length - chunk) * r) / (runs - 1));
      for (let i = startIdx; i < startIdx + chunk; i++) sample.push({ a: ids.get(texts[i].author)!, t: scrub(texts[i].text) });
    }
  }

  const payload: AiPayload = {
    level,
    group: {
      members: g.memberCount,
      messages: g.totalMessages,
      perDay: Math.round(g.perDay * 10) / 10,
      busiestHour: g.busiestHour,
      longestSilenceDays: g.longestSilenceDays,
      topEmojis: g.topEmojis.map((e) => e.emoji),
      topWords: g.topWords.map((w) => scrub(w.word)),
    },
    members: cards.map((c) => ({
      id: ids.get(c.name)!,
      award: c.title,
      stat: scrub(c.statLine),
      share: Math.round(c.stats.share * 100) / 100,
      avgWords: Math.round(c.stats.avgWords * 10) / 10,
      nightShare: Math.round((c.stats.nightMsgs / Math.max(1, c.stats.messages)) * 100) / 100,
      replyMin: c.stats.medianReplyMin === null ? null : Math.round(c.stats.medianReplyMin * 10) / 10,
    })),
    sample,
  };
  return { payload, names };
}

/** Ask the server for AI roasts. Returns null on any failure so the caller keeps the built-in ones. */
export async function fetchAiRoasts(
  chat: ParsedChat,
  g: GroupStats,
  cards: MemberCardData[],
  level: RoastLevel,
  timeoutMs = 20000
): Promise<{ cards: MemberCardData[]; vibe: GroupVibe | null } | null> {
  if (!aiAvailable()) return null;
  const { payload, names } = buildAiPayload(chat, g, cards, level);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/api/roast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AiResult;
    if (!data || !Array.isArray(data.members)) return null;

    // Put the real names back, on the phone only.
    const restore = (t: string) => t.replace(/\bP(\d{1,3})\b/g, (m) => (names[m] ? names[m].split(/\s+/)[0] : m));
    const byName = new Map<string, string>();
    for (const m of data.members) {
      if (names[m.id] && typeof m.roast === 'string' && m.roast.trim()) byName.set(names[m.id], restore(m.roast.trim()).slice(0, 180));
    }
    const merged = cards.map((c) => (byName.has(c.name) ? { ...c, roast: byName.get(c.name)!, ai: true } : c));
    const v = data.vibe;
    const vibe: GroupVibe | null =
      v && typeof v.name === 'string' && typeof v.line === 'string' && v.name.trim()
        ? { name: restore(v.name.trim()).slice(0, 40), line: restore(v.line.trim()).slice(0, 160), emoji: (v.emoji || '✨').slice(0, 8), ai: true }
        : null;
    return { cards: merged, vibe };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
