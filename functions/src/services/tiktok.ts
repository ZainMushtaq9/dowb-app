import { cacheKeys, limits } from "@tiktok-downloader/shared";
import { chromium } from "playwright";
import { request } from "undici";
import { env } from "../config/env.js";
import { getCached, setCached } from "./cache.js";
import { recordMetric } from "./metrics.js";

export interface TikTokVideo {
  id: string;
  url: string;
  title: string;
  username: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  downloadUrl?: string;
  noWatermarkUrl?: string;
}

const userAgents = [
  "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () =>
  limits.tiktokDelayMinMs + Math.floor(Math.random() * (limits.tiktokDelayMaxMs - limits.tiktokDelayMinMs));
const inFlight = new Map<string, Promise<unknown>>();

async function dedupe<T>(key: string, work: () => Promise<T>) {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = work().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function parseTikTokUrl(url: string) {
  const parsed = new URL(url);
  const videoId = parsed.pathname.match(/\/video\/(\d+)/)?.[1];
  const username = parsed.pathname.match(/@([^/?]+)/)?.[1];
  return { videoId, username };
}

export async function fetchVideoMetadata(url: string): Promise<TikTokVideo> {
  return dedupe(`video:${url}`, () => fetchVideoMetadataInternal(url));
}

async function fetchVideoMetadataInternal(url: string): Promise<TikTokVideo> {
  const { videoId, username } = parseTikTokUrl(url);
  const key = cacheKeys.video(videoId || encodeURIComponent(url));
  const cached = await getCached<TikTokVideo>(key);
  if (cached) return cached;

  await sleep(randomDelay());
  const started = performance.now();
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
  const res = await request(url, {
    headers: { "user-agent": ua, accept: "text/html" },
    bodyTimeout: limits.apiTimeoutMs,
    headersTimeout: limits.apiTimeoutMs
  });
  const html = await res.body.text();
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1]?.replace(/\s+\| TikTok.*/, "") || "TikTok video";
  const thumbnailUrl =
    html.match(/"thumbnailUrl":\["([^"]+)"/)?.[1]?.replace(/\\u002F/g, "/") ||
    html.match(/property="og:image" content="([^"]+)"/)?.[1] ||
    "";
  const downloadUrl = html.match(/"downloadAddr":"([^"]+)"/)?.[1]?.replace(/\\u002F/g, "/");
  const noWatermarkUrl = html.match(/"playAddr":"([^"]+)"/)?.[1]?.replace(/\\u002F/g, "/");

  if (res.statusCode >= 400 || !html.includes("TikTok")) {
    await recordMetric({ event: "scraper_blocked", value: 1, unit: "count", route: "fetchVideoMetadata" });
    throw new Error("TikTok metadata fetch failed or was blocked");
  }

  const video: TikTokVideo = {
    id: videoId || crypto.randomUUID(),
    url,
    title,
    username: username || "unknown",
    thumbnailUrl,
    downloadUrl,
    noWatermarkUrl
  };
  await setCached(key, video, env.cacheTtlSeconds);
  await recordMetric({
    event: "scraper_success",
    value: 1,
    unit: "count",
    route: "tiktok.fetchVideoMetadata"
  });
  await recordMetric({
    event: "api_latency",
    value: Math.round(performance.now() - started),
    unit: "ms",
    route: "tiktok.fetchVideoMetadata"
  });
  return video;
}

export async function fetchProfileVideos(url: string, cursor?: string, limit: number = limits.profilePageSize) {
  return dedupe(`profile:${url}:${cursor || "first"}:${limit}`, () => fetchProfileVideosInternal(url, cursor, limit));
}

async function fetchProfileVideosInternal(url: string, cursor?: string, limit: number = limits.profilePageSize) {
  const { username } = parseTikTokUrl(url);
  if (!username) throw new Error("TikTok profile URL must include @username");
  const cacheKey = `${cacheKeys.profile(username)}:${cursor || "first"}:${limit}`;
  const cached = await getCached<{ videos: TikTokVideo[]; nextCursor?: string; hasMore: boolean }>(cacheKey);
  if (cached) return cached;

  await sleep(randomDelay());
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    viewport: { width: 390, height: 844 }
  });

  try {
    await page.goto(`https://www.tiktok.com/@${username}`, {
      waitUntil: "domcontentloaded",
      timeout: limits.scraperTimeoutMs
    });

    const targetCount = Math.min(limit + Number(cursor || 0), env.maxProfileVideos);
    let previous = 0;
    for (let i = 0; i < 60; i += 1) {
      const count = await page.locator('a[href*="/video/"]').count();
      if (count >= targetCount || count === previous) break;
      previous = count;
      await page.mouse.wheel(0, 1800);
      await page.waitForTimeout(750);
    }

    const profileItems = await page
      .locator('a[href*="/video/"]')
      .evaluateAll((nodes) => {
        const seen = new Set<string>();
        return nodes.flatMap((node) => {
          const anchor = node as HTMLAnchorElement;
          if (!anchor.href || seen.has(anchor.href)) return [];
          seen.add(anchor.href);
          const img =
            anchor.querySelector("img") ||
            anchor.parentElement?.querySelector("img") ||
            anchor.closest("div")?.querySelector("img");
          const image = img as HTMLImageElement | null;
          const thumbnailUrl =
            image?.currentSrc ||
            image?.src ||
            image?.getAttribute("data-src") ||
            image?.getAttribute("srcset")?.split(" ")?.[0] ||
            "";
          const label = anchor.getAttribute("aria-label") || anchor.textContent?.trim() || "";
          return [{ url: anchor.href, thumbnailUrl, label }];
        });
      });
    const offset = Number(cursor || 0);
    const slice = profileItems.slice(offset, offset + limit);
    const videos = slice.map((item) => {
      const videoUrl = item.url;
      const id = videoUrl.match(/\/video\/(\d+)/)?.[1] || crypto.randomUUID();
      return {
        id,
        url: videoUrl,
        title: item.label || `@${username} video ${id}`,
        username,
        thumbnailUrl: item.thumbnailUrl
      };
    });
    const result = {
      videos,
      nextCursor: offset + videos.length < profileItems.length && offset + videos.length < env.maxProfileVideos ? String(offset + videos.length) : undefined,
      hasMore: offset + videos.length < profileItems.length && offset + videos.length < env.maxProfileVideos
    };
    await setCached(cacheKey, result, env.cacheTtlSeconds);
    await recordMetric({ event: "scraper_success", value: 1, unit: "count", route: "tiktok.fetchProfileVideos" });
    return result;
  } finally {
    await browser.close();
  }
}
