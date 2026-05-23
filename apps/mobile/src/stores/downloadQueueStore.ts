import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";
import { api, VideoItem } from "@/services/api";
import { deleteCompletedQueueItems, listQueueItems, patchQueueItem, QueueRecord, upsertQueueItem } from "@/services/queueDatabase";
import { getQueueMeta, patchQueueMeta } from "@/services/queueMetaStorage";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const antiBlockDelay = () => 5000 + Math.floor(Math.random() * 5000);
const retryDelay = (attempt: number) => Math.min(300000, 5000 * 2 ** attempt) + Math.floor(Math.random() * 1500);

interface DownloadQueueState {
  items: QueueRecord[];
  running: boolean;
  hydrate: () => Promise<void>;
  enqueue: (videos: VideoItem[]) => Promise<void>;
  process: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  retryFailed: () => Promise<void>;
  cancelAll: () => void;
  clearCompleted: () => void;
}

export const useDownloadQueueStore = create<DownloadQueueState>((set, get) => ({
  items: [],
  running: false,
  hydrate: async () => {
    const items = listQueueItems();
    const meta = getQueueMeta();
    const recovering = items.some((item) => item.state === "downloading" || item.state === "retrying" || item.state === "network_waiting");
    for (const item of items) {
      if (item.state === "downloading" || item.state === "retrying" || item.state === "network_waiting") {
        patchQueueItem(item.id, { state: "waiting", lastError: "Recovered after app restart" });
      }
    }
    patchQueueMeta({
      lastRestoreAt: Date.now(),
      crashRecoveryCount: recovering ? meta.crashRecoveryCount + 1 : meta.crashRecoveryCount
    });
    set({ items: listQueueItems() });
  },
  enqueue: async (videos) => {
    const queue = await api.createDownloadQueue(videos);
    const now = Date.now();
    for (const video of videos) {
      upsertQueueItem({
        id: video.id,
        queueId: queue.queueId,
        videoUrl: video.url,
        filename: `${video.username || "tiktok"}-${video.id}.mp4`,
        title: video.title,
        state: "waiting",
        retryCount: 0,
        progress: 0,
        filePath: "",
        lastError: "",
        createdAt: now,
        updatedAt: now
      });
    }
    set({ items: listQueueItems() });
  },
  process: async () => {
    if (get().running) return;
    set({ running: true });
    patchQueueMeta({ lastRunAt: Date.now() });
    try {
      for (const item of listQueueItems()) {
        if (!["waiting", "failed", "retrying", "network_waiting"].includes(item.state)) continue;
        if ((await NetInfo.fetch()).isConnected === false) {
          patchQueueItem(item.id, { state: "network_waiting", lastError: "Offline" });
          set({ items: listQueueItems() });
          break;
        }

        let current = item;
        for (let attempt = current.retryCount; attempt <= 10; attempt += 1) {
          try {
            patchQueueItem(current.id, { state: attempt ? "retrying" : "downloading", retryCount: attempt, lastError: "" });
            set({ items: listQueueItems() });
            const resolved = await api.resolveQueueItem(current.queueId, current.videoUrl);
            if (!resolved.downloadUrl) throw new Error("No downloadable URL returned");
            const target = `${FileSystem.documentDirectory}${resolved.filename}`;
            const partial = await FileSystem.getInfoAsync(target);
            const download = FileSystem.createDownloadResumable(resolved.downloadUrl, target, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
              const progress = totalBytesExpectedToWrite ? Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100) : 0;
              patchQueueItem(current.id, { progress });
              set({ items: listQueueItems() });
            });
            const result = partial.exists ? await download.resumeAsync() : await download.downloadAsync();
            if (!result?.uri) throw new Error("Download did not finish");
            await MediaLibrary.requestPermissionsAsync();
            await MediaLibrary.saveToLibraryAsync(result.uri).catch(() => undefined);
            patchQueueItem(current.id, { state: "completed", progress: 100, filePath: result.uri, lastError: "" });
            await api.queueEvent(current.queueId, { type: "success", videoId: current.id, retries: attempt }).catch(() => undefined);
            set({ items: listQueueItems() });
            break;
          } catch (error) {
            const message = error instanceof Error ? error.message : "Download failed";
            if (attempt >= 10) {
              patchQueueItem(current.id, { state: "failed", retryCount: attempt, lastError: message });
              await api.queueEvent(current.queueId, { type: "failed", videoId: current.id, retries: attempt, error: message }).catch(() => undefined);
              set({ items: listQueueItems() });
              break;
            }
            patchQueueItem(current.id, { state: "retrying", retryCount: attempt + 1, lastError: message });
            set({ items: listQueueItems() });
            await delay(retryDelay(attempt));
            current = listQueueItems().find((next) => next.id === item.id) || current;
          }
        }
        await delay(antiBlockDelay());
      }
    } finally {
      set({ running: false, items: listQueueItems() });
    }
  },
  pause: () => {
    for (const item of listQueueItems()) {
      if (["waiting", "downloading", "retrying"].includes(item.state)) patchQueueItem(item.id, { state: "paused" });
    }
    set({ items: listQueueItems(), running: false });
  },
  resume: async () => {
    for (const item of listQueueItems()) {
      if (item.state === "paused" || item.state === "network_waiting") patchQueueItem(item.id, { state: "waiting" });
    }
    set({ items: listQueueItems() });
  },
  retryFailed: async () => {
    for (const item of listQueueItems()) {
      if (item.state === "failed") patchQueueItem(item.id, { state: "waiting", lastError: "" });
    }
    set({ items: listQueueItems() });
  },
  cancelAll: () => {
    for (const item of listQueueItems()) {
      if (item.state !== "completed") patchQueueItem(item.id, { state: "cancelled" });
    }
    set({ items: listQueueItems(), running: false });
  },
  clearCompleted: () => {
    deleteCompletedQueueItems();
    set({ items: listQueueItems() });
  }
}));
