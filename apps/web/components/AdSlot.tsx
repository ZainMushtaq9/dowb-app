"use client";

import { useEffect } from "react";

export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    try {
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle?.push({});
    } catch {
      // Ad blockers should not affect the downloader flow.
    }
  }, []);

  if (!client) {
    return <div className={`h-20 rounded border border-dashed border-black/15 dark:border-white/15 ${className}`} aria-hidden />;
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
