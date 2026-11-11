import type { Msg, ParsedChat } from '../types';

// A made-up chat so people can see the recap before exporting their own.
type P = { name: string; weight: number; night: number; lines: string[]; media: number };

const PEOPLE: P[] = [
  { name: 'Aarav', weight: 34, night: 0.1, media: 0.05, lines: ['guys listen', 'ok so', 'you will not believe what happened', 'wait', 'I have news', 'hello??', 'anyone alive?', 'plan for saturday?', 'who is coming', 'reply fast'] },
  { name: 'Meera', weight: 22, night: 0.05, media: 0.3, lines: ['😂😂😂', 'hahaha stop', 'look at this 😭', 'I can’t 💀', 'lol', 'this is so us 😂', 'sending the pics now'] },
  { name: 'Kabir', weight: 16, night: 0.7, media: 0.05, lines: ['anyone up?', 'can’t sleep', 'just watched the whole season', 'why is nobody awake', 'ok new theory about the ending', 'who wants food rn'] },
  { name: 'Zoya', weight: 12, night: 0.05, media: 0.02, lines: ['Honestly I think we should plan this properly because last time nobody confirmed until the final hour and then half of us showed up late and the table was gone', 'Let me explain why that restaurant is a bad idea, starting with the parking situation and ending with the fact that the menu has not changed since 2019', 'I made a full list of options with prices and timings, please read it before replying with just ok'] },
  { name: 'Dev', weight: 10, night: 0.1, media: 0.02, lines: ['k', 'ok', 'fine', 'hmm', 'sure', 'where?', 'when?', 'why?', 'who all?'] },
  { name: 'Riya', weight: 3, night: 0.1, media: 0.1, lines: ['just saw this', 'sorry was busy', 'what did I miss', 'in'] },
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function demoChat(): ParsedChat {
  const rand = rng(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 3).getTime();
  const end = Math.min(Date.now(), new Date(year, 11, 28).getTime());
  const days = Math.max(30, Math.floor((end - start) / 86400000));
  const totalW = PEOPLE.reduce((s, p) => s + p.weight, 0);
  const messages: Msg[] = [];
  const bigDay = Math.floor(days * 0.6);

  for (let d = 0; d < days; d++) {
    if (d > days * 0.3 && d < days * 0.3 + 9) continue; // the great silence
    const n = d === bigDay ? 140 : Math.floor(rand() * 26);
    let last = '';
    for (let i = 0; i < n; i++) {
      let r = rand() * totalW;
      let p = PEOPLE[0];
      for (const q of PEOPLE) {
        r -= q.weight;
        if (r <= 0) { p = q; break; }
      }
      if (p.name === 'Riya' && d % 23 !== 0) continue;
      const night = rand() < p.night;
      const hour = night ? Math.floor(rand() * 4) : 9 + Math.floor(rand() * 14);
      const ts = start + d * 86400000 + hour * 3600000 + Math.floor(rand() * 3600000);
      const isMedia = rand() < p.media;
      const text = isMedia ? '<Media omitted>' : pick(p.lines);
      messages.push({ ts, author: p.name, text, kind: isMedia ? 'media' : 'text' });
      // Aarav double and triple texts.
      if (p.name === 'Aarav' && p.name !== last && rand() < 0.5) {
        for (let k = 1; k <= 3; k++) messages.push({ ts: ts + k * 20000, author: p.name, text: pick(p.lines), kind: 'text' });
      }
      last = p.name;
    }
  }
  messages.sort((a, b) => a.ts - b.ts);
  return { title: 'Weekend Plans (never happen)', source: 'whatsapp', messages };
}
