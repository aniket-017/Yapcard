import type { ComponentRef } from 'react';
import type { View } from 'react-native';

/** What a ref to a <View> points at. */
export type ViewRef = ComponentRef<typeof View>;

export type MsgKind = 'text' | 'media' | 'deleted';

export type Msg = {
  ts: number; // local epoch ms
  author: string;
  text: string;
  kind: MsgKind;
};

export type ParsedChat = {
  title: string;
  source: 'whatsapp' | 'telegram';
  messages: Msg[];
};

/** The export exactly as picked or shared, kept only so it can be saved on the server if the user opts in. */
export type ChatFile = { bytes: Uint8Array; name: string };

export type ImportedChat = { chat: ParsedChat; file: ChatFile };

export type MemberStats = {
  name: string;
  messages: number;
  share: number; // 0..1 of all messages
  rank: number; // 1 = most messages
  words: number;
  avgWords: number;
  media: number;
  emojis: number;
  topEmoji: string | null;
  nightMsgs: number; // 00:00-04:59
  morningMsgs: number; // 05:00-08:59
  starters: number; // messages that broke a 6h+ silence
  lastWords: number; // messages followed by a 6h+ silence
  replies: number;
  medianReplyMin: number | null;
  longestRun: number; // most messages in a row
  monologues: number; // runs of 4+ in a row
  questions: number;
  laughs: number;
  links: number;
  deleted: number;
  caps: number;
  longestMsgWords: number;
  activeDays: number;
  ghostDays: number; // longest disappearance in days
};

export type GroupStats = {
  title: string;
  periodLabel: string;
  totalMessages: number;
  totalWords: number;
  mediaCount: number;
  memberCount: number;
  members: MemberStats[]; // sorted by messages desc
  start: number;
  end: number;
  spanDays: number;
  activeDays: number;
  perDay: number;
  busiestDay: { ts: number; count: number } | null;
  busiestHour: number;
  hours: number[]; // 24 buckets
  weekdays: number[]; // 7 buckets, 0 = Sunday
  longestSilenceDays: number;
  longestStreakDays: number;
  topEmojis: { emoji: string; count: number }[];
  topWords: { word: string; count: number }[];
  duo: { a: string; b: string; count: number } | null;
};

export type RoastLevel = 'friendly' | 'spicy' | 'savage';

export type MemberCardData = {
  name: string;
  awardId: string;
  title: string;
  emoji: string;
  colors: [string, string];
  statLine: string;
  roast: string;
  ai: boolean;
  pills: string[];
  stats: MemberStats;
};

export type GroupVibe = { name: string; line: string; emoji: string; ai: boolean };

export type Recap = {
  stats: GroupStats;
  cards: MemberCardData[];
  vibe: GroupVibe;
  level: RoastLevel;
};
