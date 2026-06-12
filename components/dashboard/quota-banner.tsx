"use client";

import { useEffect, useState } from "react";
import { Gauge, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuotaStats } from "@/lib/dashboard-data";

function useQuota() {
  const [data, setData] = useState<QuotaStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/fleet/quota");
        if (!res.ok) return;
        const json = await res.json() as QuotaStats;
        if (!cancelled) setData(json);
      } catch { /* silent */ }
    }
    void load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return data;
}

export function QuotaBanner() {
  const quota = useQuota();
  const [dismissed, setDismissed] = useState(false);

  if (!quota || quota.rateLimitPct < 5 || dismissed) return null;

  const isHigh = quota.rateLimitPct >= 20;
  const fillWidth = Math.min(100, quota.rateLimitPct);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        isHigh
          ? "border-status-critical/30 bg-status-critical/5"
          : "border-status-warn/30 bg-status-warn/5",
      )}
    >
      <Gauge className={cn("h-4 w-4 mt-0.5 flex-shrink-0", isHigh ? "text-status-critical" : "text-status-warn")} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="body-sm text-text-primary">
          <span className="font-semibold">
            {quota.rateLimitPct}% of probes rate-limited
          </span>
          {" "}in the {quota.windowLabel} —{" "}
          <span className="text-text-tertiary">
            {quota.rateLimitCount}/{quota.totalProbes} requests returned 429. Some &ldquo;model down&rdquo; readings may be throttling, not actual failures.
          </span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-border-subtle rounded-full overflow-hidden max-w-[120px]">
            <div
              className={cn("h-full rounded-full transition-all", isHigh ? "bg-status-critical" : "bg-status-warn")}
              style={{ width: `${fillWidth}%` }}
            />
          </div>
          <span className="metric-xs text-text-quaternary">NIM free tier: 40 req/min</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss rate limit warning"
        className="text-text-quaternary hover:text-text-tertiary transition-colors flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
