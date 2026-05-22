import type { PublicRuntimeConfig } from "./api";
import { api } from "./api";

const fallbackConfig: PublicRuntimeConfig = {
  ads: {
    adsense_enabled: false,
    adsense_client_id: "",
    banner_ad_unit: "",
    interstitial_ad_unit: "",
    rewarded_ad_unit: "",
    native_ad_unit: "",
    app_open_ad_unit: "",
    website_ads_enabled: false,
    mobile_ads_enabled: false,
    emergency_disable: false,
    interstitial_cooldown_seconds: 90,
    rewarded_cooldown_seconds: 60
  },
  features: {
    downloader_enabled: true,
    profile_downloader_enabled: true,
    maintenance_mode: false,
    queue_delay_min_ms: 5000,
    queue_delay_max_ms: 10000,
    scraping_fallback: "auto",
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
