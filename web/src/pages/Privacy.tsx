import { CONTACT_EMAIL, DEVELOPER_NAME, SITE_URL } from '../config';
import { DocPage, Section } from '../components/DocPage';

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export function Privacy() {
  return (
    <DocPage
      title="Privacy Policy"
      intro={
        <>
          This policy explains how the Yapcard app for Android and iPhone, and the website at {SITE_URL.replace('https://', '')}, handle your
          information. Yapcard is made by {DEVELOPER_NAME} ("we", "us").
        </>
      }
    >
      <div className="doc-summary">
        <h2>The short version</h2>
        <ul>
          <li>Your chat export is read on your phone. We never receive or store the file.</li>
          <li>There are no accounts, no ads, no analytics and no tracking.</li>
          <li>
            If AI roasts are switched on, a short sample of messages, with names, phone numbers, emails and links removed, is sent to our server
            and to Google's Gemini API to write the roasts. Nothing is kept afterwards.
          </li>
        </ul>
      </div>

      <Section title="1. What the app reads on your phone">
        <p>
          When you import a WhatsApp or Telegram chat export, or share one to Yapcard, the app reads the file on your device to count messages,
          work out stats and pick a title for each member. The chat, the names in it and your recap are held in the app's memory and are cleared
          when you close the app. Yapcard does not save your chat.
        </p>
        <p>
          Yapcard only opens the file you pick or share to it. It does not access your contacts, photos, camera, microphone, location or any
          other files.
        </p>
      </Section>

      <Section title="2. AI-written roasts (optional)">
        <p>
          The setup screen has an <b>AI-written roasts</b> switch. It is on by default and you can turn it off before every recap. Only while it
          is on, the app sends the following to our server over an encrypted (HTTPS) connection:
        </p>
        <ul>
          <li>group stats such as the number of members and messages, the busiest hour, top emojis and top words;</li>
          <li>each member's title and stats, such as share of messages and typical reply time;</li>
          <li>about 120 sample messages, each cut to 160 characters.</li>
        </ul>
        <p>
          Before anything leaves your phone, the app replaces every member's name with a code (P1, P2 and so on) and removes phone numbers, email
          addresses and links. The real names are put back on your phone when the roasts come back.
        </p>
        <p>
          Our server forwards this anonymised data to Google's Gemini API, which writes the roasts and returns them. We do not store the request or
          the reply, and our server never logs message content. Google processes the data under the{' '}
          <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Gemini API Terms</a>.
        </p>
        <p>
          Sample messages can still contain other details people typed, such as place names. If you want nothing to leave your phone, turn the
          switch off. The app then uses its built-in roast lines.
        </p>
      </Section>

      <Section title="3. Technical information">
        <p>
          To prevent abuse, our server keeps the IP address of each AI roast request in memory for up to one hour so it can limit how many
          requests one network makes. It is not written to disk or used for anything else.
        </p>
        <p>
          Like any website, our hosting provider may keep standard server logs (IP address, time and page requested) for security and
          troubleshooting. These are kept only for a limited time and are never combined with chat data.
        </p>
        <p>The website does not use cookies, analytics or third-party trackers. Fonts are served from our own server.</p>
      </Section>

      <Section title="4. Sharing your cards">
        <p>
          When you share a slide or card, the app makes an image on your phone and opens your phone's share menu. Once you send it to another app,
          such as WhatsApp or Instagram, that app's privacy policy applies. Every image shows the Yapcard name and website.
        </p>
      </Section>

      <Section title="5. What we don't do">
        <ul>
          <li>We don't sell, rent or trade your data.</li>
          <li>We don't show ads or use advertising IDs.</li>
          <li>We don't track you across other apps or websites.</li>
          <li>We don't use analytics or crash-reporting services.</li>
          <li>We don't ask you to create an account.</li>
        </ul>
      </Section>

      <Section title="6. Other people in your chat">
        <p>
          A chat export contains messages from everyone in the group. Only import chats you are part of, and think about your friends before you
          post their cards publicly.
        </p>
      </Section>

      <Section title="7. Children">
        <p>
          Yapcard is not meant for children under 13, or the minimum age for digital services where you live if that is higher. We do not knowingly
          collect personal information from children. If you think a child has sent us information, contact us and we will delete it.
        </p>
      </Section>

      <Section id="delete" title="8. Keeping and deleting your data">
        <p>
          We don't keep your chat, your recap or any AI roast data, so there is nothing stored with us to delete. To remove everything from your
          phone, close or uninstall the app, and delete the chat export from your phone's storage if you saved it there.
        </p>
        <p>
          If you have a question about data we may hold, such as an email you sent us, write to <Mail /> and we will reply within 30 days.
        </p>
      </Section>

      <Section title="9. Your rights">
        <p>
          Depending on where you live, laws such as India's Digital Personal Data Protection Act, the EU and UK GDPR, or California's CCPA give
          you the right to ask what personal data we hold about you, and to have it corrected or deleted. Because Yapcard stores no personal data,
          we usually have nothing to return, but you can always ask at <Mail />.
        </p>
      </Section>

      <Section title="10. Security">
        <p>
          All traffic between the app, the website and our server is encrypted with HTTPS. Data that reaches our server is handled in memory only
          and discarded once the reply is sent.
        </p>
      </Section>

      <Section title="11. Changes to this policy">
        <p>
          If we change how Yapcard handles data, we will update this page and the date at the top. Significant changes will also be announced in
          the app's release notes.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          {DEVELOPER_NAME}
          <br />
          Email: <Mail />
        </p>
      </Section>
    </DocPage>
  );
}
