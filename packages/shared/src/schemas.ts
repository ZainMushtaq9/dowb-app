import { z } from "zod";
import { limits } from "./limits.js";

export const tiktokUrlSchema = z
  .string()
  .url()
  .refine((value) => /(^|\.)tiktok\.com$/.test(new URL(value).hostname.replace(/^www\./, "")), {
    message: "Only public TikTok URLs are supported"
  });

export const videoRequestSchema = z.object({
  url: tiktokUrlSchema
});

export const profileRequestSchema = z.object({
  url: tiktokUrlSchema,
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(72).default(limits.profilePageSize)
});

export const bulkJobRequestSchema = z.object({
  videos: z
    .array(
      z.object({
        id: z.string().min(3),
        url: tiktokUrlSchema,
        title: z.string().max(200).optional(),
        username: z.string().max(80).optional()
      })
    )
    .min(1)
    .max(limits.maxBulkSelection)
});

export const metricSchema = z.object({
  event: z.string().min(2),
  value: z.number().finite(),
  unit: z.enum(["ms", "bytes", "mb", "fps", "count", "percent", "kbps"]),
  route: z.string().optional(),
  deviceClass: z.enum(["low", "mid", "high", "web"]).optional(),
  tags: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const adsConfigSchema = z.object({
  adsense_enabled: z.boolean().default(false),
  adsense_client_id: z.string().default(""),
  banner_ad_unit: z.string().default(""),
  in_feed_ad_unit: z.string().default(""),
  interstitial_ad_unit: z.string().default(""),
  rewarded_ad_unit: z.string().default(""),
  native_ad_unit: z.string().default(""),
  app_open_ad_unit: z.string().default(""),
  website_ads_enabled: z.boolean().default(false),
  mobile_ads_enabled: z.boolean().default(false),
  emergency_disable: z.boolean().default(false),
  app_open_enabled: z.boolean().default(false),
  native_ads_enabled: z.boolean().default(false),
  banner_refresh_seconds: z.number().int().min(0).default(60),
  interstitial_frequency: z.number().int().min(0).default(3),
  rewarded_frequency: z.number().int().min(0).default(5),
  native_ad_frequency: z.number().int().min(0).default(8),
  interstitial_cooldown_seconds: z.number().int().min(0).default(90),
  rewarded_cooldown_seconds: z.number().int().min(0).default(60)
});

export const featureConfigSchema = z.object({
  downloader_enabled: z.boolean().default(true),
  profile_downloader_enabled: z.boolean().default(true),
  maintenance_mode: z.boolean().default(false),
  api_base_url: z.string().url().optional(),
  queue_delay_min_ms: z.number().int().min(1000).default(limits.tiktokDelayMinMs),
  queue_delay_max_ms: z.number().int().min(1000).default(limits.tiktokDelayMaxMs),
  retry_max_attempts: z.number().int().min(1).max(20).default(10),
  retry_base_delay_ms: z.number().int().min(1000).default(5000),
  retry_max_delay_ms: z.number().int().min(1000).default(60000),
  offline_queue_enabled: z.boolean().default(true),
  background_downloads_enabled: z.boolean().default(true),
  creator_tools_enabled: z.boolean().default(true),
  scraping_fallback: z.enum(["http", "playwright", "auto"]).default("auto"),
  api_endpoints_enabled: z.boolean().default(true),
  force_update_min_version: z.string().default(""),
  latest_version: z.string().default("")
});

export type VideoRequest = z.infer<typeof videoRequestSchema>;
export type ProfileRequest = z.infer<typeof profileRequestSchema>;
export type BulkJobRequest = z.infer<typeof bulkJobRequestSchema>;
export type AdsConfig = z.infer<typeof adsConfigSchema>;
export type FeatureConfig = z.infer<typeof featureConfigSchema>;
