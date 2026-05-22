import { bulkJobRequestSchema, profileRequestSchema, videoRequestSchema } from "@tiktok-downloader/shared";
import express from "express";
import { nanoid } from "nanoid";
import { db, FieldValue } from "../config/firebase.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../services/http.js";
import { aggregateDashboardMetrics, performanceLogger, recordMetric } from "../services/metrics.js";
import { fetchProfileVideos, fetchVideoMetadata } from "../services/tiktok.js";

export const routes = express.Router();

routes.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tiktok-downloader-api", region: env.taskQueueLocation });
});

routes.post(
  "/video",
  performanceLogger("POST /video"),
  asyncHandler(async (req, res) => {
    const input = videoRequestSchema.parse(req.body);
    const video = await fetchVideoMetadata(input.url);
    res.set("cache-control", "public,max-age=60,s-maxage=300");
    res.json({ video });
  })
);

routes.post(
  "/profile",
  performanceLogger("POST /profile"),
  asyncHandler(async (req, res) => {
    const input = profileRequestSchema.parse(req.body);
    const result = await fetchProfileVideos(input.url, input.cursor, input.limit);
    res.set("cache-control", "public,max-age=60,s-maxage=300");
    res.json(result);
  })
);

routes.post(
  "/download-queue",
  performanceLogger("POST /download-queue"),
  asyncHandler(async (req, res) => {
    const input = bulkJobRequestSchema.parse(req.body);
    const queueId = nanoid(16);
    await db.collection("downloadQueues").doc(queueId).set({
      status: "client_managed",
      videos: input.videos,
      selectedCount: input.videos.length,
      progress: 0,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    res.status(202).json({ queueId, status: "ready", selectedCount: input.videos.length });
  })
);

routes.post(
  "/download-queue/:queueId/resolve",
  performanceLogger("POST /download-queue/:queueId/resolve"),
  asyncHandler(async (req, res) => {
    const input = videoRequestSchema.parse(req.body);
    const video = await fetchVideoMetadata(input.url);
    await db.collection("downloadQueues").doc(req.params.queueId).collection("events").add({
      type: "resolved",
      videoId: video.id,
      createdAt: FieldValue.serverTimestamp()
    });
    res.set("cache-control", "private,max-age=60");
    res.json({
      id: video.id,
      filename: `${video.username}-${video.id}.mp4`,
      downloadUrl: video.noWatermarkUrl || video.downloadUrl,
      title: video.title
    });
  })
);

routes.post(
  "/download-queue/:queueId/events",
  asyncHandler(async (req, res) => {
    await db.collection("downloadQueues").doc(req.params.queueId).collection("events").add({
      ...req.body,
      createdAt: FieldValue.serverTimestamp()
    });
    if (req.body?.type === "success") {
      await recordMetric({ event: "download_success", value: 1, unit: "count", route: "clientQueue" });
    }
    if (req.body?.type === "failed") {
      await recordMetric({ event: "download_failure", value: 1, unit: "count", route: "clientQueue", tags: { retries: req.body.retries || 0 } });
    }
    res.status(204).send();
  })
);

routes.post(
  "/metrics",
  asyncHandler(async (req, res) => {
    await recordMetric(req.body);
    res.status(204).send();
  })
);

routes.get(
  "/admin/performance",
  asyncHandler(async (req, res) => {
    if (env.adminDashboardToken && req.headers.authorization !== `Bearer ${env.adminDashboardToken}`) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const metrics = await aggregateDashboardMetrics();
    const active = await db.collection("downloadQueues").where("status", "==", "client_managed").count().get();
    res.set("cache-control", "private,max-age=10");
    res.json({
      ...metrics,
      activeQueueSize: active.data().count
    });
  })
);
