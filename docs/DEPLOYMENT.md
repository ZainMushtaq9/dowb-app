# Deployment

## Prerequisites

- Node.js 20.9+
- Firebase CLI
- Flutter 3.27+
- Android Studio/Xcode for mobile releases

## Install

```bash
npm install
npm run build
```

For Flutter:

```bash
cd apps/mobile
flutter pub get
```

## Firebase Setup

1. Copy `.firebaserc.example` to `.firebaserc`.
2. Set the Firebase project id.
3. Enable Firestore, Hosting, Functions, Analytics, Crashlytics, Performance Monitoring, and Remote Config.
4. Add Firestore TTL policies for `expiresAt` on `cache`, `downloadQueues`, and `rateLimits`.
5. Do not configure video storage buckets for downloaded media; the system does not persist videos or generate ZIP files.

## Web on Vercel

Create a Vercel project from this repository and set the project root to `apps/web`.

Build settings:

```text
Framework Preset: Next.js
Build Command: npm run build
Output Directory: out
Install Command: npm install
```

Environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Firebase Functions

Deploy backend:

```bash
npm run build:shared
npm run build:functions
firebase deploy --only functions,firestore
```

Runtime variables:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
ALERT_EMAIL_WEBHOOK_URL
ADMIN_DASHBOARD_TOKEN
```

## Mobile

Android size optimization:

```bash
flutter build apk --release --split-per-abi --dart-define=API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
flutter build appbundle --release --dart-define=API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
```

iOS:

```bash
flutter build ipa --release --dart-define=API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
```

Configure Firebase apps with FlutterFire, then add AdMob application ids in native Android/iOS manifests.

## AdSense and AdMob

- Web AdSense script is injected in `apps/web/app/layout.tsx`.
- Ad slots are isolated in `apps/web/components/AdSlot.tsx`.
- Mobile AdMob SDK is initialized in `apps/mobile/lib/main.dart`.
- Put interstitial/rewarded/native ads before queue start and between profile grid sections, capped with Remote Config.

## Operations Checklist

- Verify `/api/health`.
- Verify `/api/admin/performance` with bearer token.
- Confirm Telegram alert delivery.
- Confirm Crashlytics receives test crash in debug/non-production project.
- Confirm Play Console Android Vitals after internal release.
- Test profile queue downloads with pause, resume, cancel, retry failed, and app restart recovery.
