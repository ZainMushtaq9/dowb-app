import type { AdsConfig, FeatureConfig, MetricPoint } from "@tiktok-downloader/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const MOCK_API = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === "true";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  username: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  downloadUrl?: string;
  noWatermarkUrl?: string;
}

export interface PublicRuntimeConfig {
  ads: AdsConfig;
  features: FeatureConfig;
  updatedAt: string;
}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  if (MOCK_API) return mockPost<T>(path, body);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal
  });
  if (!response.ok && shouldUseLocalFallback(response.status)) return mockPost<T>(path, body);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || `API request failed (${response.status}). Check NEXT_PUBLIC_API_BASE_URL or start the backend.`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  video: (url: string, signal?: AbortSignal) => post<{ video: VideoItem }>("/video", { url }, signal),
  profile: (url: string, cursor?: string, signal?: AbortSignal) =>
    post<{ videos: VideoItem[]; nextCursor?: string; hasMore: boolean }>("/profile", { url, cursor, limit: 36 }, signal),
  createDownloadQueue: (videos: VideoItem[]) => post<{ queueId: string; status: string; selectedCount: number }>("/download-queue", { videos }),
  resolveQueueItem: (queueId: string, url: string) =>
    post<{ id: string; filename: string; downloadUrl?: string; title: string }>(`/download-queue/${queueId}/resolve`, { url }),
  queueEvent: (queueId: string, event: Record<string, unknown>) => post<void>(`/download-queue/${queueId}/events`, event),
  config: async () => {
    if (MOCK_API) return mockConfig();
    const response = await fetch(`${API_BASE}/config`, { next: { revalidate: 60 } });
    if (!response.ok && shouldUseLocalFallback(response.status)) return mockConfig();
    if (!response.ok) throw new Error("Remote config unavailable");
    return response.json() as Promise<PublicRuntimeConfig>;
  },
  metric: (point: MetricPoint) => {
    if (MOCK_API || (API_BASE === "/api" && typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname))) {
      return Promise.resolve();
    }
    return fetch(`${API_BASE}/metrics`, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(point)
    }).catch(() => undefined);
  },
  dashboard: async (token?: string) => {
    const response = await fetch(`${API_BASE}/admin/performance`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Dashboard unavailable");
    return response.json();
  }
};

function shouldUseLocalFallback(status: number) {
  return (
    status === 404 &&
    API_BASE === "/api" &&
    typeof window !== "undefined" &&
    LOCAL_HOSTS.has(window.location.hostname)
  );
}

function mockConfig(): PublicRuntimeConfig {
  return {
    ads: {
      adsense_enabled: false,
      adsense_client_id: "",
      banner_ad_unit: "",
      interstitial_ad_unit: "",
      rewarded_ad_unit: "",
      native_ad_unit: "",
      app_open_ad_unit: "",
      website_ads_enabled: false,
      mobile_ads_enabled: false,
      emergency_disable: true,
      interstitial_cooldown_seconds: 90,
      rewarded_cooldown_seconds: 60
    },
    features: {
      downloader_enabled: true,
      profile_downloader_enabled: true,
      maintenance_mode: false,
      queue_delay_min_ms: 5000,
      queue_delay_max_ms: 10000,
      scraping_fallback: "auto",
      force_update_min_version: "",
      latest_version: ""
    },
    updatedAt: new Date().toISOString()
  };
}

async function mockPost<T>(path: string, body: unknown): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 350));
  const input = body as { url?: string; videos?: VideoItem[] };
  const requestedUrl = input.url || "https://www.tiktok.com/@demo/video/123";
  const requestedId = requestedUrl.match(/\/video\/(\d+)/)?.[1] || "local-demo-video";
  const requestedUsername = requestedUrl.match(/@([^/?]+)/)?.[1] || "demo";

  if (path === "/video") {
    return {
      video: {
        id: requestedId,
        url: requestedUrl,
        title: `@${requestedUsername} local demo video`,
        username: requestedUsername,
        thumbnailUrl: mockThumbnail(requestedUsername, 1),
        downloadUrl: mockDownloadUrl(requestedUrl),
        noWatermarkUrl: mockDownloadUrl(requestedUrl)
      }
    } as T;
  }

  if (path === "/profile") {
    const username = requestedUsername;
    const videos = Array.from({ length: 36 }, (_, index) => ({
      id: `local-profile-${index + 1}`,
      url: `https://www.tiktok.com/@${username}/video/${index + 1}`,
      title: `@${username} local video ${index + 1}`,
      username,
      thumbnailUrl: mockThumbnail(username, index + 1),
      downloadUrl: mockDownloadUrl(`https://www.tiktok.com/@${username}/video/${index + 1}`)
    }));
    return { videos, hasMore: false } as T;
  }

  if (path === "/download-queue") {
    return { queueId: "local-demo-queue", status: "ready", selectedCount: input.videos?.length || 0 } as T;
  }

  if (path.includes("/resolve")) {
    const id = requestedUrl.match(/\/video\/(\d+)/)?.[1] || "local-demo-video";
    return {
      id,
      filename: `${requestedUsername}-${id}.mp4`,
      title: `@${requestedUsername} local video ${id}`,
      downloadUrl: mockDownloadUrl(requestedUrl)
    } as T;
  }

  return undefined as T;
}

function mockDownloadUrl(url: string) {
  const body = `Local demo download for ${url}\n\nSet NEXT_PUBLIC_API_BASE_URL to your Firebase Functions API for real TikTok downloads.`;
  return `data:video/mp4;charset=utf-8,${encodeURIComponent(body)}`;
}

function mockThumbnail(username: string, index: number) {
  const hue = (index * 37) % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue}, 78%, 56%)"/>
          <stop offset="55%" stop-color="hsl(${(hue + 80) % 360}, 76%, 48%)"/>
          <stop offset="100%" stop-color="#101214"/>
        </linearGradient>
      </defs>
      <rect width="360" height="520" rx="24" fill="url(#bg)"/>
      <circle cx="284" cy="86" r="42" fill="rgba(255,255,255,.18)"/>
      <rect x="34" y="300" width="292" height="126" rx="18" fill="rgba(255,255,255,.16)"/>
      <text x="34" y="88" fill="white" font-family="Arial, sans-serif" font-size="34" font-weight="700">TikTok</text>
      <text x="34" y="134" fill="white" font-family="Arial, sans-serif" font-size="24">@${escapeSvg(username)}</text>
      <text x="34" y="388" fill="white" font-family="Arial, sans-serif" font-size="46" font-weight="700">Video ${index}</text>
      <path d="M151 193v82l74-41-74-41Z" fill="white" opacity=".92"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeSvg(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] || char);
}
