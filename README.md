# dowb-app

Production-ready TikTok downloader platform with:

- Next.js web PWA for Vercel or Firebase Hosting
- Flutter Android/iOS app
- Firebase Functions backend
- Firestore metrics, queue events, caching, rate limiting, and alerts
- Sequential bulk download queue with pause, resume, cancel, retry, history, and no ZIP generation
- Provided web favicon/logo and mobile logo wired into the PWA and Flutter app

## Web Deploy on Vercel

Set Vercel root directory to the repository root, not `apps/web`, so npm workspaces can install `packages/shared`.

```text
Framework Preset: Next.js
Build Command: npm run build:shared && npm run build:web
Output Directory: apps/web/out
Install Command: npm install
```

Required environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Backend

```bash
npm install
npm run build:shared
npm run build:functions
firebase deploy --only functions,firestore
```

## Mobile

```bash
cd apps/mobile
flutter pub get
flutter build appbundle --release --dart-define=API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
