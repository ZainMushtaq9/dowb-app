"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { api } from "@/lib/api";

export function WebVitals() {
  useEffect(() => {
    const reportError = (message: string, source: string) => {
      api.metric({
        event: "web_error",
        value: 1,
        unit: "count",
        deviceClass: "web",
        tags: { message: message.slice(0, 180), source }
      });
    };
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
    const onError = (event: ErrorEvent) => reportError(event.message || "Window error", "window");
    const onRejection = (event: PromiseRejectionEvent) => reportError(String(event.reason?.message || event.reason || "Unhandled rejection"), "promise");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
