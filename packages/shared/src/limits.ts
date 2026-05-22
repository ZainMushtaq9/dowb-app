export const limits = {
  maxProfileVideos: 2500,
  maxBulkSelection: 2000,
  bulkChunkSize: 100,
  apiTimeoutMs: 25000,
  scraperTimeoutMs: 45000,
  tiktokDelayMinMs: 5000,
  tiktokDelayMaxMs: 10000,
  profilePageSize: 36,
  signedUrlTtlMinutes: 60
} as const;

export const cacheKeys = {
  video: (id: string) => `video:${id}`,
  profile: (username: string) => `profile:${username.toLowerCase()}`,
  metricsMinute: (minute: string) => `metrics:${minute}`
};
