"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { api } from "@/lib/api";

export function WebVitals() {
  useEffect(() => {
    const report = (name: string, value: number) => {
      api.metric({
        event: name === "INP" ? "screen_render" : "api_latency",
        value: Math.round(value),
        unit: "ms",
        deviceClass: "web",
        tags: { metric: name }
      });
    };
    onCLS((metric) => report("CLS", metric.value * 1000));
    onFCP((metric) => report("FCP", metric.value));
    onINP((metric) => report("INP", metric.value));
    onLCP((metric) => report("LCP", metric.value));
    onTTFB((metric) => report("TTFB", metric.value));
  }, []);

  return null;
}
