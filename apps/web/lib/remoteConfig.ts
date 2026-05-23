import type { PublicRuntimeConfig } from "./api";
import { api } from "./api";

const fallbackConfig: PublicRuntimeConfig = {
  ads: {
    adsense_enabled: false,
    adsense_client_id: "",
    banner_ad_unit: "",
    in_feed_ad_unit: "",
    interstitial_ad_unit: "",
    rewarded_ad_unit: "",
    native_ad_unit: "",
    app_open_ad_unit: "",
    website_ads_enabled: false,
    mobile_ads_enabled: false,
    emergency_disable: false,
    app_open_enabled: false,
    native_ads_enabled: false,
    banner_refresh_seconds: 60,
    interstitial_frequency: 3,
    rewarded_frequency: 5,
    native_ad_frequency: 8,
    interstitial_cooldown_seconds: 90,
    rewarded_cooldown_seconds: 60
  },
  features: {
    downloader_enabled: true,
    profile_downloader_enabled: true,
    maintenance_mode: false,
    queue_delay_min_ms: 5000,
    queue_delay_max_ms: 10000,
    retry_max_attempts: 10,
    retry_base_delay_ms: 5000,
    retry_max_delay_ms: 60000,
    offline_queue_enabled: true,
    background_downloads_enabled: true,
    creator_tools_enabled: true,
    scraping_fallback: "auto",
    api_endpoints_enabled: true,
    force_update_min_version: "",
    latest_version: ""
  },
  updatedAt: new Date(0).toISOString()
};

let cached: PublicRuntimeConfig | null = null;
let expiresAt = 0;

export async function getRuntimeConfig() {
  const now = Date.now();
  if (cached && now < expiresAt) return cached;
  try {
    cached = await api.config();
    expiresAt = now + 60_000;
    return cached;
  } catch {
    return cached || fallbackConfig;
  }
}
