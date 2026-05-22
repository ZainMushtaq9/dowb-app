"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import type { AdsConfig } from "@tiktok-downloader/shared";
import { getRuntimeConfig } from "@/lib/remoteConfig";

export function AdsScript() {
  const [ads, setAds] = useState<AdsConfig | null>(null);

  useEffect(() => {
    getRuntimeConfig().then((config) => setAds(config.ads));
  }, []);

  if (!ads?.website_ads_enabled || !ads.adsense_enabled || ads.emergency_disable || !ads.adsense_client_id) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.adsense_client_id}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
