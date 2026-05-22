import { MetricPoint, metricSchema } from "@tiktok-downloader/shared";
import type { Request, Response, NextFunction } from "express";
import { db, FieldValue } from "../config/firebase.js";
import { sendAlert } from "./alerts.js";

export async function recordMetric(point: MetricPoint) {
  const parsed = metricSchema.parse(point);
  const createdAt = new Date();
  await db.collection("metrics").add({
    ...parsed,
    createdAt,
    minute: createdAt.toISOString().slice(0, 16)
  });
}

export function performanceLogger(routeName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const started = performance.now();
    res.on("finish", async () => {
      const elapsed = Math.round(performance.now() - started);
      await recordMetric({
        event: "api_latency",
        value: elapsed,
        unit: "ms",
        route: routeName,
        tags: { status: res.statusCode, method: req.method }
      }).catch(() => undefined);

      if (elapsed > 8000 || res.statusCode >= 500) {
        await sendAlert({
          title: "High API latency or backend failure",
          severity: res.statusCode >= 500 ? "critical" : "warning",
          source: "functions",
          message: `${routeName} returned ${res.statusCode} in ${elapsed}ms`,
          tags: { route: routeName, elapsed, status: res.statusCode }
        });
      }
    });
    next();
  };
}

export async function aggregateDashboardMetrics() {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const snap = await db.collection("metrics").where("createdAt", ">=", since).limit(5000).get();
  const values = snap.docs.map((doc) => doc.data());
  const avg = (event: string) => {
    const rows = values.filter((row) => row.event === event);
    return rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.value || 0), 0) / rows.length) : 0;
  };
  const count = (event: string) => values.filter((row) => row.event === event).length;

  return {
    window: "1h",
    averageApiMs: avg("api_latency"),
    averageStartupMs: avg("app_startup"),
    averageDownloadKbps: avg("download_speed"),
    averageQueueDownloadMs: avg("queue_download"),
    averageQueueDelayMs: avg("queue_delay"),
    frameDropReports: count("frame_drop"),
    appFreezeReports: count("app_freeze"),
    scraperBlocks: count("scraper_blocked"),
    downloadSuccess: count("download_success"),
    downloadFailures: count("download_failure"),
    updatedAt: FieldValue.serverTimestamp()
  };
}
