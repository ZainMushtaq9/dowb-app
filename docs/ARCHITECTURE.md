# TikTok Downloader Platform Architecture

## Goals

- Public utility only: no accounts, no login, no Firebase Auth.
- No ZIP files, no archive generation, and no permanent video storage.
- Bulk downloads run as sequential client/mobile queues with concurrency `1`.
- Smooth mobile performance with 2000+ profile videos through virtualized/lazy rendering.
- Viral traffic resilience through caching, rate limits, randomized delays, retry/backoff, and bounded scraping.

## Monorepo

```text
apps/web            Next.js 16 PWA, AdSense, SEO pages, admin performance dashboard
apps/mobile         Expo React Native app, AdMob, Firebase monitoring, persistent SQLite queue downloads
functions           Firebase Functions API, scraper services, resolver endpoints, metrics and alerts
packages/shared     Zod API schemas, telemetry contracts, performance limits
docs                Architecture and deployment runbooks
```

## Firestore Collections

| Collection | Purpose | Retention |
| --- | --- | --- |
| `cache` | Short-lived TikTok metadata/profile pages | TTL via `expiresAt` |
| `downloadQueues` | Client-managed queue sessions and events | TTL via `expiresAt` |
| `adminConfig` | Central ad and feature config mirrored with Firebase Remote Config | Persistent |
| `metrics` | API, app, queue, speed, memory, frame metrics | BigQuery export or 7-30 day TTL |
| `alerts` | Alert audit trail for failures and latency | 30-90 day TTL |
| `rateLimits` | Per-IP rolling rate counters | TTL via `expiresAt` |

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Function health |
| `GET` | `/config` | Public ad and feature config for web/mobile |
| `POST` | `/video` | Fetch public video metadata and download options |
| `POST` | `/profile` | Fetch profile video window for infinite loading |
| `POST` | `/download-queue` | Create a lightweight client-managed queue session |
| `POST` | `/download-queue/:queueId/resolve` | Resolve one selected video to a temporary direct URL |
| `POST` | `/download-queue/:queueId/events` | Record success, failure, retry, skip, pause, resume, cancel |
| `POST` | `/metrics` | Custom performance metrics from web/mobile |
| `GET` | `/admin/performance` | Internal dashboard data |

## Sequential Queue Model

- Browser and mobile apps own the queue state.
- Downloads run one-by-one with randomized 5-10 second delay.
- Failed items retry with exponential backoff and can be retried later.
- Queue state persists locally for recovery after refresh or app restart.
- Backend resolves one video at a time, so it never stores huge files, builds archives, or holds video buffers.

## Web Download Strategy

- `BrowserDownloadQueue` triggers controlled browser downloads with a hidden anchor.
- Queue UI exposes pause, resume, cancel, and retry failed.
- Browser storage keeps queue state and history.
- Concurrency is fixed to `1` to avoid browser blocking and TikTok throttling.

## Centralized Ads and Feature Control

- Admins update `adminConfig/ads_config`, `adminConfig/feature_config`, or Firebase Remote Config.
- Functions exposes a cached `/config` endpoint.
- Web and mobile fetch config at runtime, enabling ad ID changes, emergency ad disable, maintenance mode, downloader switches, queue delays, API endpoint switching, and force updates without redeploying.
- AdSense auto/banner/in-feed/article slots and AdMob app-open/banner/interstitial/rewarded/native IDs share the same config source.

## Mobile Download Strategy

- Expo queue persists every item in SQLite with URL, filename, state, retry count, progress, file path, timestamps, and last error.
- Expo Background Fetch/Task Manager resumes queue work in the background where the OS allows it.
- Downloads stream directly with resumable file APIs and are saved into the gallery/download library.
- Heavy work is dispatched outside the UI path; scrolling and controls remain responsive.
- iOS background execution depends on platform entitlements and should use native background URL sessions for App Store release hardening.

## Performance Controls

- Web profile grid uses `react-window`.
- Flutter profile grid uses `SliverGrid.builder`, `RepaintBoundary`, and cached network images with memory width caps.
- Backend scraping uses randomized 5-10 second delays, rotating user agents, cache hits first, request timeouts, and bounded retries.
- No server archive files and no Cloud Storage temporary video packages.
- Cloud Functions API uses `minInstances: 1` for cold-start reduction and concurrency for throughput.

## Monitoring

- Firebase Crashlytics: React Native fatal/non-fatal crash capture.
- Firebase Performance Monitoring: mobile HTTP traces and startup timing.
- Firebase Analytics: app navigation and startup events.
- Google Play Android Vitals: ANR/crash/startup monitoring after Play Console release.
- Backend custom metrics: latency, queue delay, download success/failure, retries, scraper blocks.
- Alerts: Telegram and email webhook through `sendAlert`.

## Cost Controls

- Firestore TTL for cache/rate/queue/metric documents.
- Cache profile and video metadata aggressively for short windows.
- Resolve one download URL at a time.
- Avoid Cloud Storage for downloaded videos.
- Keep mobile payloads small: 36 videos per profile window, load more/infinite loading, compressed thumbnails.
