"use client";

import { useEffect, useState } from "react";
import type { AdsConfig } from "@tiktok-downloader/shared";
import { getRuntimeConfig } from "@/lib/remoteConfig";

export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const [ads, setAds] = useState<AdsConfig | null>(null);

  useEffect(() => {
    getRuntimeConfig().then((config) => setAds(config.ads));
  }, []);

  useEffect(() => {
    if (!ads?.website_ads_enabled || !ads.adsense_enabled || ads.emergency_disable) return;
    try {
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle?.push({});
    } catch {
      // Ad blockers should not affect the downloader flow.
    }
  }, [ads]);

  if (!ads?.website_ads_enabled || !ads.adsense_enabled || ads.emergency_disable || !ads.adsense_client_id) {
    return <div className={`h-20 rounded border border-dashed border-black/15 dark:border-white/15 ${className}`} aria-hidden />;
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      data-ad-client={ads.adsense_client_id}
      data-ad-slot={slot || ads.banner_ad_unit}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
