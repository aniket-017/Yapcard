import type { ReactNode } from 'react';
import { CONTACT_EMAIL } from '../config';
import { DocPage, Section } from '../components/DocPage';

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'How do I export a WhatsApp chat on Android?',
    a: 'Open the group in WhatsApp, tap ⋮, then More, then Export chat. Choose "Without media", then pick Yapcard from the share list, or save the file and use Import a chat export in the app.',
  },
  {
    q: 'How do I export a WhatsApp chat on iPhone?',
    a: 'Open the group in WhatsApp, tap the group name, then Export Chat. Choose "Without Media", then pick Yapcard, or choose "Save to Files" and import it from the app.',
  },
  {
    q: 'Can I use a Telegram chat?',
    a: 'Yes. In Telegram Desktop, open the chat, choose Export chat history, pick the JSON format, then import the result.json file in Yapcard.',
  },
  {
    q: 'Yapcard says it couldn\'t find any messages.',
    a: 'Make sure you picked the .txt or .zip file that WhatsApp\'s Export chat creates, not a screenshot or a backup file. Exporting "Without media" gives the smallest file.',
  },
  {
    q: 'It says my chat is too short.',
    a: 'A recap needs at least 20 messages from at least two people. Try a busier group or a longer time period.',
  },
  {
    q: 'Yapcard doesn\'t appear in WhatsApp\'s share list.',
    a: 'Update to the latest version of Yapcard and restart your phone. If it still doesn\'t show, save the export to your phone and use Import a chat export instead.',
  },
  {
    q: 'The AI roasts didn\'t show up.',
    a: 'AI roasts need an internet connection, and each network can make a limited number of AI recaps per hour. If they can\'t be fetched, Yapcard uses its built-in roasts. Try again a little later.',
  },
  {
    q: 'Is my chat uploaded?',
    a: (
      <>
        Not unless you choose to. The file is read on your phone. It is only sent to us if you switch on "Save a copy on our server" on the
        setup screen, which is off by default; saved files are deleted within 30 days. If AI roasts are switched on, only stats and a short
        sample with names, numbers and links removed are sent, and that is not stored. See the <a href="/privacy">Privacy Policy</a> for
        details.
      </>
    ),
  },
  {
    q: 'How do I delete my data?',
    a: (
      <>
        If you saved a copy of a chat on our server, it is deleted automatically within 30 days; email {CONTACT_EMAIL} with the date and
        approximate time you saved it to have it deleted sooner. Otherwise we keep nothing. Close or uninstall the app to clear it from your
        phone. <a href="/privacy#delete">More about data deletion</a>.
      </>
    ),
  },
  {
    q: 'A roast was offensive.',
    a: `Sorry about that. Tap re-roll for a new line, and email us at ${CONTACT_EMAIL} with the roast level and what it said so we can tighten the filters.`,
  },
];

export function Support() {
  return (
    <DocPage
      title="Support"
      updated={false}
      intro="Stuck on an export, found a bug or have an idea? Check the answers below or write to us."
    >
      <div className="doc-summary">
        <h2>Contact us</h2>
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}?subject=Yapcard%20support`}>{CONTACT_EMAIL}</a>. Tell us your phone model, whether it's Android
          or iPhone, and what happened. Please don't attach your chat export. We usually reply within two working days.
        </p>
      </div>

      <Section title="Common questions">
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="panel faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </DocPage>
  );
}
