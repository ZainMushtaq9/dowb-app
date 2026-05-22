export const env = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:3000",
  storageBucket: process.env.STORAGE_BUCKET || "",
  taskQueueLocation: process.env.TASK_QUEUE_LOCATION || "us-central1",
  maxProfileVideos: Number(process.env.MAX_PROFILE_VIDEOS || 2500),
  bulkChunkSize: Number(process.env.BULK_CHUNK_SIZE || 100),
  bulkConcurrency: Number(process.env.BULK_CONCURRENCY || 2),
  cacheTtlSeconds: Number(process.env.TIKTOK_CACHE_TTL_SECONDS || 1800),
  signedUrlTtlMinutes: Number(process.env.SIGNED_URL_TTL_MINUTES || 60),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  alertEmailWebhookUrl: process.env.ALERT_EMAIL_WEBHOOK_URL || "",
  adminDashboardToken: process.env.ADMIN_DASHBOARD_TOKEN || ""
};
