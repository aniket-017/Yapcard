import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAny, parseWhatsApp, titleFromFileName } from '../src/lib/parseChat';
import { availablePeriods, computeStats, emojisIn } from '../src/lib/stats';
import { assignAwards, localVibe, reRoast } from '../src/lib/awards';
import { demoChat } from '../src/lib/demoChat';
import { buildAiPayload } from '../src/lib/ai';

const ANDROID_US = `12/30/23, 9:15 PM - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
12/30/23, 9:15 PM - Priya created group "Goa Trip"
12/30/23, 9:16 PM - Priya: Hello everyone 😂
12/30/23, 9:17 PM - Rahul Sharma: Hi! When are we leaving?
second line of the same message
12/31/23, 12:05 AM - +91 98765 43210: <Media omitted>
12/31/23, 12:06 AM - Priya: This message was deleted
1/1/24, 10:00 AM - Rahul Sharma: Happy new year: party at 8 <This message was edited>
`;

const ANDROID_24H = `31/12/2023, 21:15 - Ana: Hola
31/12/2023, 21:16 - Ben: Hey
01/01/2024, 00:01 - Ana: Feliz año
`;

const IOS = `‎[31/12/23, 9:15:03 PM] Goa Trip: ‎Messages and calls are end-to-end encrypted.
[31/12/23, 9:16:10 PM] Priya: Hello
‎[31/12/23, 9:17:00 PM] ~ Rahul: ‎image omitted
[31/12/23, 9:18:00 PM] Rahul: ok
‎[31/12/23, 9:19:00 PM] Priya: ‎<attached: 00000012-PHOTO.jpg>
`;

const GERMAN = `[31.12.23, 21:15:03] Jan: Hallo
[01.01.24, 00:10:00] Eva: Frohes Neues
`;

const AMBIGUOUS_MDY = `1/5/24, 9:00 AM - A: one
1/6/24, 9:00 AM - B: two
2/1/24, 9:00 AM - A: three
2/2/24, 9:00 AM - B: four
`;

test('android US export: authors, multiline, media, deleted, system lines skipped', () => {
  const c = parseWhatsApp(ANDROID_US, 'WhatsApp Chat with Goa Trip.txt');
  assert.equal(c.title, 'Goa Trip');
  assert.equal(c.messages.length, 5);
  assert.deepEqual(c.messages.map((m) => m.author), ['Priya', 'Rahul Sharma', '+91 98765 43210', 'Priya', 'Rahul Sharma']);
  assert.match(c.messages[1].text, /second line/);
  assert.equal(c.messages[2].kind, 'media');
  assert.equal(c.messages[3].kind, 'deleted');
  assert.equal(c.messages[4].text, 'Happy new year: party at 8');
  const d = new Date(c.messages[0].ts);
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [2023, 11, 30, 21, 16]);
  assert.equal(new Date(c.messages[2].ts).getHours(), 0);
});

test('android 24h day-first export', () => {
  const c = parseWhatsApp(ANDROID_24H);
  assert.equal(c.messages.length, 3);
  const d = new Date(c.messages[2].ts);
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate()], [2024, 0, 1]);
});

test('iOS export: brackets, seconds, narrow spaces, system notice dropped', () => {
  const c = parseWhatsApp(IOS, '_chat.txt');
  assert.equal(c.title, 'Your group chat');
  assert.deepEqual(c.messages.map((m) => m.author), ['Priya', 'Rahul', 'Rahul', 'Priya']);
  assert.deepEqual(c.messages.map((m) => m.kind), ['text', 'media', 'text', 'media']);
  assert.equal(new Date(c.messages[0].ts).getHours(), 21);
});

test('german dotted dates', () => {
  const c = parseWhatsApp(GERMAN);
  assert.equal(c.messages.length, 2);
  assert.equal(new Date(c.messages[1].ts).getMonth(), 0);
});

test('ambiguous dates pick the order that keeps time moving forward', () => {
  const c = parseWhatsApp(AMBIGUOUS_MDY);
  assert.equal(new Date(c.messages[1].ts).getMonth(), 0); // January 6, not 1 June
  assert.equal(new Date(c.messages[3].ts).getMonth(), 1);
});

test('telegram json', () => {
  const json = JSON.stringify({
    name: 'TG Group',
    messages: [
      { type: 'service', date: '2024-01-01T10:00:00' },
      { type: 'message', date: '2024-01-01T10:00:00', date_unixtime: '1704103200', from: 'Ann', text: 'hi' },
      { type: 'message', date: '2024-01-01T10:01:00', date_unixtime: '1704103260', from: 'Bob', text: ['see ', { type: 'link', text: 'https://x.com' }] },
      { type: 'message', date: '2024-01-01T10:02:00', date_unixtime: '1704103320', from: 'Bob', text: '', photo: 'p.jpg' },
    ],
  });
  const c = parseAny(json, 'result.json');
  assert.equal(c.source, 'telegram');
  assert.equal(c.title, 'TG Group');
  assert.equal(c.messages.length, 3);
  assert.equal(c.messages[1].text, 'see https://x.com');
  assert.equal(c.messages[2].kind, 'media');
});

test('file name titles', () => {
  assert.equal(titleFromFileName('WhatsApp Chat - College Gang.zip'), 'College Gang');
  assert.equal(titleFromFileName('_chat.txt'), null);
});

test('emoji extraction keeps joined emoji together', () => {
  assert.deepEqual(emojisIn('hi 😂😂 ok 👍🏽'), ['😂', '😂', '👍🏽']);
});

test('stats add up on the demo chat', () => {
  const chat = demoChat();
  const g = computeStats(chat)!;
  assert.ok(g.totalMessages > 1000);
  assert.equal(g.members.reduce((s, m) => s + m.messages, 0), g.totalMessages);
  assert.equal(g.hours.reduce((s, n) => s + n, 0), g.totalMessages);
  assert.ok(Math.abs(g.members.reduce((s, m) => s + m.share, 0) - 1) < 1e-9);
  assert.equal(g.members[0].name, 'Aarav');
  assert.ok(g.longestSilenceDays >= 8);
  assert.ok(g.busiestDay && g.busiestDay.count >= 100);
  assert.ok(g.duo);
});

test('awards: one per member, unique, and they fit the personalities', () => {
  const g = computeStats(demoChat())!;
  const cards = assignAwards(g, 'spicy');
  assert.equal(cards.length, g.memberCount);
  const real = cards.filter((c) => !['lurker', 'steady'].includes(c.awardId)).map((c) => c.awardId);
  assert.equal(new Set(real).size, real.length);
  const of = (n: string) => cards.find((c) => c.name === n)!.awardId;
  assert.equal(of('Kabir'), 'nightowl');
  assert.equal(of('Zoya'), 'essay');
  assert.equal(of('Dev'), 'oneword');
  assert.equal(of('Riya'), 'ghost');
  console.log(cards.map((c) => `${c.name}: ${c.title} — ${c.statLine}`).join('\n'));
  console.log(localVibe(g));
  const savage = reRoast(cards, 'savage');
  assert.notEqual(savage[0].roast, cards[0].roast);
});

test('periods: this-year option appears only for multi-year chats', () => {
  const chat = demoChat();
  assert.equal(availablePeriods(chat).length, 1);
  const old = { ...chat, messages: [{ ts: new Date(2020, 0, 1).getTime(), author: 'A', text: 'x', kind: 'text' as const }, ...chat.messages] };
  const ps = availablePeriods(old);
  assert.equal(ps.length, 2);
  assert.equal(computeStats(old, ps[0])!.totalMessages, chat.messages.length);
});

test('AI payload contains no real names, numbers or links', () => {
  const chat = parseWhatsApp(
    Array.from({ length: 40 }, (_, i) =>
      `12/30/23, 9:${String(10 + i).padStart(2, '0')} PM - ${i % 2 ? 'Rahul Sharma' : 'Priya'}: hey ${i % 2 ? 'Priya' : 'Rahul'} call me on +91 98765 43210 or mail a@b.com see https://x.com/abc`
    ).join('\n')
  );
  const g = computeStats(chat)!;
  const cards = assignAwards(g, 'spicy');
  const { payload, names } = buildAiPayload(chat, g, cards, 'spicy');
  const s = JSON.stringify(payload);
  assert.ok(!/Rahul|Priya|Sharma/.test(s), 'names leaked');
  assert.ok(!/98765|a@b\.com|x\.com/.test(s), 'contact details leaked');
  assert.equal(Object.keys(names).length, 2);
  assert.ok(payload.sample.length > 0 && payload.sample.length <= 120);
});
