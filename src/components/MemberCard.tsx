import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GroupStats, GroupVibe, MemberCardData, ViewRef } from '../types';
import { colors, firstName, fmt, font, pctLabel } from '../theme';
import { Sticker, Watermark } from './ui';

type CardProps = { card: MemberCardData; groupTitle: string; period: string; width: number; height: number };

const isDark = (fg: string) => fg !== colors.ink;

/**
 * One person's title card, 9:16 so it drops straight into a Story or status.
 * Built like a die-cut sticker: flat colour, thick white edge, the roast in a chat bubble.
 */
export const MemberCard = forwardRef<ViewRef, CardProps>(({ card, groupTitle, period, width, height }, ref) => {
  const k = width / 340; // everything scales with the card
  const [bg, fg] = card.colors;
  const tile = isDark(fg) ? 'rgba(255,255,255,0.12)' : 'rgba(27,21,53,0.1)';
  const m = card.stats;
  const tiles = [
    { v: fmt(m.messages), l: 'messages' },
    { v: pctLabel(m.share), l: 'of the chat' },
    { v: `#${m.rank}`, l: 'most active' },
  ];
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width, height, borderRadius: 32 * k, borderWidth: 5 * k, borderColor: colors.white, backgroundColor: bg, overflow: 'hidden', padding: 18 * k }}
    >
      <View style={s.topRow}>
        <Text style={{ fontFamily: font.bold, fontSize: 12.5 * k, color: fg, opacity: 0.75, flex: 1 }} numberOfLines={1}>{groupTitle}</Text>
        <Text style={{ fontFamily: font.bold, fontSize: 12.5 * k, color: fg, opacity: 0.75 }}>{period}</Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Sticker emoji={card.emoji} size={92 * k} />
        <Text style={{ fontFamily: font.bold, fontSize: 21 * k, color: fg, marginTop: 14 * k }} numberOfLines={1}>{card.name} is</Text>
        <Text
          style={{ fontFamily: font.display, fontSize: 40 * k, lineHeight: 41 * k, letterSpacing: -1.4 * k, color: fg, marginTop: 2 * k }}
          adjustsFontSizeToFit
          numberOfLines={3}
        >
          {card.title}
        </Text>

        {/* the evidence, on a strip that looks stuck on at an angle */}
        <View style={[s.strip, { backgroundColor: isDark(fg) ? colors.mango : colors.ink, marginTop: 12 * k, paddingVertical: 6 * k, paddingHorizontal: 10 * k, borderRadius: 8 * k }]}>
          <Text style={{ fontFamily: font.bold, fontSize: 13.5 * k, color: isDark(fg) ? colors.ink : colors.text }}>{card.statLine}</Text>
        </View>

        {/* the roast, as an incoming chat message */}
        <View style={{ marginTop: 16 * k }}>
          <View style={[s.bubble, { borderRadius: 20 * k, borderBottomLeftRadius: 5 * k, padding: 14 * k, paddingBottom: 9 * k }]}>
            <Text style={{ fontFamily: font.body, fontSize: 17 * k, lineHeight: 23 * k, color: colors.ink }} adjustsFontSizeToFit numberOfLines={5}>
              {card.roast}
            </Text>
            <Text style={{ fontFamily: font.bold, fontSize: 11 * k, color: '#3A9BE8', textAlign: 'right', lineHeight: 13 * k }}>✓✓</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 6 * k, marginBottom: 12 * k }}>
        {tiles.map((t) => (
          <View key={t.l} style={{ flex: 1, backgroundColor: tile, borderRadius: 12 * k, paddingVertical: 8 * k, alignItems: 'center' }}>
            <Text style={{ fontFamily: font.display, fontSize: 19 * k, letterSpacing: -0.5 * k, color: fg }}>{t.v}</Text>
            <Text style={{ fontFamily: font.bold, fontSize: 10.5 * k, color: fg, opacity: 0.75 }}>{t.l}</Text>
          </View>
        ))}
      </View>
      <Watermark color={fg} scale={k} />
    </View>
  );
});

type PosterProps = { stats: GroupStats; cards: MemberCardData[]; vibe: GroupVibe; width: number; height: number };

/** The whole group on one image: the one people post in the chat itself. */
export const GroupPoster = forwardRef<ViewRef, PosterProps>(({ stats, cards, vibe, width, height }, ref) => {
  const k = width / 340;
  const shown = cards.slice(0, 8);
  const dense = shown.length > 6;
  const dot = (dense ? 34 : 40) * k;
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width, height, borderRadius: 32 * k, borderWidth: 5 * k, borderColor: colors.white, backgroundColor: colors.panel, overflow: 'hidden', padding: 18 * k }}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 12.5 * k, color: colors.mango }}>{stats.periodLabel} wrapped</Text>
      <Text style={{ fontFamily: font.display, fontSize: 28 * k, lineHeight: 30 * k, letterSpacing: -0.9 * k, color: colors.text, marginTop: 4 * k }} numberOfLines={2}>
        {stats.title}
      </Text>
      <Text style={{ fontFamily: font.body, fontSize: 13 * k, lineHeight: 18 * k, color: colors.dim, marginTop: 6 * k }} numberOfLines={2}>
        {fmt(stats.totalMessages)} messages from {stats.memberCount} people. Verdict: {vibe.name} {vibe.emoji}
      </Text>

      <View style={{ flex: 1, justifyContent: 'center', gap: (dense ? 7 : 10) * k }}>
        {shown.map((c, i) => (
          <View key={c.name} style={s.row}>
            <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: c.colors[0], alignItems: 'center', justifyContent: 'center', transform: [{ rotate: i % 2 ? '6deg' : '-6deg' }] }}>
              <Text style={{ fontSize: dot * 0.52, lineHeight: dot * 0.68 }}>{c.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 * k }}>
              <Text style={{ fontFamily: font.display, fontSize: (dense ? 14 : 15.5) * k, letterSpacing: -0.3 * k, color: colors.text }} numberOfLines={1}>{firstName(c.name)}</Text>
              <Text style={{ fontFamily: font.body, fontSize: (dense ? 11.5 : 12.5) * k, color: colors.dim }} numberOfLines={1}>{c.title}</Text>
            </View>
            <Text style={{ fontFamily: font.bold, fontSize: 12.5 * k, color: colors.dim }}>{pctLabel(c.stats.share)}</Text>
          </View>
        ))}
        {cards.length > shown.length && (
          <Text style={{ fontFamily: font.bold, fontSize: 12 * k, color: colors.dim }}>and {cards.length - shown.length} more in the app</Text>
        )}
      </View>
      <Watermark color={colors.text} scale={k} />
    </View>
  );
});

const s = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: 10 },
  strip: { alignSelf: 'flex-start', transform: [{ rotate: '-1.5deg' }] },
  bubble: { backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center' },
});
