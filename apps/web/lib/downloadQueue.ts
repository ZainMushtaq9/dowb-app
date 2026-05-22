import { api, VideoItem } from "./api";

export type QueueStatus = "waiting" | "downloading" | "success" | "failed" | "skipped";

export interface QueueItem extends VideoItem {
  status: QueueStatus;
  retries: number;
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

export class BrowserDownloadQueue {
  private queueId = "";
  private items: QueueItem[] = [];
  private running = false;
  private paused = false;
  private cancelled = false;
  private currentIndex = 0;
  private listeners = new Set<Listener>();

  constructor() {
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
      this.items = parsed.items || [];
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
    return () => this.listeners.delete(listener);
  }

  async start(videos: VideoItem[]) {
    const queue = await api.createDownloadQueue(videos);
    this.queueId = queue.queueId;
    this.items = videos.map((video) => ({ ...video, status: "waiting", retries: 0 }));
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
    this.persist();
    this.emit();
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
    this.persist();
    this.emit();
    void this.run();
  }

  cancel() {
    this.cancelled = true;
    this.running = false;
    this.paused = false;
    this.persist();
    this.emit();
  }

  retryFailed() {
    this.items = this.items.map((item) => (item.status === "failed" ? { ...item, status: "waiting", error: undefined } : item));
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
      if (!item || item.status === "success" || item.status === "skipped") continue;
      await this.downloadWithRetry(index);
      if (index < this.items.length - 1) await delay(randomDelay());
    }
    this.running = false;
    this.persist();
    this.emit();
  }

  private async downloadWithRetry(index: number) {
    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        this.items[index] = { ...this.items[index], status: "downloading", retries: attempt };
        this.persist();
        this.emit();
        const resolved = await api.resolveQueueItem(this.queueId, this.items[index].url);
        if (!resolved.downloadUrl) throw new Error("No downloadable URL returned");
        this.triggerDownload(resolved.downloadUrl, resolved.filename);
        this.items[index] = { ...this.items[index], status: "success", retries: attempt };
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
            error: error instanceof Error ? error.message : "Download failed"
          };
          await api.queueEvent(this.queueId, { type: "failed", videoId: this.items[index].id, retries: attempt });
          this.persist();
          this.emit();
          return;
        }
        await delay(1000 * 2 ** attempt);
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
