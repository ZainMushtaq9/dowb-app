const http = require("node:http");
const { execFile } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { promisify } = require("node:util");
const { chromium } = require("playwright");

const port = Number(process.env.LOCAL_API_PORT || 8787);
const cache = new Map();
const execFileAsync = promisify(execFile);

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1"
];

function parseTikTokUrl(url) {
  const parsed = new URL(url);
  return {
    username: parsed.pathname.match(/@([^/?]+)/)?.[1],
    videoId: parsed.pathname.match(/\/video\/(\d+)/)?.[1]
  };
}

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) return null;
  return hit.value;
}

function cacheSet(key, value, ttlMs = 10 * 60 * 1000) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization"
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

async function openBrowser() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function scrapeProfile(url, cursor, limit) {
  const { username } = parseTikTokUrl(url);
  if (!username) throw new Error("Profile URL must include @username.");
  const offset = Number(cursor || 0);
  const cacheKey = `profile:${username}:${offset}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const fromYtDlp = await scrapeProfileWithYtDlp(url, offset, limit).catch(() => null);
  if (fromYtDlp?.videos?.length) {
    cacheSet(cacheKey, fromYtDlp);
    return fromYtDlp;
  }

  const browser = await openBrowser();
  const page = await browser.newPage({
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    viewport: { width: 430, height: 900 },
    locale: "en-US"
  });

  try {
    await page.goto(`https://www.tiktok.com/@${username}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await page.waitForTimeout(3500);
    await page.waitForSelector('a[href*="/video/"]', { timeout: 20000 }).catch(() => undefined);

    const target = offset + limit;
    let lastCount = 0;
    for (let i = 0; i < 35; i += 1) {
      const count = await page.locator('a[href*="/video/"]').count();
      if (count >= target || count === lastCount) break;
      lastCount = count;
      await page.mouse.wheel(0, 1800);
      await page.waitForTimeout(900);
    }

    const items = await page.locator('a[href*="/video/"]').evaluateAll((nodes) => {
      const seen = new Set();
      return nodes.flatMap((node) => {
        const anchor = node;
        if (!anchor.href || seen.has(anchor.href)) return [];
        seen.add(anchor.href);
        const container = anchor.closest("[data-e2e], div") || anchor.parentElement || anchor;
        const image = anchor.querySelector("img") || container.querySelector("img");
        const srcset = image?.getAttribute("srcset") || "";
        const thumbnailUrl =
          image?.currentSrc ||
          image?.src ||
          image?.getAttribute("data-src") ||
          srcset.split(",").at(-1)?.trim()?.split(" ")?.[0] ||
          "";
        const label = anchor.getAttribute("aria-label") || image?.alt || anchor.textContent?.trim() || "";
        return [{ url: anchor.href, thumbnailUrl, label }];
      });
    });

    if (!items.length) {
      const title = await page.title().catch(() => "");
      throw new Error(`No public videos found or TikTok blocked the local scraper. Page title: ${title}`);
    }

    const videos = items.slice(offset, offset + limit).map((item) => {
      const id = item.url.match(/\/video\/(\d+)/)?.[1] || randomUUID();
      return {
        id,
        url: item.url,
        title: item.label || `@${username} video ${id}`,
        username,
        thumbnailUrl: item.thumbnailUrl
      };
    });

    const result = {
      videos,
      nextCursor: offset + videos.length < items.length ? String(offset + videos.length) : undefined,
      hasMore: offset + videos.length < items.length
    };
    cacheSet(cacheKey, result);
    return result;
  } finally {
    await browser.close();
  }
}

async function scrapeProfileWithYtDlp(url, offset, limit) {
  const playlistStart = offset + 1;
  const playlistEnd = offset + limit;
  const { stdout } = await execFileAsync(
    "yt-dlp",
    ["--dump-single-json", "--flat-playlist", "--playlist-start", String(playlistStart), "--playlist-end", String(playlistEnd), url],
    {
      timeout: 90000,
      maxBuffer: 20 * 1024 * 1024
    }
  );
  const data = JSON.parse(stdout);
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const videos = entries.map((entry) => {
    const thumbnailUrl =
      entry.thumbnail ||
      entry.thumbnails?.find((thumb) => thumb.id === "cover")?.url ||
      entry.thumbnails?.find((thumb) => thumb.id === "originCover")?.url ||
      entry.thumbnails?.[0]?.url ||
      "";
    return {
      id: String(entry.id || randomUUID()),
      url: entry.url || entry.webpage_url || `https://www.tiktok.com/@${entry.uploader || "unknown"}/video/${entry.id}`,
      title: entry.title || entry.description || `TikTok video ${entry.id}`,
      username: entry.uploader || parseTikTokUrl(url).username || "unknown",
      thumbnailUrl,
      durationSeconds: entry.duration
    };
  });

  return {
    videos,
    nextCursor: videos.length === limit ? String(offset + videos.length) : undefined,
    hasMore: videos.length === limit
  };
}

async function scrapeVideo(url) {
  const { username, videoId } = parseTikTokUrl(url);
  const key = `video:${videoId || url}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const fromYtDlp = await scrapeVideoWithYtDlp(url).catch(() => null);
  if (fromYtDlp?.thumbnailUrl) {
    cacheSet(key, fromYtDlp);
    return fromYtDlp;
  }

  const response = await fetch(url, {
    headers: { "user-agent": userAgents[0], accept: "text/html" }
  });
  const html = await response.text();
  const thumbnailUrl =
    html.match(/"thumbnailUrl":\["([^"]+)"/)?.[1]?.replaceAll("\\u002F", "/") ||
    html.match(/property="og:image" content="([^"]+)"/)?.[1] ||
    "";
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1]?.replace(/\s+\| TikTok.*/, "") || "TikTok video";
  const video = {
    id: videoId || randomUUID(),
    url,
    title,
    username: username || "unknown",
    thumbnailUrl,
    downloadUrl: url,
    noWatermarkUrl: url
  };
  cacheSet(key, video);
  return video;
}

async function scrapeVideoWithYtDlp(url) {
  const { stdout } = await execFileAsync("yt-dlp", ["--dump-single-json", "--skip-download", url], {
    timeout: 90000,
    maxBuffer: 20 * 1024 * 1024
  });
  const data = JSON.parse(stdout);
  const { username, videoId } = parseTikTokUrl(url);
  return {
    id: String(data.id || videoId || randomUUID()),
    url,
    title: data.title || data.description || "TikTok video",
    username: data.uploader || username || "unknown",
    thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || "",
    downloadUrl: data.url || url,
    noWatermarkUrl: data.url || url,
    durationSeconds: data.duration
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return send(res, 204);
    const path = new URL(req.url || "/", `http://127.0.0.1:${port}`).pathname;

    if (req.method === "GET" && path === "/api/health") {
      return send(res, 200, { ok: true, local: true });
    }

    if (req.method === "GET" && path === "/api/config") {
      return send(res, 200, {
        ads: { website_ads_enabled: false, mobile_ads_enabled: false, emergency_disable: true },
        features: { downloader_enabled: true, profile_downloader_enabled: true, api_base_url: `http://127.0.0.1:${port}/api` },
        updatedAt: new Date().toISOString()
      });
    }

    if (req.method === "POST" && path === "/api/profile") {
      const body = await readJson(req);
      return send(res, 200, await scrapeProfile(body.url, body.cursor, Number(body.limit || 36)));
    }

    if (req.method === "POST" && path === "/api/video") {
      const body = await readJson(req);
      return send(res, 200, { video: await scrapeVideo(body.url) });
    }

    if (req.method === "POST" && path === "/api/download-queue") {
      const body = await readJson(req);
      return send(res, 202, { queueId: `local-${Date.now()}`, status: "ready", selectedCount: body.videos?.length || 0 });
    }

    if (req.method === "POST" && /^\/api\/download-queue\/[^/]+\/resolve$/.test(path)) {
      const body = await readJson(req);
      const { videoId, username } = parseTikTokUrl(body.url);
      return send(res, 200, {
        id: videoId || randomUUID(),
        filename: `${username || "tiktok"}-${videoId || Date.now()}.mp4`,
        title: `${username || "tiktok"} video`,
        downloadUrl: body.url
      });
    }

    if (req.method === "POST" && /^\/api\/download-queue\/[^/]+\/events$/.test(path)) {
      return send(res, 204);
    }

    if (req.method === "POST" && path === "/api/metrics") {
      return send(res, 204);
    }

    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 502, { error: error instanceof Error ? error.message : "Local API failed" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local TikTok API running at http://127.0.0.1:${port}/api`);
});
