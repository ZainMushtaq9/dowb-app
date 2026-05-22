import type { MetricPoint } from "@tiktok-downloader/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

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

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Request failed");
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
  metric: (point: MetricPoint) =>
    fetch(`${API_BASE}/metrics`, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(point)
    }).catch(() => undefined),
  dashboard: async (token?: string) => {
    const response = await fetch(`${API_BASE}/admin/performance`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Dashboard unavailable");
    return response.json();
  }
};
