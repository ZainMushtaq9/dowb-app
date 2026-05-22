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

export type VideoRequest = z.infer<typeof videoRequestSchema>;
export type ProfileRequest = z.infer<typeof profileRequestSchema>;
export type BulkJobRequest = z.infer<typeof bulkJobRequestSchema>;
