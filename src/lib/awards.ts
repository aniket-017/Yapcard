import type { GroupStats, GroupVibe, MemberCardData, MemberStats, RoastLevel } from '../types';
import { fmt, hourLabel } from '../theme';

type Award = {
  id: string;
  title: string;
  emoji: string;
  /** [card colour, text colour] */
  colors: [string, string];
  /** Higher = more deserving. Return 0 when the member doesn't qualify. */
  metric: (m: MemberStats, g: GroupStats) => number;
  stat: (m: MemberStats, g: GroupStats) => string;
  roast: Record<RoastLevel, string>;
};

const pct = (x: number) => `${Math.round(x * 100)}%`;
const per = (n: number, m: MemberStats) => (m.messages >= 20 ? n / m.messages : 0);
const replyLabel = (min: number) =>
  min < 1 ? `${Math.max(1, Math.round(min * 60))} sec` : min < 90 ? `${Math.round(min)} min` : `${(min / 60).toFixed(1)} hrs`;

export const AWARDS: Award[] = [
  {
    id: 'yapper', title: 'The Chief Yapper', emoji: '🗣️', colors: ['#FF5FA2', '#1B1535'],
    metric: (m) => (m.rank === 1 ? m.share : 0),
    stat: (m) => `${pct(m.share)} of every message sent`,
    roast: {
      friendly: 'This chat would be a ghost town without you. Never stop.',
      spicy: 'Has a thought. Sends it. Has another. Sends that too.',
      savage: 'Has never once had a thought and kept it to themselves.',
    },
  },
  {
    id: 'ghost', title: 'The Ghost', emoji: '👻', colors: ['#3A2F6B', '#FFF6E6'],
    metric: (m, g) => (g.memberCount >= 3 && m.ghostDays >= 7 ? Math.min(1, m.ghostDays / 60) * (1 - m.share) : 0),
    stat: (m) => `Vanished for ${m.ghostDays} days straight`,
    roast: {
      friendly: 'Rare appearances, but we cheer every time.',
      spicy: 'Reads everything. Replies to nothing. We see you.',
      savage: 'Technically a member. Legally a rumour.',
    },
  },
  {
    id: 'nightowl', title: 'The 2 a.m. Menace', emoji: '🦉', colors: ['#5B4BD6', '#FFF6E6'],
    metric: (m) => (m.nightMsgs >= 10 ? per(m.nightMsgs, m) : 0),
    stat: (m) => `${fmt(m.nightMsgs)} messages sent after midnight`,
    roast: {
      friendly: 'Keeps the chat alive while the rest of us sleep.',
      spicy: 'Your best ideas arrive at 2 a.m. So do your worst.',
      savage: 'Sleep is free and you still can’t afford it.',
    },
  },
  {
    id: 'earlybird', title: 'The Sunrise Texter', emoji: '🌅', colors: ['#FFB627', '#1B1535'],
    metric: (m) => (m.morningMsgs >= 10 ? per(m.morningMsgs, m) : 0),
    stat: (m) => `${fmt(m.morningMsgs)} messages before 9 AM`,
    roast: {
      friendly: 'First one up, first one in the chat. Sunshine energy.',
      spicy: 'Nobody asked for a 6 AM update. You delivered anyway.',
      savage: 'Good morning messages no one consented to.',
    },
  },
  {
    id: 'speed', title: 'The Instant Replier', emoji: '⚡', colors: ['#5CC8FF', '#1B1535'],
    metric: (m) => (m.medianReplyMin !== null && m.replies >= 15 ? 1 / (1 + m.medianReplyMin) : 0),
    stat: (m) => `Typical reply time: ${replyLabel(m.medianReplyMin ?? 0)}`,
    roast: {
      friendly: 'Always there in seconds. The group’s most reliable human.',
      spicy: 'Replies so fast we’re not sure you read the message.',
      savage: 'Phone surgically attached. Screen time: classified.',
    },
  },
  {
    id: 'slow', title: 'The Seen-Zone Specialist', emoji: '🐢', colors: ['#3EE6B0', '#1B1535'],
    metric: (m) => (m.medianReplyMin !== null && m.replies >= 15 && m.medianReplyMin >= 8 ? Math.min(1, m.medianReplyMin / 120) : 0),
    stat: (m) => `Typical reply time: ${replyLabel(m.medianReplyMin ?? 0)}`,
    roast: {
      friendly: 'Takes a while, but the reply is always worth the wait.',
      spicy: 'Replies arrive after the plan has already happened.',
      savage: '“Just saw this” — about a message from last week.',
    },
  },
  {
    id: 'starter', title: 'The Conversation Starter', emoji: '🔥', colors: ['#FF7A59', '#1B1535'],
    metric: (m, g) => (m.starters >= 5 ? m.starters / Math.max(1, g.members.reduce((s, x) => s + x.starters, 0)) : 0),
    stat: (m) => `Broke the silence ${fmt(m.starters)} times`,
    roast: {
      friendly: 'The reason this group still talks. Thank you for your service.',
      spicy: 'If you didn’t text first, would anyone?',
      savage: 'Carrying this chat on your back with zero salary.',
    },
  },
  {
    id: 'killer', title: 'The Chat Killer', emoji: '💀', colors: ['#2A2150', '#FFF6E6'],
    metric: (m) => (m.lastWords >= 5 ? per(m.lastWords, m) : 0),
    stat: (m) => `Got the last word ${fmt(m.lastWords)} times — then silence`,
    roast: {
      friendly: 'Says it so well there’s nothing left to add.',
      spicy: 'You text, the chat dies. Coincidence? Every time?',
      savage: 'Your messages are where conversations go to die.',
    },
  },
  {
    id: 'essay', title: 'The Essay Writer', emoji: '📜', colors: ['#B79CFF', '#1B1535'],
    metric: (m) => (m.messages >= 20 && m.avgWords >= 9 ? Math.min(1, m.avgWords / 30) : 0),
    stat: (m) => `${m.avgWords.toFixed(1)} words per message · longest: ${fmt(m.longestMsgWords)} words`,
    roast: {
      friendly: 'Thoughtful, detailed, thorough. We read every word (mostly).',
      spicy: 'Sends paragraphs. Gets “ok” back. Keeps going.',
      savage: 'Nobody has finished one of your messages since 2023.',
    },
  },
  {
    id: 'oneword', title: 'The “k” Texter', emoji: '🤏', colors: ['#9BE7FF', '#1B1535'],
    metric: (m) => (m.messages >= 30 && m.avgWords <= 3.2 ? 1 / Math.max(1, m.avgWords) : 0),
    stat: (m) => `Just ${m.avgWords.toFixed(1)} words per message`,
    roast: {
      friendly: 'Short, sweet and straight to the point.',
      spicy: 'Charges per word, apparently.',
      savage: 'Communicates like every letter costs money.',
    },
  },
  {
    id: 'emoji', title: 'The Emoji Overlord', emoji: '🤪', colors: ['#FFD84D', '#1B1535'],
    metric: (m) => (m.emojis >= 20 ? Math.min(1, m.emojis / m.messages / 1.5) : 0),
    stat: (m) => `${fmt(m.emojis)} emojis sent${m.topEmoji ? ` · favourite: ${m.topEmoji}` : ''}`,
    roast: {
      friendly: 'Brings the colour to this chat, one emoji at a time.',
      spicy: 'Words are optional. Emojis are mandatory.',
      savage: 'Has not finished a sentence without an emoji since birth.',
    },
  },
  {
    id: 'media', title: 'The Meme Dealer', emoji: '📸', colors: ['#FF9A3D', '#1B1535'],
    metric: (m) => (m.media >= 15 ? per(m.media, m) : 0),
    stat: (m) => `${fmt(m.media)} photos, videos and stickers dropped`,
    roast: {
      friendly: 'Supplier of the group’s finest content.',
      spicy: 'Your camera roll is 90% things you sent us.',
      savage: 'The reason everyone’s storage is full.',
    },
  },
  {
    id: 'laugh', title: 'The Laugh Track', emoji: '😂', colors: ['#7CF2A0', '#1B1535'],
    metric: (m) => (m.laughs >= 10 ? per(m.laughs, m) : 0),
    stat: (m) => `Laughed in ${fmt(m.laughs)} messages`,
    roast: {
      friendly: 'Everyone’s funnier when you’re in the chat.',
      spicy: 'Types “hahaha” with a completely straight face.',
      savage: 'Laughs at everything. Standards: none.',
    },
  },
  {
    id: 'question', title: 'The Interrogator', emoji: '❓', colors: ['#6FD6C8', '#1B1535'],
    metric: (m) => (m.questions >= 10 ? per(m.questions, m) : 0),
    stat: (m) => `Asked ${fmt(m.questions)} questions`,
    roast: {
      friendly: 'Curious, caring, always checking in.',
      spicy: 'Every answer is in the chat. You never scroll up.',
      savage: 'Could have Googled it. Chose to ask us. Every time.',
    },
  },
  {
    id: 'caps', title: 'THE CAPS LOCK CRIMINAL', emoji: '📢', colors: ['#FF4D6D', '#1B1535'],
    metric: (m) => (m.caps >= 8 ? per(m.caps, m) : 0),
    stat: (m) => `${fmt(m.caps)} MESSAGES IN FULL CAPS`,
    roast: {
      friendly: 'ENTHUSIASM LEVEL: UNMATCHED.',
      spicy: 'WE CAN HEAR YOU. PLEASE.',
      savage: 'Volume stuck on max. Indoor voice not found.',
    },
  },
  {
    id: 'spam', title: 'The Triple Texter', emoji: '📱', colors: ['#C6A8FF', '#1B1535'],
    metric: (m) => (m.monologues >= 5 ? Math.min(1, (m.monologues * 4) / m.messages) : 0),
    stat: (m) => `Record: ${fmt(m.longestRun)} messages in a row`,
    roast: {
      friendly: 'So much to say, so many notifications to say it with.',
      spicy: 'One thought. Seven messages.',
      savage: 'Our phones vibrate off the table when you’re typing.',
    },
  },
  {
    id: 'links', title: 'The Link Librarian', emoji: '🔗', colors: ['#7FB8FF', '#1B1535'],
    metric: (m) => (m.links >= 8 ? per(m.links, m) : 0),
    stat: (m) => `Shared ${fmt(m.links)} links`,
    roast: {
      friendly: 'Always finding something worth sharing.',
      spicy: 'Sends links. Nobody clicks. Sends more.',
      savage: '“Did you watch it?” No. Nobody did.',
    },
  },
  {
    id: 'deleter', title: 'The Evidence Deleter', emoji: '🧹', colors: ['#D9F25A', '#1B1535'],
    metric: (m) => (m.deleted >= 5 ? per(m.deleted, m) : 0),
    stat: (m) => `Deleted ${fmt(m.deleted)} messages`,
    roast: {
      friendly: 'A perfectionist. Only the best messages survive.',
      spicy: 'We all saw it before you deleted it.',
      savage: '“This message was deleted” is your most sent text.',
    },
  },
];

const FALLBACKS: Award[] = [
  {
    id: 'lurker', title: 'The Silent Observer', emoji: '👀', colors: ['#3A2F6B', '#FFF6E6'],
    metric: () => 0,
    stat: (m) => `${fmt(m.messages)} messages · ${pct(m.share)} of the chat`,
    roast: {
      friendly: 'Quiet, but always in the room.',
      spicy: 'Online. Watching. Saying nothing.',
      savage: 'Has seen everything. Contributed nothing.',
    },
  },
  {
    id: 'steady', title: 'The Reliable One', emoji: '🫡', colors: ['#8FE3C0', '#1B1535'],
    metric: () => 0,
    stat: (m) => `${fmt(m.messages)} messages across ${fmt(m.activeDays)} days`,
    roast: {
      friendly: 'Shows up, replies, keeps the peace. A group needs one.',
      spicy: 'Too normal to roast. Suspicious.',
      savage: 'No chaos, no drama, no personality detected.',
    },
  },
];

const byId = new Map([...AWARDS, ...FALLBACKS].map((a) => [a.id, a]));

function pillsFor(m: MemberStats): string[] {
  const out = [`#${m.rank} most active`, `${fmt(m.messages)} msgs`];
  if (m.topEmoji) out.push(`Fav ${m.topEmoji}`);
  else out.push(`${fmt(m.words)} words`);
  return out;
}

/** Give every member the award they stand out most for; each award is used once. */
export function assignAwards(g: GroupStats, level: RoastLevel, maxCards = 12): MemberCardData[] {
  const members = g.members.slice(0, maxCards);
  type Cand = { mi: number; ai: number; rel: number; score: number };
  const cands: Cand[] = [];
  AWARDS.forEach((aw, ai) => {
    const vals = members.map((m) => aw.metric(m, g));
    const max = Math.max(...vals, 0);
    if (max <= 0) return;
    // The holder who is furthest ahead of the runner-up gets first pick,
    // so people land on the title that is most distinctly theirs.
    const second = [...vals].sort((x, y) => y - x)[1] || 0;
    const margin = (max - second) / max;
    vals.forEach((v, mi) => {
      if (v <= 0) return;
      const rel = v / max;
      cands.push({ mi, ai, rel, score: rel * (0.6 + (v === max ? 0.4 * margin : 0)) - ai * 0.0001 });
    });
  });
  cands.sort((x, y) => y.score - x.score);

  const chosen = new Map<number, Award>();
  const used = new Set<number>();
  for (const c of cands) {
    if (chosen.has(c.mi) || used.has(c.ai)) continue;
    if (c.rel < 0.5) continue; // not standout enough to own the title
    chosen.set(c.mi, AWARDS[c.ai]);
    used.add(c.ai);
  }

  return members.map((m, mi) => {
    const aw = chosen.get(mi) || (m.share < 0.6 / Math.max(2, g.memberCount) ? FALLBACKS[0] : FALLBACKS[1]);
    return {
      name: m.name,
      awardId: aw.id,
      title: aw.title,
      emoji: aw.emoji,
      colors: aw.colors,
      statLine: aw.stat(m, g),
      roast: aw.roast[level],
      ai: false,
      pills: pillsFor(m),
      stats: m,
    };
  });
}

/** Swap the built-in roast lines when the user changes the level. */
export function reRoast(cards: MemberCardData[], level: RoastLevel): MemberCardData[] {
  return cards.map((c) => {
    const aw = byId.get(c.awardId);
    return aw ? { ...c, roast: aw.roast[level], ai: false } : c;
  });
}

export function localVibe(g: GroupStats): GroupVibe {
  const h = g.busiestHour;
  const top = g.members[0];
  if (top && top.share > 0.5 && g.memberCount > 2)
    return { name: 'One-Person Podcast', emoji: '🎙️', line: `${top.name.split(' ')[0]} talks. Everyone else listens.`, ai: false };
  if (h < 5 || h >= 23)
    return { name: 'The Night Shift', emoji: '🌙', line: `Peak chaos at ${hourLabel(h)}. Nobody here owns a bedtime.`, ai: false };
  if (g.mediaCount / g.totalMessages > 0.25)
    return { name: 'Meme Warehouse', emoji: '📦', line: 'More pictures than words. Communication by sticker.', ai: false };
  if (g.perDay > 80)
    return { name: 'Group Therapy, Unlicensed', emoji: '🛋️', line: `${fmt(g.perDay)} messages a day. This is a full-time job.`, ai: false };
  if (g.longestSilenceDays > 20)
    return { name: 'The Reunion Tour', emoji: '🎸', line: `Went quiet for ${Math.round(g.longestSilenceDays)} days, came back like nothing happened.`, ai: false };
  if (h >= 9 && h < 18)
    return { name: 'Office Hours Gossip', emoji: '☕', line: `Most active at ${hourLabel(h)}. Somebody is definitely not working.`, ai: false };
  return { name: 'Evening Debrief Club', emoji: '🍿', line: `Daily download at ${hourLabel(h)}. Attendance is mandatory.`, ai: false };
}
