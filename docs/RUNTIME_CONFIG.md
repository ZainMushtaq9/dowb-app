# Runtime Configuration

Change API URL, AdSense, and AdMob values without editing app code by updating Firebase Remote Config or Firestore.

The backend endpoint `/config` reads values from:

1. Firestore `adminConfig/ads_config`
2. Firestore `adminConfig/feature_config`
3. Firebase Remote Config parameters with the same names

Firestore values override Remote Config values.

## Website Ads

Create or update Firestore document:

```text
Collection: adminConfig
Document: ads_config
```

Fields:

```json
{
  "website_ads_enabled": true,
  "adsense_enabled": true,
  "adsense_client_id": "ca-pub-xxxxxxxxxxxxxxxx",
  "banner_ad_unit": "1234567890",
  "emergency_disable": false
}
```

The website loads these values from `/config`; no rebuild is needed after changing them.

## Mobile AdMob

Use the same `adminConfig/ads_config` document:

```json
{
  "mobile_ads_enabled": true,
  "banner_ad_unit": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy",
  "interstitial_ad_unit": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy",
  "rewarded_ad_unit": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy",
  "native_ad_unit": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy",
  "app_open_ad_unit": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy",
  "emergency_disable": false
}
```

Ad unit IDs can change remotely. AdMob App IDs in `apps/mobile/app.json` are native app identifiers and normally require a new app build if changed.

## API URL

Create or update Firestore document:

```text
Collection: adminConfig
Document: feature_config
```

Fields:

```json
{
  "api_base_url": "https://us-central1-your-project.cloudfunctions.net/api",
  "downloader_enabled": true,
  "profile_downloader_enabled": true,
  "maintenance_mode": false,
  "queue_delay_min_ms": 5000,
  "queue_delay_max_ms": 10000
}
```

The mobile app can switch to this API URL after it has fetched `/config`. The first bootstrap URL still comes from `apps/mobile/app.json` or Vercel/Firebase environment config.

## Emergency Disable

Set this to stop all ad loading immediately:

```json
{
  "emergency_disable": true
}
```
