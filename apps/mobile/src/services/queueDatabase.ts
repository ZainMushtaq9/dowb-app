import * as SQLite from "expo-sqlite";

export type QueueState = "waiting" | "downloading" | "paused" | "completed" | "failed" | "retrying" | "cancelled" | "network_waiting";

export interface QueueRecord {
  id: string;
  queueId: string;
  videoUrl: string;
  filename: string;
  title: string;
  state: QueueState;
  retryCount: number;
  progress: number;
  filePath: string;
  lastError: string;
  createdAt: number;
  updatedAt: number;
}

const db = SQLite.openDatabaseSync("download-queue.db");

export function initializeQueueDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS queue_items (
      id TEXT PRIMARY KEY NOT NULL,
      queue_id TEXT NOT NULL,
      video_url TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      title TEXT NOT NULL,
      state TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      file_path TEXT NOT NULL DEFAULT '',
      last_error TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS queue_items_state_idx ON queue_items(state, updated_at);
  `);
}

export function listQueueItems() {
  initializeQueueDatabase();
  return db.getAllSync<QueueRecord>(
    `SELECT id, queue_id as queueId, video_url as videoUrl, filename, title, state, retry_count as retryCount,
      progress, file_path as filePath, last_error as lastError, created_at as createdAt, updated_at as updatedAt
     FROM queue_items ORDER BY created_at ASC`
  );
}

export function upsertQueueItem(item: QueueRecord) {
  initializeQueueDatabase();
  db.runSync(
    `INSERT INTO queue_items (id, queue_id, video_url, filename, title, state, retry_count, progress, file_path, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(video_url) DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at`,
    item.id,
    item.queueId,
    item.videoUrl,
    item.filename,
    item.title,
    item.state,
    item.retryCount,
    item.progress,
    item.filePath,
    item.lastError,
    item.createdAt,
    item.updatedAt
  );
}

export function patchQueueItem(id: string, patch: Partial<QueueRecord>) {
  const existing = listQueueItems().find((item) => item.id === id);
  if (!existing) return;
  const next = { ...existing, ...patch, updatedAt: Date.now() };
  db.runSync(
    `UPDATE queue_items SET state = ?, retry_count = ?, progress = ?, file_path = ?, last_error = ?, updated_at = ? WHERE id = ?`,
    next.state,
    next.retryCount,
    next.progress,
    next.filePath,
    next.lastError,
    next.updatedAt,
    id
  );
}

export function deleteCompletedQueueItems() {
  initializeQueueDatabase();
  db.runSync(`DELETE FROM queue_items WHERE state = 'completed'`);
}
