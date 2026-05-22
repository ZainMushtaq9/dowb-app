import Constants from "expo-constants";

const apiBaseUrl = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) || "http://localhost:5001/api";

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  username: string;
  thumbnailUrl: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Request failed");
  return response.json() as Promise<T>;
}

export const api = {
  config: async () => {
    const response = await fetch(`${apiBaseUrl}/config`);
    if (!response.ok) throw new Error("Remote config unavailable");
    return response.json();
  },
  createDownloadQueue: (videos: VideoItem[]) => post<{ queueId: string }>("/download-queue", { videos }),
  resolveQueueItem: (queueId: string, url: string) =>
    post<{ id: string; filename: string; downloadUrl?: string; title: string }>(`/download-queue/${queueId}/resolve`, { url }),
  queueEvent: (queueId: string, event: Record<string, unknown>) => post<void>(`/download-queue/${queueId}/events`, event)
};
