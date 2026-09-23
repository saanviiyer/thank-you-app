# thank you

thank you is a warm, feed-first social app for sharing everyday kindness and sending thanks.

This repo is the web client. The sibling repo [thank-you-ios](https://github.com/saanviiyer/thank-you-ios) is the native SwiftUI client. Both are deployment targets for one product.

## Features

The web app is local-first. All data stays in the browser and persists across reloads.

- Account creation and sign-in, with PBKDF2-protected passwords
- Editable profiles
- Stories, comments and compressed photos
- Thanks, follows and activity, kept separate for each account
- Feed filters and discovery
- Sharing through the Web Share API when the browser supports it, with the clipboard as a fallback

The core loop has no fake buttons and no "coming soon" actions.

The v2 store migrates the original v1 feed automatically. It gives the old local interactions to the first account that you activate after the upgrade. When you delete an account, the app removes the stories, replies, reactions and follow references of that user.

## Limits

All data is local to the browser on purpose. A public multi-device launch still needs these services:

- Hosted authentication
- Database and object storage
- Moderation and reporting
- Password recovery and email verification
- Notifications

## Run it

```bash
git clone https://github.com/saanviiyer/thank-you-app
cd thank-you-app
npm install
npm run dev       # Vite dev server
npm run build     # type-check and build to dist/
npm run preview   # serve the built app
npm test          # Vitest unit tests
npm run lint      # tsc --noEmit
```

## Environment variables

None. The app needs no keys or configuration.

## Deploy

The app is a static SPA. Import the repo into Vercel or Netlify. The included config files (`vercel.json`, `netlify.toml`) build `dist/` and keep client-side routing. Both configs set these headers: CSP, anti-framing, permissions policy, referrer policy, MIME sniffing protection and immutable asset caching. Account operations use Web Crypto, which needs HTTPS or localhost. Both hosts give HTTPS.

## Layout

```
index.html               entry page
src/
  main.tsx, App.tsx      React app
  auth.ts                accounts, sign-in and profiles (+ auth.test.ts)
  domain.ts              stories, categories and store logic (+ domain.test.ts)
  media.ts               image checks and compression (+ media.test.ts)
  index.css              styles
vercel.json, netlify.toml   deploy config
```
