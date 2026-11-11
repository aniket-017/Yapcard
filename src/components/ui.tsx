import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, fmt, font, SHARE_LINK } from '../theme';

type Kind = 'primary' | 'outline' | 'ink';

/** primary = the one main action on a screen; outline = secondary; ink = on bright slides. */
export function Button({
  label, onPress, kind = 'primary', style, disabled,
}: { label: string; onPress: () => void; kind?: Kind; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.btn,
        kind === 'primary' && s.btnPrimary,
        kind === 'outline' && s.btnOutline,
        kind === 'ink' && s.btnInk,
        pressed && { transform: [{ translateY: 2 }], borderBottomWidth: kind === 'outline' ? 2 : 2 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[s.btnText, kind !== 'primary' && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Chips<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.chip, on && s.chipOn]}
          >
            <Text style={[s.chipText, on && s.chipTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Number that counts up when it appears. */
export function CountUp({ to, style, duration = 1100 }: { to: number; style?: StyleProp<TextStyle>; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to, duration]);
  return <Text style={style}>{fmt(n)}</Text>;
}

/** Fades and lifts its children in; `delay` staggers a sequence. */
export function Rise({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** An emoji on a white die-cut circle, slightly tilted, like a sticker slapped on. */
export function Sticker({ emoji, size, tilt = -8, bg = colors.white }: { emoji: string; size: number; tilt?: number; bg?: string }) {
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
        alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${tilt}deg` }],
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: size * 0.08, shadowOffset: { width: 0, height: size * 0.04 }, elevation: 4,
      }}
    >
      <Text style={{ fontSize: size * 0.56, lineHeight: size * 0.7 }}>{emoji}</Text>
    </View>
  );
}

/** The line on every shared image that brings new people to the app. */
export function Watermark({ color = colors.text, scale = 1 }: { color?: string; scale?: number }) {
  return (
    <View style={s.wm}>
      <Text style={{ fontFamily: font.display, fontSize: 18 * scale, letterSpacing: -0.5 * scale, color }}>yapcard</Text>
      <Text style={{ fontFamily: font.bold, fontSize: 11 * scale, color, opacity: 0.8 }}>Wrap your group chat at {SHARE_LINK}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 56, borderRadius: 18, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  // The darker bottom edge makes the main button look pressable.
  btnPrimary: { backgroundColor: colors.mango, borderBottomWidth: 5, borderBottomColor: '#C98A00' },
  btnOutline: { borderWidth: 2, borderColor: colors.faint },
  btnInk: { backgroundColor: colors.ink },
  btnText: { fontFamily: font.display, fontSize: 18, letterSpacing: -0.3, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, minHeight: 44, borderRadius: 14, backgroundColor: colors.panel2, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.text },
  chipText: { color: colors.dim, fontFamily: font.bold, fontSize: 15 },
  chipTextOn: { color: colors.ink },
  wm: { alignItems: 'center', gap: 1 },
});
