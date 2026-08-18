# thank you

A warm, feed-first social app for sharing everyday kindness and sending thanks.

This is the web client of the **thank you** product. The sibling
`thank-you-ios/` directory is its native SwiftUI client; they are two deployment
targets for one product, not separate startup concepts.

## Run locally

```bash
npm install
npm run dev
```

Build with `npm run build`.

## Product functionality

The web app is a complete local-first product: PBKDF2-protected account creation
and sign-in, editable profiles, stories, account-isolated thanks/follows/activity,
comments, compressed photos, feed filters, discovery, and profile data persist
across reloads in the browser. Sharing uses the native Web
Share API when available and falls back to the clipboard. No fake buttons or
"coming soon" interactions remain in the core loop.

The v2 store automatically migrates the original v1 feed and assigns its local
interactions to the first account activated after upgrade. Account deletion
removes that user's stories, replies, reactions, and follow references.

Data is intentionally browser-local. A public multi-device launch still requires
hosted authentication, database/object storage, moderation/reporting, password
recovery, email verification, and notification infrastructure.

## Deploy

The app is a static SPA. Import this directory into Vercel or Netlify; the
checked-in configuration builds `dist/` and preserves client-side routing.
Both configurations include CSP, anti-framing, permissions, referrer, MIME, and
immutable asset-cache headers. Web Crypto account operations require HTTPS or
localhost, which both supported hosts provide.
