"use client";

import { Activity, AlertTriangle, BadgePercent, Clock, DownloadCloud, Globe2, Megaphone, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PerformanceDashboard() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Record<string, number | string> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setData(await api.dashboard(token).catch((err) => {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
        return null;
      }));
    };
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [token]);

  const cards: Array<{ label: string; value: string; Icon: LucideIcon }> = data
    ? [
        { label: "API", value: `${data.averageApiMs || 0}ms`, Icon: Activity },
        { label: "Startup", value: `${data.averageStartupMs || 0}ms`, Icon: Clock },
        { label: "Queue", value: `${data.activeQueueSize || 0}`, Icon: DownloadCloud },
        { label: "Failures", value: `${data.downloadFailures || 0}`, Icon: AlertTriangle },
        { label: "Success", value: `${data.downloadSuccessRate || 0}%`, Icon: BadgePercent },
        { label: "Scraping", value: `${data.scrapingSuccessRate || 0}%`, Icon: Globe2 },
        { label: "Retries", value: `${data.retryReports || 0}`, Icon: Smartphone },
        { label: "Ads", value: `${data.adImpressions || 0}`, Icon: Megaphone }
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Performance Dashboard</h1>
      <div className="mt-4 flex gap-2">
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Admin dashboard token"
          className="h-11 flex-1 rounded border border-black/10 px-3"
        />
      </div>
      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon }) => (
          <section key={label} className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
            <Icon size={18} />
            <p className="mt-3 text-sm text-black/60">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </section>
        ))}
      </div>
      {data ? <pre className="mt-5 overflow-auto rounded bg-ink p-4 text-xs text-white">{JSON.stringify(data, null, 2)}</pre> : null}
    </main>
  );
}
