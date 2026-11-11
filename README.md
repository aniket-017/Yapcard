# Yapcard — your group chat, wrapped

Import a WhatsApp (or Telegram) chat export and get a tap-through recap plus a title card for every member, ready to share to WhatsApp status and Instagram Stories.

Built with Expo SDK 58 (React Native 0.88, TypeScript). One codebase for Android and iOS.

## Run it on your phone (5 minutes)

```bash
npm install
npx expo start
```

Install **Expo Go** on your phone, scan the QR code, then tap **See a demo first** or import a real export.

To get a chat file: WhatsApp → open the group → ⋮ → More → **Export chat** → **Without media** → save the file → **Import a chat export** in the app.

## What's in the app

| Feature | Why it helps the app spread |
| --- | --- |
| Story-style recap (tap to advance) | Familiar "Wrapped" format people already share |
| "Guess who" questions before each reveal | Makes people pass the phone around |
| A title card per member, hidden until tapped | Every member wants to see, and post, their own |
| Group poster with everyone's title | The image that gets posted back into the group |
| Share any slide or card as a 9:16 image | Fits Stories and WhatsApp status; every image carries the app's name and link |
| Roast level: Friendly / Spicy / Savage | Re-rolls give more to share |
| Demo chat | People see the result before exporting anything |
| Chat is read on the phone | Answers the first objection: "is this safe?" |

## AI roasts (optional)

Without a server the app uses its built-in roast lines and nothing leaves the phone. To switch on Gemini-written roasts:

```bash
cd server
copy .env.example .env      # then put your GEMINI_API_KEY in .env
npm run dev                 # starts on http://localhost:8787
```

Then in the project root create `.env` with your laptop's Wi-Fi address (phone and laptop on the same Wi-Fi):

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:8787
```

Restart `npx expo start`. An **AI-written roasts** switch appears on the setup screen.

What is sent: the stats and about 120 sample messages, with names replaced by P1, P2…, and phone numbers, emails and links removed. Names are put back on the phone. The server stores nothing.

To host the server, deploy the `server` folder to any Node 20+ host (Render, Railway, a VPS), set `GEMINI_API_KEY` there, and put its https address in `EXPO_PUBLIC_API_URL` before building the app.

## Build installable apps

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview     # gives you an .apk to install and share
eas build -p ios --profile production      # needs an Apple Developer account ($99/year); builds in the cloud, no Mac needed
```

In an installed build (not Expo Go), Yapcard also appears in WhatsApp's share sheet, so **Export chat → Yapcard** opens the recap directly.

## Before you publish

- `src/theme.ts`: `SHARE_LINK` is printed on every shared image. Point it at your real site or store link.
- `app.json`: change `com.yapcard.app` (Android package and iOS bundle identifier) to an ID you own.
- Check that the name "Yapcard" is free on the Play Store and App Store.

## Project map

```
App.tsx                  screen flow: home → setup → story → cards
src/lib/parseChat.ts     WhatsApp (.txt/.zip, Android + iOS formats) and Telegram JSON parsing
src/lib/stats.ts         all the numbers
src/lib/awards.ts        the 18 titles, who gets which, built-in roasts
src/lib/ai.ts            anonymises and calls the roast server
src/screens/             Home, Setup, Story, Cards
src/components/          cards, poster, buttons
server/index.mjs         Gemini roast endpoint (no dependencies)
tests/parse.test.ts      npm test
```
