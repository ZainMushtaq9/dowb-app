import { adsConfigSchema, featureConfigSchema } from "@tiktok-downloader/shared";
import { db, remoteConfig } from "../config/firebase.js";
import { env } from "../config/env.js";

const defaults = {
  ads: adsConfigSchema.parse({}),
  features: featureConfigSchema.parse({})
};

function remoteValue(parameters: Record<string, unknown>, key: string) {
  const parameter = parameters[key] as { defaultValue?: { value?: string } } | undefined;
  return parameter?.defaultValue?.value;
}

function coerce(value: string | undefined) {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && value.trim() !== "") return numeric;
  return value;
}

export async function getPublicRuntimeConfig() {
  const [adsDoc, featureDoc, template] = await Promise.all([
    db.collection("adminConfig").doc("ads_config").get().catch(() => null),
    db.collection("adminConfig").doc("feature_config").get().catch(() => null),
    remoteConfig.getTemplate().catch(() => null)
  ]);

  const parameters = template?.parameters || {};
  const remoteAds = {
    adsense_enabled: coerce(remoteValue(parameters, "adsense_enabled")),
    adsense_client_id: coerce(remoteValue(parameters, "adsense_client_id")),
    banner_ad_unit: coerce(remoteValue(parameters, "banner_ad_unit")),
    in_feed_ad_unit: coerce(remoteValue(parameters, "in_feed_ad_unit")),
    interstitial_ad_unit: coerce(remoteValue(parameters, "interstitial_ad_unit")),
    rewarded_ad_unit: coerce(remoteValue(parameters, "rewarded_ad_unit")),
    native_ad_unit: coerce(remoteValue(parameters, "native_ad_unit")),
    app_open_ad_unit: coerce(remoteValue(parameters, "app_open_ad_unit")),
    website_ads_enabled: coerce(remoteValue(parameters, "website_ads_enabled")),
    mobile_ads_enabled: coerce(remoteValue(parameters, "mobile_ads_enabled")),
    emergency_disable: coerce(remoteValue(parameters, "emergency_disable")),
    app_open_enabled: coerce(remoteValue(parameters, "app_open_enabled")),
    native_ads_enabled: coerce(remoteValue(parameters, "native_ads_enabled")),
    banner_refresh_seconds: coerce(remoteValue(parameters, "banner_refresh_seconds")),
    interstitial_frequency: coerce(remoteValue(parameters, "interstitial_frequency")),
    rewarded_frequency: coerce(remoteValue(parameters, "rewarded_frequency")),
    native_ad_frequency: coerce(remoteValue(parameters, "native_ad_frequency")),
    interstitial_cooldown_seconds: coerce(remoteValue(parameters, "interstitial_cooldown_seconds")),
    rewarded_cooldown_seconds: coerce(remoteValue(parameters, "rewarded_cooldown_seconds"))
  };

  const remoteFeatures = {
    downloader_enabled: coerce(remoteValue(parameters, "downloader_enabled")),
    profile_downloader_enabled: coerce(remoteValue(parameters, "profile_downloader_enabled")),
    maintenance_mode: coerce(remoteValue(parameters, "maintenance_mode")),
    api_base_url: coerce(remoteValue(parameters, "api_base_url")),
    queue_delay_min_ms: coerce(remoteValue(parameters, "queue_delay_min_ms")),
    queue_delay_max_ms: coerce(remoteValue(parameters, "queue_delay_max_ms")),
    retry_max_attempts: coerce(remoteValue(parameters, "retry_max_attempts")),
    retry_base_delay_ms: coerce(remoteValue(parameters, "retry_base_delay_ms")),
    retry_max_delay_ms: coerce(remoteValue(parameters, "retry_max_delay_ms")),
    offline_queue_enabled: coerce(remoteValue(parameters, "offline_queue_enabled")),
    background_downloads_enabled: coerce(remoteValue(parameters, "background_downloads_enabled")),
    creator_tools_enabled: coerce(remoteValue(parameters, "creator_tools_enabled")),
    scraping_fallback: coerce(remoteValue(parameters, "scraping_fallback")),
    api_endpoints_enabled: coerce(remoteValue(parameters, "api_endpoints_enabled")),
    force_update_min_version: coerce(remoteValue(parameters, "force_update_min_version")),
    latest_version: coerce(remoteValue(parameters, "latest_version"))
  };

  const ads = adsConfigSchema.parse({
    ...defaults.ads,
    ...remoteAds,
    ...(adsDoc?.exists ? adsDoc.data() : {})
  });
  const features = featureConfigSchema.parse({
    ...defaults.features,
    ...remoteFeatures,
    ...(featureDoc?.exists ? featureDoc.data() : {}),
    api_base_url: env.publicBaseUrl
  });

  return { ads, features, updatedAt: new Date().toISOString() };
}
