import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "download-queue-meta" });

export interface QueueMeta {
  lastRestoreAt: number;
  lastRunAt: number;
  crashRecoveryCount: number;
}

const KEY = "queue-meta";

export function getQueueMeta(): QueueMeta {
  const raw = storage.getString(KEY);
  if (!raw) return { lastRestoreAt: 0, lastRunAt: 0, crashRecoveryCount: 0 };
  try {
    return JSON.parse(raw) as QueueMeta;
  } catch {
    return { lastRestoreAt: 0, lastRunAt: 0, crashRecoveryCount: 0 };
  }
}

export function patchQueueMeta(patch: Partial<QueueMeta>) {
  storage.set(KEY, JSON.stringify({ ...getQueueMeta(), ...patch }));
}
