import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ChatFile, ParsedChat, Recap, RoastLevel } from './src/types';
import { availablePeriods, computeStats, type Period } from './src/lib/stats';
import { assignAwards, localVibe, reRoast } from './src/lib/awards';
import { aiAvailable, fetchAiRoasts, uploadChatFile } from './src/lib/ai';
import { chatFromSharedUri, ImportError, pickChatFile } from './src/lib/importFile';
import { takeIncomingShare } from './src/lib/share';
import { demoChat } from './src/lib/demoChat';
import { colors } from './src/theme';
import { fontFiles } from './src/fonts';
import { HomeScreen } from './src/screens/HomeScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { StoryScreen } from './src/screens/StoryScreen';
import { CardsScreen } from './src/screens/CardsScreen';
import { AnimatedSplash } from './src/components/AnimatedSplash';

// Keep the static launch screen up until the fonts are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'home' | 'setup' | 'story' | 'cards';

const friendly = (e: unknown) =>
  e instanceof ImportError ? e.message : 'Couldn’t read that file. Pick the .txt or .zip from WhatsApp’s “Export chat”.';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [file, setFile] = useState<ChatFile | null>(null);
  const [saveCopy, setSaveCopy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodIdx, setPeriodIdx] = useState(0);
  const [level, setLevel] = useState<RoastLevel>('spicy');
  const [useAi, setUseAi] = useState(aiAvailable());
  const [recap, setRecap] = useState<Recap | null>(null);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roastRequest = useRef(0);
  const [fontsReady, fontError] = useFonts(fontFiles);
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);
  const ready = fontsReady || !!fontError;

  // Fonts are in: drop the static launch screen and let the animated one play.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  const load = useCallback((c: ParsedChat, f: ChatFile | null = null) => {
    const ps = availablePeriods(c);
    setChat(c);
    setFile(f);
    setSaveCopy(false);
    setPeriods(ps);
    setPeriodIdx(0);
    setRecap(null);
    setError(null);
    setScreen('setup');
  }, []);

  const importFile = async () => {
    setError(null);
    setBusy(true);
    try {
      const picked = await pickChatFile();
      if (picked) load(picked.chat, picked.file);
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  };

  // A chat exported from WhatsApp straight into the app via the share sheet.
  const checkShare = useCallback(async () => {
    const shared = await takeIncomingShare();
    if (!shared) return;
    setBusy(true);
    setScreen('home');
    try {
      const imported = await chatFromSharedUri(shared.uri, shared.name);
      load(imported.chat, imported.file);
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }, [load]);

  useEffect(() => {
    checkShare();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') checkShare();
    });
    return () => sub.remove();
  }, [checkShare]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'cards') setScreen('story');
      else if (screen === 'story') setScreen('setup');
      else if (screen === 'setup') setScreen('home');
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [screen]);

  const start = async () => {
    if (!chat) return;
    setWorking(true);
    // Let the spinner paint before the number crunching starts.
    await new Promise((r) => setTimeout(r, 50));
    const stats = computeStats(chat, periods[periodIdx]);
    if (!stats) {
      setWorking(false);
      setError('Not enough messages in that period.');
      setScreen('home');
      return;
    }
    let cards = assignAwards(stats, level);
    let vibe = localVibe(stats);
    if (saveCopy && file) {
      setSaving(true);
      await uploadChatFile(file);
      setSaving(false);
    }
    if (useAi && aiAvailable()) {
      const ai = await fetchAiRoasts(chat, stats, cards, level);
      if (ai) {
        cards = ai.cards;
        if (ai.vibe) vibe = ai.vibe;
      }
    }
    setRecap({ stats, cards, vibe, level });
    setWorking(false);
    setScreen('story');
  };

  const changeLevel = async (l: RoastLevel) => {
    if (!recap || !chat) return;
    setLevel(l);
    const base = reRoast(recap.cards, l);
    setRecap({ ...recap, cards: base, level: l });
    if (!(useAi && aiAvailable())) return;
    const id = ++roastRequest.current;
    setRefreshing(true);
    const ai = await fetchAiRoasts(chat, recap.stats, base, l);
    if (id !== roastRequest.current) return; // a newer tap won
    setRefreshing(false);
    if (ai) setRecap((r) => (r ? { ...r, cards: ai.cards, vibe: ai.vibe || r.vibe, level: l } : r));
  };

  // Hold a plain background until the typeface is in, so text never flashes in the system font.
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'home' && <HomeScreen onImport={importFile} onDemo={() => load(demoChat())} busy={busy} error={error} />}
      {screen === 'setup' && chat && (
        <SetupScreen
          chat={chat}
          periods={periods}
          periodIdx={periodIdx}
          onPeriod={setPeriodIdx}
          level={level}
          onLevel={setLevel}
          aiPossible={aiAvailable()}
          useAi={useAi}
          onUseAi={setUseAi}
          canSave={!!file && aiAvailable()}
          saveCopy={saveCopy}
          onSaveCopy={setSaveCopy}
          saving={saving}
          onStart={start}
          onBack={() => setScreen('home')}
          working={working}
        />
      )}
      {screen === 'story' && recap && <StoryScreen recap={recap} onDone={() => setScreen('cards')} onClose={() => setScreen('cards')} />}
      {screen === 'cards' && recap && (
        <CardsScreen recap={recap} onLevel={changeLevel} onReplay={() => setScreen('story')} onNew={() => setScreen('home')} refreshing={refreshing} />
      )}
      {intro && <AnimatedSplash onDone={endIntro} />}
    </SafeAreaProvider>
  );
}
