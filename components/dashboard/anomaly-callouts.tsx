"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnomalyResult } from "@/lib/dashboard-data";

function useAnomalies() {
  const [data, setData] = useState<AnomalyResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/fleet/anomalies");
        if (!res.ok) return;
        const json = await res.json() as AnomalyResult[];
        if (!cancelled) setData(json);
      } catch {
        // silent — anomaly panel is non-critical
      }
    }
    void load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return data;
}

export function AnomalyCallouts() {
  const anomalies = useAnomalies();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!anomalies || anomalies.length === 0) return null;

  const visible = anomalies.filter((a) => !dismissed.has(a.modelId));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-status-warn" />
        <span className="label-xs text-text-tertiary uppercase tracking-wider">
          Anomaly detection · {visible.length} flagged
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <AnomalyCard
            key={a.modelId}
            anomaly={a}
            onDismiss={() => setDismissed((prev) => new Set([...prev, a.modelId]))}
          />
        ))}
      </div>
    </div>
  );
}

function AnomalyCard({ anomaly: a, onDismiss }: { anomaly: AnomalyResult; onDismiss: () => void }) {
  const isBoth = a.kind === "both";
  const isLatency = a.kind === "latency_spike" || isBoth;
  const isReliability = a.kind === "reliability_drop" || isBoth;

  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 space-y-2",
        isBoth
          ? "border-status-critical/30 bg-status-critical/5"
          : "border-status-warn/30 bg-status-warn/5",
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss anomaly"
        className="absolute right-2 top-2 text-text-quaternary hover:text-text-tertiary transition-colors"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="pr-4">
        <p className="body-sm font-semibold text-text-primary leading-tight">{a.name}</p>
        <p className="metric-xs text-text-quaternary">{a.provider}</p>
      </div>

      <div className="space-y-1">
        {isLatency && a.recentTtft != null && a.baselineTtft != null && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-status-warn flex-shrink-0" />
            <span className="metric-xs text-text-secondary">
              TTFT&nbsp;
              <span className="text-status-warn font-semibold">{a.recentTtft}ms</span>
              <span className="text-text-quaternary"> vs {a.baselineTtft}ms baseline</span>
            </span>
          </div>
        )}
        {isReliability && a.recentUptime != null && a.baselineUptime != null && (
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3 w-3 text-status-critical flex-shrink-0" />
            <span className="metric-xs text-text-secondary">
              Uptime&nbsp;
              <span className="text-status-critical font-semibold">{a.recentUptime}%</span>
              <span className="text-text-quaternary"> vs {a.baselineUptime}% baseline</span>
            </span>
          </div>
        )}
      </div>

      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 label-xs font-medium",
          isBoth
            ? "bg-status-critical/15 text-status-critical"
            : isLatency
              ? "bg-status-warn/15 text-status-warn"
              : "bg-status-critical/15 text-status-critical",
        )}
      >
        {isBoth ? "Latency + reliability" : isLatency ? "Latency spike" : "Reliability drop"}
      </span>
    </div>
  );
}
