import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Recap, ViewRef } from '../types';
import { Button, CountUp, Rise, Sticker, Watermark } from '../components/ui';
import { colors, dateLabel, firstName, fmt, font, hourLabel, slideColors } from '../theme';
import { shareView } from '../lib/share';

// Every slide has one text colour; <T> picks it up so slides don't repeat it.
const Ink = React.createContext<string>(colors.text);
function T({ style, ...rest }: TextProps) {
  const color = React.useContext(Ink);
  return <Text {...rest} style={[{ color }, style]} />;
}

function InkCount({ to }: { to: number }) {
  const color = React.useContext(Ink);
  return <CountUp to={to} style={[s.mega, { color }]} />;
}

type Slide = { key: string; colors: [string, string]; dark?: boolean; interactive?: boolean; render: (onAnswered: () => void) => React.ReactNode };

const buzz = (ok: boolean) => {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
};

/** "Guess who" question: tap a name, then see the answer and the leaderboard. */
function Guess({
  question, options, answer, reveal, onAnswered,
}: { question: string; options: string[]; answer: string; reveal: React.ReactNode; onAnswered: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <View style={s.body} pointerEvents="box-none">
      <Rise><Text style={[s.kicker, { color: colors.mango }]}>Guess before you see it</Text></Rise>
      <Rise delay={80}><T style={s.h2}>{question}</T></Rise>
      <View style={{ gap: 10, marginTop: 22 }} pointerEvents="box-none">
        {options.map((o, i) => {
          const isAnswer = o === answer;
          const show = picked !== null;
          return (
            <Rise key={o} delay={140 + i * 60}>
              <Pressable
                disabled={show}
                onPress={() => {
                  setPicked(o);
                  buzz(isAnswer);
                  onAnswered();
                }}
                accessibilityRole="button"
                accessibilityLabel={o}
                style={[
                  s.option,
                  show && isAnswer && { backgroundColor: colors.mint, borderColor: colors.mint },
                  show && picked === o && !isAnswer && { backgroundColor: colors.red, borderColor: colors.red },
                ]}
              >
                <Text style={[s.optionText, show && (isAnswer || picked === o) && { color: colors.ink }]} numberOfLines={1}>
                  {o}{show && isAnswer ? '  ✓' : show && picked === o ? '  ✗' : ''}
                </Text>
              </Pressable>
            </Rise>
          );
        })}
      </View>
      {picked !== null && (
        <Rise style={{ marginTop: 20 }}>
          <T style={s.verdict}>{picked === answer ? 'You know your people. 🎯' : `Nope. It’s ${firstName(answer)}.`}</T>
          {reveal}
        </Rise>
      )}
    </View>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; text: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View style={{ gap: 8, marginTop: 14 }}>
      {rows.map((r, i) => (
        <View key={r.label} style={s.barRow}>
          <T style={s.barLabel} numberOfLines={1}>{firstName(r.label)}</T>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${Math.max(4, (r.value / max) * 100)}%`, backgroundColor: i === 0 ? colors.mint : colors.faint }]} />
          </View>
          <T style={s.barValue}>{r.text}</T>
        </View>
      ))}
    </View>
  );
}

function pickOptions(answer: string, all: string[], n = 4): string[] {
  const others = all.filter((x) => x !== answer).slice(0, 7);
  // Deterministic shuffle so the order doesn't jump on re-render.
  const seed = answer.length + all.length;
  const mixed = others.map((x, i) => ({ x, k: (i * 7 + seed * 3) % 5 })).sort((a, b) => a.k - b.k).map((o) => o.x).slice(0, n - 1);
  const pos = seed % (mixed.length + 1);
  mixed.splice(pos, 0, answer);
  return mixed;
}

function buildSlides(recap: Recap): Slide[] {
  const g = recap.stats;
  const names = g.members.map((m) => m.name);
  const out: Slide[] = [];

  out.push({
    key: 'intro', colors: slideColors.intro,
    render: () => (
      <View style={s.body}>
        <Rise><T style={s.kicker}>{g.periodLabel} wrapped</T></Rise>
        <Rise delay={120}><T style={s.h1} adjustsFontSizeToFit numberOfLines={4}>{g.title}</T></Rise>
        <Rise delay={260}><T style={s.lead}>{g.memberCount} people. One chat. Let’s see who’s been carrying it.</T></Rise>
        <Rise delay={500}><T style={s.tapHint}>Tap the right side to continue</T></Rise>
      </View>
    ),
  });

  const books = g.totalWords / 80000;
  out.push({
    key: 'total', colors: slideColors.total,
    render: () => (
      <View style={s.body}>
        <Rise><T style={s.lead}>Together you sent</T></Rise>
        <InkCount to={g.totalMessages} />
        <Rise delay={200}><T style={s.h2}>messages</T></Rise>
        <Rise delay={500}>
          <T style={s.lead}>
            That’s {fmt(Math.max(1, g.perDay))} a day{books >= 0.5 ? ` and ${fmt(g.totalWords)} words — about ${books >= 1.5 ? `${Math.round(books)} novels` : 'a whole novel'}` : ` and ${fmt(g.totalWords)} words`}.
          </T>
        </Rise>
        {g.longestStreakDays >= 5 && (
          <Rise delay={700}><Text style={s.badge}>🔥 Longest streak: {g.longestStreakDays} days in a row</Text></Rise>
        )}
      </View>
    ),
  });

  const top = g.members[0];
  out.push({
    key: 'guess-yapper', colors: slideColors.guess, interactive: true,
    render: (onAnswered) => (
      <Guess
        onAnswered={onAnswered}
        question="Who sent the most messages?"
        options={pickOptions(top.name, names)}
        answer={top.name}
        reveal={<Bars rows={g.members.slice(0, 5).map((m) => ({ label: m.name, value: m.messages, text: fmt(m.messages) }))} />}
      />
    ),
  });

  const peak = g.busiestHour;
  const maxHour = Math.max(...g.hours, 1);
  const hourMood = peak < 5 ? 'Nobody here sleeps.' : peak < 12 ? 'Morning people. Suspicious.' : peak < 18 ? 'Someone is definitely not working.' : 'The evening debrief is sacred.';
  out.push({
    key: 'hours', colors: slideColors.hour,
    render: () => (
      <View style={s.body}>
        <Rise><T style={s.lead}>This chat comes alive at</T></Rise>
        <Rise delay={120}><T style={s.mega}>{hourLabel(peak)}</T></Rise>
        <Rise delay={260}><T style={s.lead}>{hourMood}</T></Rise>
        <Rise delay={400} style={s.hist}>
          {g.hours.map((n, h) => (
            <View key={h} style={s.histCol}>
              <View style={[s.histBar, { height: `${Math.max(3, (n / maxHour) * 100)}%`, backgroundColor: h === peak ? colors.ink : 'rgba(27,21,53,0.28)' }]} />
            </View>
          ))}
        </Rise>
        <View style={s.histAxis}>
          {['12 AM', '6 AM', '12 PM', '6 PM', '11 PM'].map((t) => <T key={t} style={s.axisText}>{t}</T>)}
        </View>
      </View>
    ),
  });

  const speed = recap.cards.find((c) => c.awardId === 'speed');
  const owl = recap.cards.find((c) => c.awardId === 'nightowl');
  const ghost = recap.cards.find((c) => c.awardId === 'ghost');
  const second = ghost
    ? { q: 'Who disappears the longest?', c: ghost }
    : owl
      ? { q: 'Who texts the most after midnight?', c: owl }
      : speed
        ? { q: 'Who replies the fastest?', c: speed }
        : null;
  if (second && names.length >= 3) {
    out.push({
      key: 'guess-2', colors: slideColors.guess, interactive: true,
      render: (onAnswered) => (
        <Guess
          onAnswered={onAnswered}
          question={second.q}
          options={pickOptions(second.c.name, names)}
          answer={second.c.name}
          reveal={<T style={s.revealLine}>{second.c.emoji} {second.c.statLine}</T>}
        />
      ),
    });
  }

  if (g.topEmojis.length || g.topWords.length) {
    out.push({
      key: 'language', colors: slideColors.lang,
      render: () => (
        <View style={s.body}>
          <Rise><T style={s.kicker}>Your group’s language</T></Rise>
          {g.topEmojis.length > 0 && (
            <Rise delay={120} style={s.emojiRow}>
              {g.topEmojis.slice(0, 5).map((e, i) => (
                <View key={e.emoji} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: i === 0 ? 64 : 40 }}>{e.emoji}</Text>
                  <T style={s.emojiCount}>{fmt(e.count)}</T>
                </View>
              ))}
            </Rise>
          )}
          {g.topWords.length > 0 && (
            <Rise delay={300}>
              <T style={[s.lead, { marginTop: 18 }]}>Words you can’t stop saying</T>
              <View style={s.words}>
                {g.topWords.map((w, i) => (
                  <View key={w.word} style={s.word}>
                    <Text style={[s.wordText, { fontSize: i < 2 ? 24 : 18 }]}>{w.word}</Text>
                    <Text style={s.wordCount}>×{fmt(w.count)}</Text>
                  </View>
                ))}
              </View>
            </Rise>
          )}
        </View>
      ),
    });
  }

  if (g.busiestDay) {
    const bd = g.busiestDay;
    out.push({
      key: 'day', colors: slideColors.day,
      render: () => (
        <View style={s.body}>
          <Rise><T style={s.lead}>Your loudest day was</T></Rise>
          <Rise delay={120}><T style={s.h1}>{dateLabel(bd.ts)}</T></Rise>
          <Rise delay={260}><T style={s.h2}>{fmt(bd.count)} messages in one day.</T></Rise>
          <Rise delay={400}><T style={s.lead}>What happened?? Somebody explain in the chat.</T></Rise>
          {g.longestSilenceDays >= 2 && (
            <Rise delay={600}>
              <Text style={s.badge}>
                🦗 Longest silence: {fmt(g.longestSilenceDays)} days without a single message
              </Text>
            </Rise>
          )}
        </View>
      ),
    });
  }

  if (g.duo) {
    const duo = g.duo;
    out.push({
      key: 'duo', colors: slideColors.duo,
      render: () => (
        <View style={s.body}>
          <Rise><T style={s.kicker}>The power duo</T></Rise>
          <Rise delay={120}>
            <T style={s.h1} adjustsFontSizeToFit numberOfLines={3}>{firstName(duo.a)} & {firstName(duo.b)}</T>
          </Rise>
          <Rise delay={260}>
            <T style={s.lead}>Replied to each other within minutes {fmt(duo.count)} times. Get a room. Or at least a separate chat.</T>
          </Rise>
        </View>
      ),
    });
  }

  out.push({
    key: 'vibe', colors: slideColors.vibe,
    render: () => (
      <View style={s.body}>
        <Rise><T style={s.kicker}>Your group personality{recap.vibe.ai ? ', written by AI' : ''}</T></Rise>
        <Rise delay={120} style={{ marginTop: 14, marginBottom: 6 }}><Sticker emoji={recap.vibe.emoji} size={112} /></Rise>
        <Rise delay={220}><T style={s.h1} adjustsFontSizeToFit numberOfLines={3}>{recap.vibe.name}</T></Rise>
        <Rise delay={360}><T style={s.lead}>{recap.vibe.line}</T></Rise>
      </View>
    ),
  });

  return out;
}

export function StoryScreen({ recap, onDone, onClose }: { recap: Recap; onDone: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const slides = useMemo(() => buildSlides(recap), [recap]);
  const [i, setI] = useState(0);
  const shot = useRef<ViewRef>(null);
  const isLast = i === slides.length; // one extra page: the hand-off to the cards
  const slide = slides[Math.min(i, slides.length - 1)];

  // Once a guess is answered, taps anywhere move on to the next slide.
  const [answered, setAnswered] = useState(false);
  const go = (to: number) => {
    setAnswered(false);
    setI(to);
  };
  const next = () => (i < slides.length ? go(i + 1) : onDone());
  const back = () => i > 0 && go(i - 1);

  const [bg, fg] = isLast ? slideColors.outro : slide.colors;
  const onDark = fg !== colors.ink;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View ref={shot} collapsable={false} style={{ flex: 1, backgroundColor: bg }}>
        {/* Tap zones sit under the content so buttons on a slide still work. */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          <Pressable style={{ flex: 1 }} onPress={back} accessibilityLabel="Previous" />
          <Pressable style={{ flex: 2 }} onPress={next} accessibilityLabel="Next" />
        </View>
        <Ink.Provider value={fg}>
          <View
            key={isLast ? 'outro' : slide.key}
            // Plain slides let every tap fall through to the zones below;
            // slides with buttons only catch taps on the buttons themselves.
            pointerEvents={isLast || (slide.interactive && !answered) ? 'box-none' : 'none'}
            style={{ flex: 1, paddingTop: insets.top + 54, paddingBottom: insets.bottom + 96, paddingHorizontal: 26, maxWidth: 560, width: '100%', alignSelf: 'center' }}
          >
            {isLast ? (
              <View style={s.body} pointerEvents="box-none">
                <Rise><T style={s.kicker}>One more thing</T></Rise>
                <Rise delay={120}><T style={s.h1}>Everyone got a title.</T></Rise>
                <Rise delay={260}><T style={s.lead}>{recap.cards.length} cards. Some of you won’t like yours.</T></Rise>
                <Rise delay={420} style={{ marginTop: 26 }}>
                  <Button label="Reveal the cards" kind="ink" onPress={onDone} />
                </Rise>
              </View>
            ) : (
              slide.render(() => setAnswered(true))
            )}
            <View pointerEvents="none"><Watermark color={fg} /></View>
          </View>
        </Ink.Provider>
        {answered && !isLast && (
          // After a guess, a full-screen layer on top makes any tap continue.
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
            <Pressable style={{ flex: 1 }} onPress={back} accessibilityLabel="Previous" />
            <Pressable style={{ flex: 2 }} onPress={next} accessibilityLabel="Next" />
          </View>
        )}
      </View>

      <View style={[s.progress, { top: insets.top + 12 }]} pointerEvents="none">
        {Array.from({ length: slides.length + 1 }).map((_, k) => (
          <View key={k} style={[s.seg, { backgroundColor: fg, opacity: k <= i ? 1 : 0.25 }]} />
        ))}
      </View>
      <Pressable
        onPress={onClose}
        style={[s.close, { top: insets.top + 26, backgroundColor: onDark ? colors.panel2 : 'rgba(27,21,53,0.14)' }]}
        accessibilityRole="button"
        accessibilityLabel="Close recap"
        hitSlop={10}
      >
        <Text style={[s.closeText, { color: fg }]}>✕</Text>
      </Pressable>
      <View style={[s.footer, { bottom: insets.bottom + 22 }]} pointerEvents="box-none">
        <Button label="Share this slide" kind={onDark ? 'outline' : 'ink'} onPress={() => shareView(shot, recap.stats.title)} style={{ minHeight: 48, paddingHorizontal: 22 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
  kicker: { fontFamily: font.bold, fontSize: 16 },
  h1: { fontFamily: font.display, fontSize: 52, lineHeight: 52, letterSpacing: -2.2, marginTop: 8 },
  h2: { fontFamily: font.display, fontSize: 31, lineHeight: 34, letterSpacing: -1, marginTop: 6 },
  mega: { fontFamily: font.display, fontSize: 92, lineHeight: 94, letterSpacing: -4 },
  lead: { fontFamily: font.body, fontSize: 20, lineHeight: 28, marginTop: 12 },
  tapHint: { fontFamily: font.bold, fontSize: 14.5, marginTop: 36, opacity: 0.7 },
  badge: { alignSelf: 'flex-start', marginTop: 22, backgroundColor: colors.ink, color: colors.text, fontFamily: font.bold, fontSize: 15, lineHeight: 21, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, overflow: 'hidden', transform: [{ rotate: '-1.5deg' }] },
  option: { minHeight: 56, borderRadius: 18, backgroundColor: colors.panel, justifyContent: 'center', paddingHorizontal: 18, borderWidth: 2, borderColor: colors.panel2 },
  optionText: { color: colors.text, fontFamily: font.display, fontSize: 19, letterSpacing: -0.4 },
  verdict: { fontFamily: font.display, fontSize: 22, letterSpacing: -0.5 },
  revealLine: { fontFamily: font.bold, fontSize: 17, marginTop: 8, lineHeight: 24 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 76, fontFamily: font.bold, fontSize: 14.5 },
  barTrack: { flex: 1, height: 16, borderRadius: 8, backgroundColor: colors.panel, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 8 },
  barValue: { width: 54, textAlign: 'right', fontFamily: font.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  hist: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 3, marginTop: 26 },
  histCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  histBar: { borderRadius: 4 },
  histAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisText: { fontFamily: font.bold, fontSize: 11.5, opacity: 0.7 },
  emojiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 14 },
  emojiCount: { fontFamily: font.bold, fontSize: 14 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  word: { flexDirection: 'row', alignItems: 'baseline', gap: 6, backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  wordText: { color: colors.text, fontFamily: font.display, letterSpacing: -0.4 },
  wordCount: { color: colors.mango, fontFamily: font.bold, fontSize: 13 },
  progress: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  close: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: font.display, fontSize: 16 },
  footer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
