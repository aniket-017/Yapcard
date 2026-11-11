import type { CSSProperties } from 'react';
import { APP_STORE_URL, PLAY_STORE_URL } from './config';
import { ExampleCard, type Example } from './components/ExampleCard';
import { SiteFooter } from './components/SiteFooter';
import { StoreButton } from './components/StoreButton';

const EXAMPLES: Example[] = [
  { name: 'Kabir', title: 'The 2 a.m. Menace', emoji: '🦉', bg: '#5B4BD6', fg: '#FFF6E6', statLine: '448 messages after midnight', roast: 'Your best ideas arrive at 2 a.m. So do your worst.', messages: '650', share: '13%', rank: 3 },
  { name: 'Aarav', title: 'The Chief Yapper', emoji: '🗣️', bg: '#FF5FA2', fg: '#1B1535', statLine: '53% of every message sent', roast: 'Has a thought. Sends it. Has another. Sends that too.', messages: '2,753', share: '53%', rank: 1 },
  { name: 'Riya', title: 'The Ghost', emoji: '👻', bg: '#FFB627', fg: '#1B1535', statLine: 'Vanished for 69 days straight', roast: 'Reads everything. Replies to nothing. We see you.', messages: '21', share: '1%', rank: 6 },
];

const STEPS = [
  { title: 'Export your chat', text: 'In WhatsApp, open the group, tap Export chat and pick "Without media". Telegram JSON works too.' },
  { title: 'Open it in Yapcard', text: 'Share the file straight to Yapcard, or import it from the app. Your recap is ready in seconds.' },
  { title: 'Post the receipts', text: 'Tap through the story, reveal everyone\'s title and share the cards to Stories and WhatsApp status.' },
];

const FEATURES = [
  { emoji: '📖', color: 'var(--lilac)', title: 'Story-style recap', text: 'Tap through your group\'s year: total messages, busiest hour, top emojis, the longest silence.' },
  { emoji: '🤔', color: 'var(--sky)', title: '"Guess who" rounds', text: 'Every reveal starts with a question, so the phone gets passed around the room.' },
  { emoji: '🏷️', color: 'var(--pink)', title: 'A title for everyone', text: 'The Chief Yapper, The Ghost, The 2 a.m. Menace and 15 more, each backed by real numbers.' },
  { emoji: '🖼️', color: 'var(--mango)', title: 'Group poster', text: 'Everyone\'s title on one image, made to be posted right back into the chat.' },
  { emoji: '🌶️', color: 'var(--coral)', title: 'Pick the heat', text: 'Friendly, Spicy or Savage roasts. Re-roll until it lands.' },
  { emoji: '📱', color: 'var(--mint)', title: 'Made for Stories', text: 'Every slide and card shares as a 9:16 image that fits WhatsApp status and Instagram.' },
];

function StoreButtons() {
  return (
    <div className="stores">
      <StoreButton store="play" href={PLAY_STORE_URL} />
      <StoreButton store="apple" href={APP_STORE_URL} />
    </div>
  );
}

export function App() {
  return (
    <>
      <header className="nav wrap">
        <span className="logo">yapcard</span>
        <a className="nav-link" href="#download">Download</a>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="pill">Your group chat, wrapped</span>
            <h1>Find out who your group chat really is.</h1>
            <p className="lead">Import a WhatsApp or Telegram chat. Everyone gets a title, a roast and a card to post.</p>
            <StoreButtons />
            <p className="fine">Free on Android and iPhone. Your chat file never leaves your phone.</p>
          </div>
          <div className="fan" aria-label="Example cards: The 2 a.m. Menace, The Chief Yapper, The Ghost">
            {EXAMPLES.map((c, i) => (
              <ExampleCard key={c.name} card={c} style={{ '--rot': `${(i - 1) * 9}deg`, '--lift': i === 1 ? '0px' : '28px', zIndex: i === 1 ? 2 : 1 } as CSSProperties} />
            ))}
          </div>
        </section>

        <section className="section wrap">
          <h2>Three taps to your recap</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="panel step">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section wrap">
          <h2>Built to be shared</h2>
          <div className="features">
            {FEATURES.map((f) => (
              <article key={f.title} className="panel feature">
                <span className="feature-icon" style={{ background: f.color }} aria-hidden="true">{f.emoji}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section wrap">
          <div className="privacy">
            <span className="privacy-icon" aria-hidden="true">🔒</span>
            <div>
              <h2>Your chat stays on your phone</h2>
              <p>Yapcard reads the export on your device. The file is only uploaded if you choose to save a copy on our server, and saved copies are deleted within 30 days. If you switch on AI roasts, only stats and a short sample are sent, with names, numbers and links removed first. <a href="/privacy">Read the privacy policy</a>.</p>
            </div>
          </div>
        </section>

        <section id="download" className="section wrap">
          <div className="cta">
            <h2>Your group chat deserves a recap.</h2>
            <p>Get Yapcard and find out who the Chief Yapper really is.</p>
            <StoreButtons />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
