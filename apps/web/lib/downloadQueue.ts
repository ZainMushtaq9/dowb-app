import { api, VideoItem } from "./api";

export type QueueStatus = "waiting" | "downloading" | "paused" | "completed" | "failed" | "retrying" | "cancelled" | "network_waiting" | "skipped";

export interface QueueItem extends VideoItem {
  status: QueueStatus;
  retries: number;
  progress: number;
  filePath?: string;
  updatedAt: number;
  error?: string;
}

export interface QueueSnapshot {
  running: boolean;
  paused: boolean;
  currentIndex: number;
  items: QueueItem[];
}

type Listener = (snapshot: QueueSnapshot) => void;

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const randomDelay = () => 5000 + Math.floor(Math.random() * 5000);
const retryDelay = (attempt: number) => Math.min(5 * 60_000, 5000 * 2 ** attempt) + Math.floor(Math.random() * 1500);

export class BrowserDownloadQueue {
  private queueId = "";
  private items: QueueItem[] = [];
  private running = false;
  private paused = false;
  private cancelled = false;
  private currentIndex = 0;
  private listeners = new Set<Listener>();

  constructor() {
    window.addEventListener("online", () => {
      if (this.items.some((item) => item.status === "network_waiting")) this.resume();
    });
    const saved = localStorage.getItem("downloadQueue");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        queueId: string;
        items: QueueItem[];
        running: boolean;
        paused: boolean;
        currentIndex: number;
      };
      this.queueId = parsed.queueId;
      this.items = (parsed.items || []).map((item) =>
        item.status === "downloading" || item.status === "retrying" ? { ...item, status: "paused", updatedAt: Date.now() } : item
      );
      this.running = false;
      this.paused = parsed.paused ?? true;
      this.currentIndex = parsed.currentIndex || 0;
    } catch {
      localStorage.removeItem("downloadQueue");
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  async start(videos: VideoItem[]) {
    const uniqueVideos = Array.from(new Map(videos.map((video) => [video.url, video])).values());
    const queue = await api.createDownloadQueue(uniqueVideos);
    this.queueId = queue.queueId;
    this.items = uniqueVideos.map((video) => ({ ...video, status: "waiting", retries: 0, progress: 0, updatedAt: Date.now() }));
    this.running = true;
    this.paused = false;
    this.cancelled = false;
    this.currentIndex = 0;
    this.persist();
    this.emit();
    await this.run();
  }

  pause() {
    this.paused = true;
    this.items = this.items.map((item) => (item.status === "downloading" ? { ...item, status: "paused", updatedAt: Date.now() } : item));
    this.persist();
    this.emit();
  }

  resume() {
    if (!this.queueId || !this.items.length) return;
    const wasRunning = this.running;
    this.paused = false;
    this.cancelled = false;
    this.items = this.items.map((item) => (item.status === "paused" || item.status === "network_waiting" ? { ...item, status: "waiting", updatedAt: Date.now() } : item));
    if (!this.running) this.running = true;
    this.persist();
    this.emit();
    if (!wasRunning) void this.run();
  }

  cancel() {
    this.cancelled = true;
    this.running = false;
    this.paused = false;
    this.items = this.items.map((item) =>
      item.status === "completed" ? item : { ...item, status: "cancelled", updatedAt: Date.now() }
    );
    this.persist();
    this.emit();
  }

  retryFailed() {
    this.items = this.items.map((item) =>
      item.status === "failed" || item.status === "network_waiting"
        ? { ...item, status: "waiting", error: undefined, updatedAt: Date.now() }
        : item
    );
    this.running = true;
    this.cancelled = false;
    this.persist();
    this.emit();
    void this.run();
  }

  private async run() {
    if (!this.queueId) return;
    for (let index = this.currentIndex; index < this.items.length; index += 1) {
      if (this.cancelled) break;
      while (this.paused && !this.cancelled) await delay(400);
      this.currentIndex = index;
      const item = this.items[index];
      if (!item || item.status === "completed" || item.status === "skipped" || item.status === "cancelled") continue;
      await this.downloadWithRetry(index);
      if (index < this.items.length - 1) await delay(randomDelay());
    }
    this.running = false;
    this.persist();
    this.emit();
  }

  private async downloadWithRetry(index: number) {
    const maxRetries = 10;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        if (!navigator.onLine) {
          this.items[index] = { ...this.items[index], status: "network_waiting", retries: attempt, updatedAt: Date.now(), error: "Offline" };
          this.persist();
          this.emit();
          while (!navigator.onLine && !this.cancelled) await delay(1000);
        }
        this.items[index] = { ...this.items[index], status: attempt ? "retrying" : "downloading", retries: attempt, updatedAt: Date.now() };
        this.persist();
        this.emit();
        const resolved = await api.resolveQueueItem(this.queueId, this.items[index].url);
        if (!resolved.downloadUrl) throw new Error("No downloadable URL returned");
        this.triggerDownload(resolved.downloadUrl, resolved.filename);
        this.items[index] = { ...this.items[index], status: "completed", retries: attempt, progress: 100, filePath: resolved.filename, updatedAt: Date.now() };
        await api.queueEvent(this.queueId, { type: "success", videoId: this.items[index].id, retries: attempt });
        this.persist();
        this.emit();
        return;
      } catch (error) {
        if (attempt >= maxRetries) {
          this.items[index] = {
            ...this.items[index],
            status: "failed",
            retries: attempt,
            updatedAt: Date.now(),
            error: error instanceof Error ? error.message : "Download failed"
          };
          await api.queueEvent(this.queueId, { type: "failed", videoId: this.items[index].id, retries: attempt });
          this.persist();
          this.emit();
          return;
        }
        this.items[index] = {
          ...this.items[index],
          status: navigator.onLine ? "retrying" : "network_waiting",
          retries: attempt + 1,
          error: error instanceof Error ? error.message : "Download failed",
          updatedAt: Date.now()
        };
        this.persist();
        this.emit();
        await api.queueEvent(this.queueId, { type: "retry", videoId: this.items[index].id, retries: attempt + 1 }).catch(() => undefined);
        await delay(retryDelay(attempt));
      }
    }
  }

  private triggerDownload(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private snapshot(): QueueSnapshot {
    return {
      running: this.running,
      paused: this.paused,
      currentIndex: this.currentIndex,
      items: this.items
    };
  }

  private emit() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  private persist() {
    localStorage.setItem(
      "downloadQueue",
      JSON.stringify({
        queueId: this.queueId,
        items: this.items,
        running: this.running,
        paused: this.paused,
        currentIndex: this.currentIndex
      })
    );
  }
}
