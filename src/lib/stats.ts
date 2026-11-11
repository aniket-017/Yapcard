import type { GroupStats, MemberStats, Msg, ParsedChat } from '../types';

const HOUR = 3600000;
const DAY = 24 * HOUR;
const SILENCE = 6 * HOUR; // a gap this long starts a new conversation

function safeRegex(src: string, flags: string, fallback: RegExp): RegExp {
  try {
    return new RegExp(src, flags);
  } catch {
    return fallback;
  }
}

const EMOJI = safeRegex(
  '\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic}|[\\u{1F3FB}-\\u{1F3FF}])*',
  'gu',
  /[☀-➿]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]/g
);
const WORD_SPLIT = safeRegex("[^\\p{L}\\p{N}']+", 'u', /[\s.,!?;:()"\[\]{}<>\/\\|*_~`@#$%^&+=-]+/);
const HAS_LETTERS = safeRegex('\\p{L}', 'u', /[A-Za-z]/);
const LAUGH = /(\b(?:a?ha(?:ha)+h?|he(?:he)+|lo+l+|lmf?ao+|rofl|xd+|jaja(?:ja)*|kk+)\b|😂|🤣|💀)/i;
const LINK = /https?:\/\/|www\./i;

const STOP = new Set(
  (
    'the and for you that this with have not are was but your just its what all can out get got one like yes yeah okay will from they them then there here when were been had has did does too very how who why his her him she our out off about would could should into some more than now too only also dont cant didnt its ive ill youre thats im ok hai nahi nhi kya bhi toh tha thi the hain aur par kar raha rahi rhe mein main mera meri tera teri tum aap hum kuch koi abhi phir fir wala wali ko ka ki ke se ye yeh wo woh haan han bhai yaar ho na ha h k to me is it in on of at be do so if no or my we he an am as by up go us oh hi'
  ).split(' ')
);

export function emojisIn(text: string): string[] {
  return text.match(EMOJI) || [];
}

function wordsIn(text: string): string[] {
  return text.split(WORD_SPLIT).filter(Boolean);
}

function dayKey(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function topN<K>(map: Map<K, number>, n: number): [K, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export type Period = { label: string; from: number; to: number };

/** "This year" when the current year has enough messages, otherwise the whole chat. */
export function availablePeriods(chat: ParsedChat, now = Date.now()): Period[] {
  const msgs = chat.messages;
  if (!msgs.length) return [];
  const all: Period = { label: 'All time', from: msgs[0].ts, to: msgs[msgs.length - 1].ts + 1 };
  const lastYear = new Date(msgs[msgs.length - 1].ts).getFullYear();
  const year = Math.min(lastYear, new Date(now).getFullYear());
  const from = new Date(year, 0, 1).getTime();
  const to = new Date(year + 1, 0, 1).getTime();
  const inYear = msgs.filter((m) => m.ts >= from && m.ts < to).length;
  const firstYear = new Date(msgs[0].ts).getFullYear();
  if (firstYear < year && inYear >= 200) return [{ label: String(year), from, to }, all];
  return [all];
}

type Acc = MemberStats & { emojiMap: Map<string, number>; replyTimes: number[]; days: Set<number>; lastTs: number };

function newAcc(name: string): Acc {
  return {
    name, messages: 0, share: 0, rank: 0, words: 0, avgWords: 0, media: 0, emojis: 0, topEmoji: null,
    nightMsgs: 0, morningMsgs: 0, starters: 0, lastWords: 0, replies: 0, medianReplyMin: null,
    longestRun: 0, monologues: 0, questions: 0, laughs: 0, links: 0, deleted: 0, caps: 0,
    longestMsgWords: 0, activeDays: 0, ghostDays: 0,
    emojiMap: new Map(), replyTimes: [], days: new Set(), lastTs: 0,
  };
}

export function computeStats(chat: ParsedChat, period?: Period): GroupStats | null {
  const msgs: Msg[] = period ? chat.messages.filter((m) => m.ts >= period.from && m.ts < period.to) : chat.messages;
  if (msgs.length < 2) return null;

  const accs = new Map<string, Acc>();
  const hours = new Array(24).fill(0);
  const weekdays = new Array(7).fill(0);
  const dayCounts = new Map<number, number>();
  const emojiAll = new Map<string, number>();
  const wordAll = new Map<string, number>();
  const pairs = new Map<string, number>();

  let totalWords = 0;
  let mediaCount = 0;
  let longestSilence = 0;
  let prev: Msg | null = null;
  let run = 0;

  const endRun = (author: string) => {
    const a = accs.get(author);
    if (!a) return;
    if (run > a.longestRun) a.longestRun = run;
    if (run >= 4) a.monologues++;
  };

  for (const m of msgs) {
    let a = accs.get(m.author);
    if (!a) {
      a = newAcc(m.author);
      accs.set(m.author, a);
    }
    a.messages++;
    const d = new Date(m.ts);
    const h = d.getHours();
    hours[h]++;
    weekdays[d.getDay()]++;
    if (h < 5) a.nightMsgs++;
    else if (h < 9) a.morningMsgs++;
    const dk = dayKey(m.ts);
    dayCounts.set(dk, (dayCounts.get(dk) || 0) + 1);
    a.days.add(dk);
    if (a.lastTs) a.ghostDays = Math.max(a.ghostDays, (m.ts - a.lastTs) / DAY);
    a.lastTs = m.ts;

    if (m.kind === 'media') {
      a.media++;
      mediaCount++;
    } else if (m.kind === 'deleted') {
      a.deleted++;
    } else {
      const ws = wordsIn(m.text);
      a.words += ws.length;
      totalWords += ws.length;
      if (ws.length > a.longestMsgWords) a.longestMsgWords = ws.length;
      for (const w of ws) {
        const lw = w.toLowerCase();
        if (lw.length >= 3 && !STOP.has(lw) && HAS_LETTERS.test(lw) && !/^https?$/.test(lw)) {
          wordAll.set(lw, (wordAll.get(lw) || 0) + 1);
        }
      }
      const es = emojisIn(m.text);
      a.emojis += es.length;
      for (const e of es) {
        a.emojiMap.set(e, (a.emojiMap.get(e) || 0) + 1);
        emojiAll.set(e, (emojiAll.get(e) || 0) + 1);
      }
      if (m.text.includes('?')) a.questions++;
      if (LAUGH.test(m.text)) a.laughs++;
      if (LINK.test(m.text)) a.links++;
      const letters = m.text.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 5 && letters === letters.toUpperCase()) a.caps++;
    }

    if (prev) {
      const gap = m.ts - prev.ts;
      if (gap > longestSilence) longestSilence = gap;
      if (gap >= SILENCE) {
        a.starters++;
        const p = accs.get(prev.author);
        if (p) p.lastWords++;
      }
      if (prev.author !== m.author) {
        endRun(prev.author);
        run = 1;
        if (gap < SILENCE) {
          a.replies++;
          a.replyTimes.push(gap / 60000);
          if (gap < 5 * 60000) {
            const key = prev.author < m.author ? `${prev.author}\u0000${m.author}` : `${m.author}\u0000${prev.author}`;
            pairs.set(key, (pairs.get(key) || 0) + 1);
          }
        }
      } else if (gap >= SILENCE) {
        endRun(prev.author);
        run = 1;
      } else {
        run++;
      }
    } else {
      a.starters++;
      run = 1;
    }
    prev = m;
  }
  if (prev) endRun(prev.author);

  const total = msgs.length;
  const end = msgs[msgs.length - 1].ts;
  const members: MemberStats[] = [...accs.values()]
    .sort((x, y) => y.messages - x.messages)
    .map((a, i) => {
      const textMsgs = Math.max(1, a.messages - a.media - a.deleted);
      const top = topN(a.emojiMap, 1)[0];
      // Still gone at the end of the period counts as a disappearance too.
      const ghostDays = Math.max(a.ghostDays, (end - a.lastTs) / DAY);
      const { emojiMap, replyTimes, days, lastTs, ...rest } = a;
      return {
        ...rest,
        share: a.messages / total,
        rank: i + 1,
        avgWords: a.words / textMsgs,
        topEmoji: top ? top[0] : null,
        medianReplyMin: replyTimes.length >= 8 ? median(replyTimes) : null,
        activeDays: days.size,
        ghostDays: Math.round(ghostDays),
      };
    });

  const sortedDays = [...dayCounts.keys()].sort((x, y) => x - y);
  let streak = 1;
  let bestStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    // 20-28h tolerance keeps daylight-saving days in the streak
    if (sortedDays[i] - sortedDays[i - 1] < 1.2 * DAY) streak++;
    else streak = 1;
    if (streak > bestStreak) bestStreak = streak;
  }
  const busiest = topN(dayCounts, 1)[0];
  let busiestHour = 0;
  for (let h = 1; h < 24; h++) if (hours[h] > hours[busiestHour]) busiestHour = h;

  const start = msgs[0].ts;
  const spanDays = Math.max(1, Math.round((end - start) / DAY) + 1);
  const topPair = topN(pairs, 1)[0];
  let duo: GroupStats['duo'] = null;
  if (topPair && topPair[1] >= 5 && members.length > 2) {
    const [x, y] = topPair[0].split('\u0000');
    duo = { a: x, b: y, count: topPair[1] };
  }

  return {
    title: chat.title,
    periodLabel: period?.label || 'All time',
    totalMessages: total,
    totalWords,
    mediaCount,
    memberCount: members.length,
    members,
    start,
    end,
    spanDays,
    activeDays: sortedDays.length,
    perDay: total / spanDays,
    busiestDay: busiest ? { ts: busiest[0], count: busiest[1] } : null,
    busiestHour,
    hours,
    weekdays,
    longestSilenceDays: Math.round((longestSilence / DAY) * 10) / 10,
    longestStreakDays: bestStreak,
    topEmojis: topN(emojiAll, 5).map(([emoji, count]) => ({ emoji, count })),
    topWords: topN(wordAll, 6).map(([word, count]) => ({ word, count })),
    duo,
  };
}
