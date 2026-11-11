import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';

// The three cards that fan out: [colour, emoji, resting angle, resting x, resting y]
const CARDS: [string, string, number, number, number][] = [
  ['#5B4BD6', '🦉', -14, -78, 10],
  ['#FFB627', '👻', 14, 78, 10],
  ['#FF5FA2', '🗣️', 0, 0, -14], // drawn last so it sits on top
];

const CARD_W = 104;
const CARD_H = 164;

/**
 * Opening animation, about two seconds: three cards spring out of the centre
 * into a fan, the name rises underneath, then everything fades into the app.
 */
export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const deal = useRef(CARDS.map(() => new Animated.Value(0))).current;
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          // No movement: show the finished picture briefly, then fade.
          deal.forEach((v) => v.setValue(1));
          word.setValue(1);
          tag.setValue(1);
          Animated.timing(out, { toValue: 1, duration: 300, delay: 900, useNativeDriver: true }).start(() => onDone());
          return;
        }
        Animated.sequence([
          Animated.stagger(
            90,
            deal.map((v) => Animated.spring(v, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }))
          ),
          Animated.parallel([
            Animated.timing(word, { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
            Animated.timing(tag, { toValue: 1, duration: 380, delay: 160, useNativeDriver: true }),
          ]),
          Animated.delay(650),
          Animated.timing(out, { toValue: 1, duration: 380, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(() => onDone());
      });
    return () => {
      cancelled = true;
    };
  }, [deal, word, tag, out, onDone]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLabel="Yapcard"
      style={[
        StyleSheet.absoluteFill,
        s.stage,
        { opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] },
      ]}
    >
      <View style={s.fan}>
        {CARDS.map(([bg, emoji, angle, x, y], i) => (
          <Animated.View
            key={emoji}
            style={[
              s.card,
              {
                backgroundColor: bg,
                opacity: deal[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [
                  { translateX: deal[i].interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
                  { translateY: deal[i].interpolate({ inputRange: [0, 1], outputRange: [60, y] }) },
                  { rotate: deal[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${angle}deg`] }) },
                  { scale: deal[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                ],
              },
            ]}
          >
            <View style={s.badge}><Text style={s.emoji}>{emoji}</Text></View>
            <View style={s.line} />
            <View style={[s.line, { width: '55%' }]} />
          </Animated.View>
        ))}
      </View>

      <Animated.Text
        style={[
          s.word,
          { opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }, { scale: word.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
        ]}
      >
        yapcard
      </Animated.Text>
      <Animated.Text style={[s.tag, { opacity: tag }]}>Your group chat, dealt out as cards.</Animated.Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  stage: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  fan: { width: CARD_W, height: CARD_H, marginBottom: 44 },
  card: {
    position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 20, borderWidth: 4, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  badge: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 6, transform: [{ rotate: '-8deg' }] },
  emoji: { fontSize: 32, lineHeight: 40 },
  line: { width: '70%', height: 8, borderRadius: 4, backgroundColor: 'rgba(27,21,53,0.25)' },
  word: { fontFamily: font.display, fontSize: 58, lineHeight: 62, letterSpacing: -2.6, color: colors.text },
  tag: { fontFamily: font.body, fontSize: 16.5, color: colors.dim, marginTop: 6 },
});
