# Deployment

## Prerequisites

- Node.js 20.9+
- Firebase CLI
- Expo CLI / EAS CLI for mobile releases
- Android Studio/Xcode for mobile releases

## Install

```bash
npm install
npm run build
```

For Expo:

```bash
cd apps/mobile
npm install
npx expo start
```

## Firebase Setup

1. Copy `.firebaserc.example` to `.firebaserc`.
2. Set the Firebase project id.
3. Enable Firestore, Hosting, Functions, Analytics, Crashlytics, Performance Monitoring, and Remote Config.
4. Add Firestore TTL policies for `expiresAt` on `cache`, `downloadQueues`, and `rateLimits`.
5. Do not configure video storage buckets for downloaded media; the system does not persist videos or generate ZIP files.

## Web on Vercel

Create a Vercel project from this repository and keep the project root at the repository root so npm workspaces can install `packages/shared`.

Build settings:

```text
Framework Preset: Next.js
Build Command: npm run vercel-build
Output Directory: apps/web/.next
Install Command: npm install --include=dev --no-audit --no-fund
```

Environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net/api
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_ENABLE_MOCK_API=false
NEXT_PUBLIC_SENTRY_DSN=
```

Vercel can also read the included `vercel.json`, which sets the build command and static asset cache headers.

## Local Modes

Real backend mode:

```powershell
.\start-local.bat
```

This requires `NEXT_PUBLIC_API_BASE_URL` to point to Firebase Functions or an emulator. Real TikTok thumbnails only appear in this mode when the backend scraper can reach TikTok.

Demo/mock mode:

```powershell
.\start-demo.bat
```

This uses generated placeholder thumbnails and does not contact TikTok.

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

## Centralized Ads and Feature Flags

Create these Firestore documents:

```text
adminConfig/ads_config
adminConfig/feature_config
```

`ads_config` fields:

```json
{
  "adsense_enabled": true,
  "adsense_client_id": "ca-pub-0000000000000000",
  "banner_ad_unit": "1234567890",
  "interstitial_ad_unit": "ca-app-pub-xxx/yyy",
  "rewarded_ad_unit": "ca-app-pub-xxx/zzz",
  "native_ad_unit": "ca-app-pub-xxx/native",
  "app_open_ad_unit": "ca-app-pub-xxx/open",
  "website_ads_enabled": true,
  "mobile_ads_enabled": true,
  "emergency_disable": false,
  "interstitial_cooldown_seconds": 90,
  "rewarded_cooldown_seconds": 60
}
```

`feature_config` controls maintenance mode, downloader switches, API endpoint switching, queue delay bounds, scraping fallback, and force-update versions. The public apps fetch `/api/config`, so ad IDs and emergency switches change without redeploying Vercel or publishing a mobile update.

## Mobile

```bash
npm install
npx expo prebuild
eas build --platform android
eas build --platform ios
```

Configure Firebase Android/iOS apps, add native config files during prebuild, and replace the test AdMob application ids in `apps/mobile/app.json`. Runtime ad unit IDs come from Firebase config.

## AdSense and AdMob

- Web AdSense script is injected dynamically by `apps/web/components/AdsScript.tsx`.
- Ad slots are isolated in `apps/web/components/AdSlot.tsx`.
- Mobile AdMob SDK uses `react-native-google-mobile-ads`; unit IDs are pulled from `/api/config`.
- Put interstitial/rewarded/native ads before queue start and between profile grid sections, capped with Remote Config.

## Operations Checklist

- Verify `/api/health`.
- Verify `/api/admin/performance` with bearer token.
- Confirm Telegram alert delivery.
- Confirm Crashlytics receives test crash in debug/non-production project.
- Confirm Play Console Android Vitals after internal release.
- Test profile queue downloads with pause, resume, cancel, retry failed, and app restart recovery.
