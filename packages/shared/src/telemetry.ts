export type TelemetryEvent =
  | "app_startup"
  | "api_latency"
  | "download_speed"
  | "queue_download"
  | "memory_usage"
  | "frame_drop"
  | "screen_render"
  | "app_freeze"
  | "network_latency"
  | "scroll_performance"
  | "queue_delay"
  | "queue_retry"
  | "scraper_blocked"
  | "scraper_success"
  | "download_success"
  | "download_failure"
  | "download_retry"
  | "queue_overload"
  | "ad_impression"
  | "web_error";

export interface MetricPoint {
  event: TelemetryEvent;
  value: number;
  unit: "ms" | "bytes" | "mb" | "fps" | "count" | "percent" | "kbps";
  route?: string;
  deviceClass?: "low" | "mid" | "high" | "web";
  tags?: Record<string, string | number | boolean>;
  createdAt?: string;
}

export interface AlertPayload {
  title: string;
  severity: "info" | "warning" | "critical";
  source: "web" | "mobile" | "functions" | "queue" | "scraper";
  message: string;
  affectedUsers?: number;
  tags?: Record<string, string | number | boolean>;
}
