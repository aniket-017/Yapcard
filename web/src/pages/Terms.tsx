import { CONTACT_EMAIL, DEVELOPER_NAME } from '../config';
import { DocPage, Section } from '../components/DocPage';

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function Terms() {
  return (
    <DocPage
      title="Terms of Use"
      intro={
        <>
          These terms apply to the Yapcard app and website, made by {DEVELOPER_NAME} ("we", "us"). By using Yapcard you agree to them. If you
          don't agree, please don't use the app.
        </>
      }
    >
      <Section title="1. Using Yapcard">
        <p>
          Yapcard is free for personal, non-commercial use. You must be at least 13 years old, or the minimum age for digital services where you
          live if that is higher.
        </p>
      </Section>

      <Section title="2. Your chats and what you share">
        <p>
          Only import chats you are a member of. You are responsible for the cards and recaps you share and where you share them. Don't use
          Yapcard to bully, harass, embarrass or expose anyone, or to share private information about people who haven't agreed to it.
        </p>
        <p>
          If you switch on "Save a copy on our server", you confirm you are a member of that chat and comfortable sharing its contents with us.
          How we store and delete saved files is described in the <a href="/privacy">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="3. Roasts are jokes">
        <p>
          Titles, stats and roasts are created automatically from the chat, partly by AI. They are meant as light-hearted fun, not statements of
          fact, and they can be wrong. We instruct the AI to avoid sensitive topics such as looks, religion, health and relationships, but we can't
          guarantee every line. If a roast is offensive, re-roll it and tell us at <Mail /> so we can improve the filters.
        </p>
      </Section>

      <Section title="4. Not affiliated">
        <p>
          Yapcard is an independent app. It is not made, endorsed or sponsored by WhatsApp, Meta, Telegram or Instagram. Their names are used only
          to describe which chat exports Yapcard can read.
        </p>
      </Section>

      <Section title="5. Our app">
        <p>
          The app, its design, artwork and code belong to us. You may freely share the images Yapcard makes for you. Don't copy, resell, reverse
          engineer or misuse the app or our server, for example by sending automated requests.
        </p>
      </Section>

      <Section title="6. No warranty">
        <p>
          Yapcard is provided "as is". We work to keep it running and accurate, but we don't promise it will always be available, error-free or
          able to read every chat export. AI roasts depend on third-party services and may be unavailable at times.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          To the extent the law allows, we are not liable for any indirect or consequential loss, or for how you or others use the images Yapcard
          creates. Nothing in these terms limits rights you have under consumer law that can't be excluded.
        </p>
      </Section>

      <Section title="8. App stores">
        <p>
          If you downloaded Yapcard from the Apple App Store, Apple's{' '}
          <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer">
            Standard End User License Agreement
          </a>{' '}
          also applies. Apple and Google are not responsible for the app or for supporting it; we are.
        </p>
      </Section>

      <Section title="9. Changes">
        <p>
          We may update these terms when the app changes. We will post the new version here with a new date. If you keep using Yapcard after that,
          the new terms apply.
        </p>
      </Section>

      <Section title="10. Governing law">
        <p>These terms are governed by the laws of India, without affecting any mandatory consumer protections in the country where you live.</p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these terms: <Mail />
        </p>
      </Section>
    </DocPage>
  );
}
