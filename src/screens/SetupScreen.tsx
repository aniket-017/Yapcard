import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ParsedChat, RoastLevel } from '../types';
import type { Period } from '../lib/stats';
import { Button, Chips } from '../components/ui';
import { colors, fmt, font } from '../theme';

export const LEVELS: { value: RoastLevel; label: string }[] = [
  { value: 'friendly', label: '😇 Friendly' },
  { value: 'spicy', label: '🌶️ Spicy' },
  { value: 'savage', label: '💀 Savage' },
];

export function SetupScreen({
  chat, periods, periodIdx, onPeriod, level, onLevel, aiPossible, useAi, onUseAi, onStart, onBack, working,
}: {
  chat: ParsedChat;
  periods: Period[];
  periodIdx: number;
  onPeriod: (i: number) => void;
  level: RoastLevel;
  onLevel: (l: RoastLevel) => void;
  aiPossible: boolean;
  useAi: boolean;
  onUseAi: (v: boolean) => void;
  onStart: () => void;
  onBack: () => void;
  working: boolean;
}) {
  const insets = useSafeAreaInsets();
  const p = periods[periodIdx];
  const inPeriod = chat.messages.filter((m) => m.ts >= p.from && m.ts < p.to);
  const people = new Set(inPeriod.map((m) => m.author)).size;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={[s.wrap, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
      <View>
        <Text style={s.kicker}>Chat loaded</Text>
        <Text style={s.title} numberOfLines={3}>{chat.title}</Text>
        <Text style={s.sub}>{fmt(inPeriod.length)} messages from {people} people</Text>
      </View>

      {periods.length > 1 && (
        <View style={s.block}>
          <Text style={s.label}>Which period?</Text>
          <Chips options={periods.map((x, i) => ({ value: String(i), label: x.label }))} value={String(periodIdx)} onChange={(v) => onPeriod(Number(v))} />
        </View>
      )}

      <View style={s.block}>
        <Text style={s.label}>How hard should we roast?</Text>
        <Chips options={LEVELS} value={level} onChange={onLevel} />
        <Text style={s.hint}>Roasts are about texting habits only. You can change this later.</Text>
      </View>

      {aiPossible && (
        <View style={[s.block, s.aiRow]}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>AI-written roasts</Text>
            <Text style={s.hint}>
              Sends the stats and about 120 sample messages to our server with names, numbers and links removed. Off = everything stays on this phone.
            </Text>
          </View>
          <Switch value={useAi} onValueChange={onUseAi} trackColor={{ true: colors.mint, false: colors.panel2 }} thumbColor="#fff" />
        </View>
      )}

      <View style={{ gap: 12 }}>
        {working ? (
          <View style={s.working}>
            <ActivityIndicator color={colors.mango} />
            <Text style={s.workingText}>{useAi && aiPossible ? 'Writing your roasts…' : 'Crunching the numbers…'}</Text>
          </View>
        ) : (
          <Button label="Start the recap" onPress={onStart} />
        )}
        <Button label="Pick a different chat" kind="outline" onPress={onBack} disabled={working} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, gap: 22, maxWidth: 520, width: '100%', alignSelf: 'center' },
  kicker: { color: colors.mint, fontFamily: font.bold, fontSize: 15 },
  title: { color: colors.text, fontFamily: font.display, fontSize: 38, lineHeight: 40, letterSpacing: -1.4, marginTop: 6 },
  sub: { color: colors.dim, fontFamily: font.body, fontSize: 17, marginTop: 8 },
  block: { backgroundColor: colors.panel, borderRadius: 24, padding: 18, gap: 12 },
  label: { color: colors.text, fontFamily: font.display, fontSize: 18, letterSpacing: -0.4 },
  hint: { color: colors.dim, fontFamily: font.body, fontSize: 13.5, lineHeight: 19 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  working: { minHeight: 56, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  workingText: { color: colors.text, fontFamily: font.bold, fontSize: 16 },
});
