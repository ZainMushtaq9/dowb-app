# dowb-app

Production-ready TikTok downloader platform with:

- Next.js web PWA optimized for Vercel
- Expo React Native Android/iOS app
- Firebase Functions backend
- Firestore metrics, queue events, caching, rate limiting, and alerts
- Sequential bulk download queue with pause, resume, cancel, retry, history, and no ZIP generation
- Centralized Firebase Remote Config + Firestore ad control for AdSense and AdMob
- Persistent SQLite mobile download queue recovery for app close, crash, reboot, and offline resume
- Provided web favicon/logo and mobile logo wired into the PWA and Expo app

## Web Deploy on Vercel

Set Vercel root directory to the repository root, not `apps/web`, so npm workspaces can install `packages/shared`.

```text
Framework Preset: Next.js
Build Command: npm run build:shared && npm run build:web
Output Directory: apps/web/.next
Install Command: npm install
```

Required environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Backend

```bash
npm install
npm run build:shared
npm run build:functions
firebase deploy --only functions,firestore
```

Ad units are not hardcoded in the web build. Configure `adminConfig/ads_config` in Firestore or matching Firebase Remote Config keys.

## Mobile

```bash
cd apps/mobile
npm install
npx expo start
eas build --platform android
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
