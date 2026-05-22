"use client";

import { Download, Gauge, Moon, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { FixedSizeGrid as Grid } from "react-window";
import { api, VideoItem } from "@/lib/api";
import { BrowserDownloadQueue, QueueSnapshot } from "@/lib/downloadQueue";
import { AdSlot } from "./AdSlot";

type Mode = "video" | "profile";

export function DownloaderApp() {
  const [mode, setMode] = useState<Mode>("video");
  const [url, setUrl] = useState("");
  const [single, setSingle] = useState<VideoItem | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [queueSnapshot, setQueueSnapshot] = useState<QueueSnapshot>({ running: false, paused: false, currentIndex: 0, items: [] });
  const [message, setMessage] = useState("");
  const [dark, setDark] = useState(false);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<BrowserDownloadQueue | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    queueRef.current = new BrowserDownloadQueue();
    return queueRef.current.subscribe(setQueueSnapshot);
  }, []);

  const selectedVideos = useMemo(() => videos.filter((video) => selected.has(video.id)), [videos, selected]);

  function detectMode(value: string): Mode | null {
    if (!value.includes("tiktok.com")) return null;
    return /\/video\/\d+/.test(value) ? "video" : "profile";
  }

  async function submit(nextCursor?: string) {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setMessage("");
    if (!url.includes("tiktok.com")) {
      setMessage("Paste a valid public TikTok URL.");
      return;
    }
    const detectedMode = detectMode(url);
    if (!nextCursor && detectedMode && detectedMode !== mode) setMode(detectedMode);
    const requestMode = nextCursor ? mode : detectedMode || mode;

    startTransition(async () => {
      try {
        if (requestMode === "video") {
          const result = await api.video(url, abortRef.current?.signal);
          setSingle(result.video);
        } else {
          const result = await api.profile(url, nextCursor, abortRef.current?.signal);
          setVideos((current) => {
            const merged = nextCursor ? [...current, ...result.videos] : result.videos;
            setSelected((previous) => {
              if (!nextCursor) return new Set(merged.map((video) => video.id));
              const next = new Set(previous);
              for (const video of result.videos) next.add(video.id);
              return next;
            });
            return merged;
          });
          setCursor(result.nextCursor);
          setHasMore(result.hasMore);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to process this URL.");
      }
    });
  }

  async function startQueue() {
    setMessage("");
    if (!selectedVideos.length) {
      setMessage("Select at least one video to start the download queue.");
      return;
    }
    setMessage(`Download queue started for ${selectedVideos.length} videos.`);
    try {
      await queueRef.current?.start(selectedVideos);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start the download queue.");
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/website-logo.png" alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-normal sm:text-4xl">TikTok Downloader</h1>
              <p className="mt-1 max-w-2xl text-sm text-black/65 dark:text-white/65">
                Fast public video and profile downloads with sequential queue downloading.
              </p>
            </div>
          </div>
          <button
            aria-label="Toggle theme"
            className="grid h-11 w-11 place-items-center rounded border border-black/10 bg-white shadow-soft dark:border-white/10 dark:bg-white/10"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>

        <div className="rounded-lg border border-black/10 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-white/5">
          <div className="grid grid-cols-2 gap-2 rounded bg-black/5 p-1 dark:bg-white/10">
            {(["video", "profile"] as Mode[]).map((item) => (
              <button
                key={item}
                className={`h-10 rounded text-sm font-medium ${mode === item ? "bg-ink text-white dark:bg-paper dark:text-ink" : ""}`}
                onClick={() => setMode(item)}
              >
                {item === "video" ? "Single Video" : "Profile Downloader"}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={mode === "video" ? "https://www.tiktok.com/@username/video/123" : "https://www.tiktok.com/@username"}
              className="h-12 min-w-0 flex-1 rounded border border-black/10 bg-paper px-3 outline-none focus:border-mint dark:border-white/15 dark:bg-black/25"
            />
            <button
              onClick={() => submit()}
              disabled={isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded bg-coral px-5 font-semibold text-white disabled:opacity-60"
            >
              <Search size={18} /> {isPending ? "Loading" : "Download"}
            </button>
          </div>
          {message ? <p className="mt-2 text-sm text-coral">{message}</p> : null}
        </div>

        <AdSlot slot="1234567890" />

        {mode === "video" && single ? <SingleVideo video={single} /> : null}
        {queueSnapshot.items.length ? <QueuePanel snapshot={queueSnapshot} queue={queueRef.current} /> : null}

        {mode === "profile" && videos.length ? (
          <ProfileGrid
            videos={videos}
            selected={selected}
            setSelected={setSelected}
            selectedCount={selectedVideos.length}
            onLoadMore={() => cursor && submit(cursor)}
            hasMore={hasMore}
            onStartQueue={startQueue}
            queueRunning={queueSnapshot.running}
          />
        ) : null}
      </section>
    </main>
  );
}

function SingleVideo({ video }: { video: VideoItem }) {
  return (
    <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/5 sm:grid-cols-[160px_1fr]">
      <div className="aspect-[9/12] overflow-hidden rounded bg-black/10">
        <img alt="" src={video.thumbnailUrl || "/video-thumbnail.svg"} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold">{video.title}</h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">@{video.username}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {video.noWatermarkUrl ? <DownloadLink href={video.noWatermarkUrl} label="No Watermark" /> : null}
          {video.downloadUrl ? <DownloadLink href={video.downloadUrl} label="HD Download" /> : null}
        </div>
      </div>
    </section>
  );
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="inline-flex h-11 items-center gap-2 rounded bg-ink px-4 text-sm font-semibold text-white dark:bg-paper dark:text-ink">
      <Download size={17} /> {label}
    </a>
  );
}

function ProfileGrid({
  videos,
  selected,
  setSelected,
  selectedCount,
  onLoadMore,
  hasMore,
  onStartQueue,
  queueRunning
}: {
  videos: VideoItem[];
  selected: Set<string>;
  setSelected: (value: Set<string>) => void;
  selectedCount: number;
  onLoadMore: () => void;
  hasMore: boolean;
  onStartQueue: () => void;
  queueRunning: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    if (!containerRef.current) return;
    const resize = () => {
      const next = Math.max(280, Math.floor(containerRef.current?.clientWidth || 360));
      setWidth(next);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const columns = width < 430 ? 1 : width < 700 ? 2 : Math.max(3, Math.floor(width / 180));
  const rows = Math.ceil(videos.length / columns);
  const columnWidth = Math.floor(width / columns);
  const rowHeight = width < 430 ? 304 : 252;

  return (
    <section className="overflow-hidden rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={selectedCount === videos.length}
            onChange={(event) => setSelected(event.target.checked ? new Set(videos.map((video) => video.id)) : new Set())}
          />
          Select All ({selectedCount}/{videos.length})
        </label>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {hasMore ? (
            <button onClick={onLoadMore} className="h-11 rounded border border-black/10 px-3 text-sm dark:border-white/15">
              Load More
            </button>
          ) : null}
          <button
            type="button"
            onClick={onStartQueue}
            disabled={!selectedCount || queueRunning}
            className="relative z-10 h-12 w-full cursor-pointer rounded bg-coral px-4 text-sm font-semibold text-white shadow-soft hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {queueRunning ? "Queue Running" : "Download Selected"}
          </button>
        </div>
      </div>
      <div ref={containerRef} className="w-full overflow-hidden">
        <Grid columnCount={columns} columnWidth={columnWidth} height={620} rowCount={rows} rowHeight={rowHeight} width={width}>
          {({ columnIndex, rowIndex, style }) => {
            const video = videos[rowIndex * columns + columnIndex];
            if (!video) return null;
            return (
              <div style={style} className="p-1.5">
                <label className="block h-full rounded border border-black/10 p-2 dark:border-white/10">
                  <div className="aspect-[9/11] overflow-hidden rounded bg-black/10">
                    <img src={video.thumbnailUrl || "/video-thumbnail.svg"} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(video.id)}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) next.add(video.id);
                        else next.delete(video.id);
                        setSelected(next);
                      }}
                    />
                    <span className="truncate text-xs">{video.title}</span>
                  </div>
                </label>
              </div>
            );
          }}
        </Grid>
      </div>
    </section>
  );
}

function QueuePanel({ snapshot, queue }: { snapshot: QueueSnapshot; queue: BrowserDownloadQueue | null }) {
  const complete = snapshot.items.filter((item) => item.status === "completed").length;
  const failed = snapshot.items.filter((item) => item.status === "failed").length;
  const active = snapshot.items[snapshot.currentIndex];

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Gauge size={18} /> Downloading {Math.min(snapshot.currentIndex + 1, snapshot.items.length)} of {snapshot.items.length}
          </div>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {complete} complete, {failed} failed {active ? `, current: ${active.title}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => queue?.pause()} className="h-10 rounded border border-black/10 px-3 text-sm dark:border-white/15">
            Pause
          </button>
          <button onClick={() => queue?.resume()} className="h-10 rounded border border-black/10 px-3 text-sm dark:border-white/15">
            Resume
          </button>
          <button onClick={() => queue?.cancel()} className="h-10 rounded border border-black/10 px-3 text-sm dark:border-white/15">
            Cancel
          </button>
          <button onClick={() => queue?.retryFailed()} className="h-10 rounded bg-ink px-3 text-sm text-white dark:bg-paper dark:text-ink">
            Retry Failed
          </button>
        </div>
      </div>
      <div className="mt-3 max-h-72 overflow-auto rounded border border-black/10 dark:border-white/10">
        {snapshot.items.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[56px_minmax(0,1fr)] gap-2 border-b border-black/5 px-3 py-2 text-sm last:border-b-0 dark:border-white/10 sm:grid-cols-[64px_minmax(0,1fr)_auto]"
          >
            <span className="self-center font-semibold text-black/70 dark:text-white/70">{queueLabel(item.status, item.progress)}</span>
            <div className="min-w-0 self-center">
              <div className="truncate">{item.title}</div>
              {item.error ? <div className="truncate text-xs text-coral">{item.error}</div> : null}
            </div>
            <div className="col-span-2 flex flex-wrap items-center gap-1 sm:col-span-1 sm:justify-end">
              {item.status === "downloading" || item.status === "retrying" || item.status === "waiting" || item.status === "network_waiting" ? (
                <button onClick={() => queue?.pauseItem(item.id)} className="h-8 rounded border border-black/10 px-2 text-xs dark:border-white/15">
                  Pause
                </button>
              ) : null}
              {item.status === "paused" || item.status === "network_waiting" ? (
                <button onClick={() => queue?.resumeItem(item.id)} className="h-8 rounded border border-black/10 px-2 text-xs dark:border-white/15">
                  Resume
                </button>
              ) : null}
              {item.status === "failed" || item.status === "cancelled" || item.status === "skipped" ? (
                <button onClick={() => queue?.retryItem(item.id)} className="h-8 rounded bg-ink px-2 text-xs text-white dark:bg-paper dark:text-ink">
                  Retry
                </button>
              ) : null}
              {item.status !== "completed" && item.status !== "skipped" ? (
                <button onClick={() => queue?.skipItem(item.id)} className="h-8 rounded border border-black/10 px-2 text-xs dark:border-white/15">
                  Skip
                </button>
              ) : null}
              <span className="ml-auto min-w-5 text-right text-xs text-black/50 dark:text-white/50 sm:ml-1">{index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function queueLabel(status: string, progress: number) {
  if (status === "completed") return "OK";
  if (status === "downloading") return `${progress || 0}%`;
  if (status === "retrying") return "RETRY";
  if (status === "network_waiting") return "NET";
  if (status === "failed") return "ERR";
  if (status === "paused") return "PAUSE";
  if (status === "cancelled") return "CANCEL";
  if (status === "skipped") return "SKIP";
  return "WAIT";
}
