import React from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MemberCardData, MemberStats } from '../types';
import { MemberCard } from '../components/MemberCard';
import { Button } from '../components/ui';
import { colors, font, SHARE_LINK } from '../theme';

const LINKS = [['Privacy', '/privacy'], ['Terms', '/terms'], ['Support', '/support']] as const;

const STEPS_ANDROID = ['Open the group in WhatsApp', 'Tap ⋮, then More, then Export chat', 'Choose “Without media”', 'Pick Yapcard, or save the file and import it here'];
const STEPS_IOS = ['Open the group in WhatsApp', 'Tap the group name, then Export Chat', 'Choose “Without Media”', 'Pick Yapcard, or “Save to Files” and import it here'];

// Three example cards so the first thing people see is what they'll get.
const sample = (name: string, awardId: string, title: string, emoji: string, bg: string, fg: string, statLine: string, roast: string, messages: number, share: number, rank: number): MemberCardData => ({
  name, awardId, title, emoji, colors: [bg, fg], statLine, roast, ai: false, pills: [],
  stats: { messages, share, rank } as MemberStats,
});
const SAMPLES = [
  sample('Kabir', 'nightowl', 'The 2 a.m. Menace', '🦉', '#5B4BD6', '#FFF6E6', '448 messages after midnight', 'Your best ideas arrive at 2 a.m. So do your worst.', 650, 0.13, 3),
  sample('Aarav', 'yapper', 'The Chief Yapper', '🗣️', '#FF5FA2', '#1B1535', '53% of every message sent', 'Has a thought. Sends it. Has another. Sends that too.', 2753, 0.53, 1),
  sample('Riya', 'ghost', 'The Ghost', '👻', '#FFB627', '#1B1535', 'Vanished for 69 days straight', 'Reads everything. Replies to nothing. We see you.', 21, 0.01, 6),
];

export function HomeScreen({
  onImport, onDemo, busy, error,
}: { onImport: () => void; onDemo: () => void; busy: boolean; error: string | null }) {
  const insets = useSafeAreaInsets();
  const steps = Platform.OS === 'ios' ? STEPS_IOS : STEPS_ANDROID;
  const w = 128;
  const h = (w * 16) / 9;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[s.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }]}>
      <View>
        <Text style={s.logo}>yapcard</Text>
        <Text style={s.h1}>Find out who your group chat really is.</Text>
        <Text style={s.sub}>Import a chat. Everyone gets a title, a roast and a card to post.</Text>
      </View>

      <View style={[s.fan, { height: h + 26 }]} accessibilityLabel="Example cards: The 2 a.m. Menace, The Chief Yapper, The Ghost">
        {SAMPLES.map((c, i) => (
          <View
            key={c.name}
            style={{
              marginHorizontal: -14,
              zIndex: i === 1 ? 2 : 1,
              transform: [{ rotate: `${(i - 1) * 9}deg` }, { translateY: i === 1 ? 0 : 16 }],
            }}
          >
            <MemberCard card={c} groupTitle="Weekend Plans" period="2026" width={w} height={h} />
          </View>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        {busy ? (
          <View style={s.busy}>
            <ActivityIndicator color={colors.mango} />
            <Text style={s.busyText}>Reading your chat…</Text>
          </View>
        ) : (
          <>
            <Button label="Import a chat export" onPress={onImport} />
            <Button label="Try it with a demo chat" kind="outline" onPress={onDemo} />
          </>
        )}
        {error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
      </View>

      <View style={s.panel}>
        <Text style={s.panelTitle}>How to get your chat</Text>
        {steps.map((t, i) => (
          <View key={t} style={s.step}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
            <Text style={s.stepText}>{t}</Text>
          </View>
        ))}
        <Text style={s.note}>On Telegram, export the chat as JSON from Telegram Desktop and import result.json.</Text>
      </View>

      <Text style={s.privacy}>Your chat is read on this phone. It's only uploaded if you choose to save a copy.</Text>

      <View style={s.links}>
        {LINKS.map(([label, path]) => (
          <Pressable key={path} onPress={() => Linking.openURL(`https://${SHARE_LINK}${path}`)} accessibilityRole="link" hitSlop={10}>
            <Text style={s.link}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, gap: 26, maxWidth: 520, width: '100%', alignSelf: 'center' },
  logo: { color: colors.mango, fontFamily: font.display, fontSize: 24, letterSpacing: -0.8 },
  h1: { color: colors.text, fontFamily: font.display, fontSize: 42, lineHeight: 43, letterSpacing: -1.6, marginTop: 18 },
  sub: { color: colors.dim, fontFamily: font.body, fontSize: 17, lineHeight: 24, marginTop: 12 },
  fan: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 6 },
  busy: { minHeight: 56, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  busyText: { color: colors.text, fontFamily: font.bold, fontSize: 16 },
  error: { color: '#FFA3B5', fontFamily: font.body, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  panel: { backgroundColor: colors.panel, borderRadius: 24, padding: 20, gap: 13 },
  panelTitle: { color: colors.text, fontFamily: font.display, fontSize: 19, letterSpacing: -0.4, marginBottom: 2 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.panel2, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.mango, fontFamily: font.display, fontSize: 14 },
  stepText: { color: colors.text, fontFamily: font.body, fontSize: 15.5, flex: 1, lineHeight: 21 },
  note: { color: colors.dim, fontFamily: font.body, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
  privacy: { color: colors.dim, fontFamily: font.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: -12 },
  link: { color: colors.dim, fontFamily: font.bold, fontSize: 14, textDecorationLine: 'underline' },
});
