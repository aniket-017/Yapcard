import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recap, RoastLevel, ViewRef } from '../types';
import { GroupPoster, MemberCard } from '../components/MemberCard';
import { Button, Chips } from '../components/ui';
import { colors, firstName, font } from '../theme';
import { shareView } from '../lib/share';
import { LEVELS } from './SetupScreen';

export function CardsScreen({
  recap, onLevel, onReplay, onNew, refreshing,
}: { recap: Recap; onLevel: (l: RoastLevel) => void; onReplay: () => void; onNew: () => void; refreshing: boolean }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Largest 9:16 card that fits between the header and the controls.
  const maxH = H - insets.top - insets.bottom - 300;
  const cardW = Math.max(220, Math.min(W - 64, 400, (maxH * 9) / 16));
  const cardH = (cardW * 16) / 9;
  const gap = 14;
  const snap = cardW + gap;
  const side = (W - cardW) / 2;

  const items = useMemo(() => [{ key: '__poster' }, ...recap.cards.map((c) => ({ key: c.name }))], [recap.cards]);
  const refs = useRef<Record<string, React.RefObject<ViewRef | null>>>({});
  const refFor = (key: string) => (refs.current[key] ||= React.createRef<ViewRef>());

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / snap);
    if (i !== idx && i >= 0 && i < items.length) setIdx(i);
  };

  const current = items[idx];
  const card = idx > 0 ? recap.cards[idx - 1] : null;
  const hidden = card ? !revealed.has(card.name) : false;
  const shareLabel = !card ? 'Share the group poster' : hidden ? `Reveal ${firstName(card.name)}’s title` : `Share ${firstName(card.name)}’s card`;

  const reveal = (name: string) => setRevealed((prev) => new Set(prev).add(name));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14 }}>
      <View style={s.header}>
        <Text style={s.h} numberOfLines={1}>{recap.stats.title}</Text>
        <Text style={s.sub}>
          {idx === 0 ? 'Swipe to see everyone’s card' : `Card ${idx} of ${recap.cards.length}${card?.ai ? ', roast written by AI' : ''}`}
        </Text>
      </View>

      <FlatList
        data={items}
        horizontal
        keyExtractor={(it) => it.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: side, alignItems: 'center' }}
        ItemSeparatorComponent={() => <View style={{ width: gap }} />}
        getItemLayout={(_, i) => ({ length: snap, offset: snap * i, index: i })}
        style={{ flexGrow: 0, height: cardH + 8 }}
        renderItem={({ item, index }) => {
          if (index === 0) {
            return <GroupPoster ref={refFor(item.key)} stats={recap.stats} cards={recap.cards} vibe={recap.vibe} width={cardW} height={cardH} />;
          }
          const c = recap.cards[index - 1];
          const isHidden = !revealed.has(c.name);
          return (
            <View style={{ width: cardW, height: cardH }}>
              <MemberCard ref={refFor(item.key)} card={c} groupTitle={recap.stats.title} period={recap.stats.periodLabel} width={cardW} height={cardH} />
              {isHidden && (
                <Pressable
                  onPress={() => reveal(c.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Reveal ${c.name}'s title`}
                  style={[StyleSheet.absoluteFill, s.cover, { borderRadius: (32 * cardW) / 340 }]}
                >
                  <View style={s.coverBadge}><Text style={s.coverQ}>?</Text></View>
                  <Text style={s.coverName} numberOfLines={2}>{c.name}</Text>
                  <Text style={s.coverHint}>Tap to reveal their title</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />

      <View style={s.dots}>
        {items.map((it, i) => (
          <View key={it.key} style={[s.dot, i === idx && s.dotOn]} />
        ))}
      </View>

      <View style={s.controls}>
        <Button
          label={shareLabel}
          onPress={() => {
            if (card && hidden) reveal(card.name);
            else shareView(refFor(current.key), recap.stats.title);
          }}
        />
        <View style={s.levelRow}>
          <Chips options={LEVELS} value={recap.level} onChange={onLevel} />
        </View>
        {refreshing && <Text style={s.refreshing}>Rewriting the roasts…</Text>}
        <View style={s.links}>
          <Pressable onPress={onReplay} hitSlop={12} accessibilityRole="button"><Text style={s.link}>Replay the recap</Text></Pressable>
          <Pressable onPress={onNew} hitSlop={12} accessibilityRole="button"><Text style={s.link}>Wrap another chat</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 24, marginBottom: 12 },
  h: { color: colors.text, fontFamily: font.display, fontSize: 24, letterSpacing: -0.8 },
  sub: { color: colors.dim, fontFamily: font.body, fontSize: 15, marginTop: 2 },
  // A face-down card: dashed edge so it reads as "not opened yet".
  cover: { backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderStyle: 'dashed', borderColor: colors.faint, padding: 22 },
  coverBadge: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.mango, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  coverQ: { color: colors.ink, fontFamily: font.display, fontSize: 76, lineHeight: 84 },
  coverName: { color: colors.text, fontFamily: font.display, fontSize: 30, lineHeight: 32, letterSpacing: -1, marginTop: 18, textAlign: 'center' },
  coverHint: { color: colors.dim, fontFamily: font.body, fontSize: 15.5, marginTop: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap', paddingHorizontal: 24 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.faint },
  dotOn: { backgroundColor: colors.mango, width: 20 },
  controls: { flex: 1, paddingHorizontal: 24, justifyContent: 'flex-end', gap: 12, maxWidth: 520, width: '100%', alignSelf: 'center' },
  levelRow: { alignItems: 'center' },
  refreshing: { color: colors.dim, textAlign: 'center', fontFamily: font.body, fontSize: 13.5 },
  links: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 4 },
  link: { color: colors.dim, fontFamily: font.bold, fontSize: 15 },
});
