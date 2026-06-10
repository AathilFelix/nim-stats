"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import {
  StatusDot,
  SectionLabel,
  FleetBar,
} from "./discover-primitives";
import { cn } from "@/lib/utils";

interface Props {
  models: NIMModel[];
}

export function FleetIntelligence({ models }: Props) {
  const stats = useMemo(() => {
    const healthy = models.filter((m) => m.status === "healthy").length;
    const busy = models.filter((m) => m.status === "busy").length;
    const jammed = models.filter((m) => m.status === "jammed").length;
    const avgReliability = models.reduce((acc, m) => acc + m.reliability, 0) / models.length;
    const avgCongestion = Math.round(models.reduce((acc, m) => acc + m.congestion, 0) / models.length);
    const degraded = busy + jammed;

    const congestionState =
      avgCongestion > 60 ? "Elevated" : avgCongestion > 35 ? "Moderate" : "Nominal";
    const congestionStatus: "healthy" | "busy" | "jammed" =
      avgCongestion > 60 ? "jammed" : avgCongestion > 35 ? "busy" : "healthy";

    return {
      healthy, busy, jammed, degraded,
      avgReliability, avgCongestion,
      congestionState, congestionStatus,
      total: models.length,
    };
  }, [models]);

  const fleetStatus: "healthy" | "busy" = stats.degraded > 0 ? "busy" : "healthy";
  const fleetLabel = stats.degraded > 0 ? "Fleet Degraded" : "Fleet Nominal";

  return (
    <div className="fleet-hero px-4 sm:px-5 py-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <StatusDot status={fleetStatus} size={10} />
          <span
            className={cn(
              "text-sm font-bold uppercase tracking-[0.10em] font-mono",
              fleetStatus === "busy" ? "text-[--status-warn]" : "text-[--status-healthy]",
            )}
          >
            {fleetLabel}
          </span>
        </div>
        <SectionLabel className="!text-xs">Live Telemetry</SectionLabel>
      </div>

      {/* Divider */}
      <div className="h-px bg-[--border-subtle] mb-3 relative z-10" />

      {/* Metric cluster */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 relative z-10">
        <HUDPill label="Endpoints" value={stats.total} status="healthy" />
        <span className="w-px h-7 bg-[--border-subtle] hidden sm:block" />
        <HUDPill
          label="Reliability"
          value={`${stats.avgReliability.toFixed(1)}%`}
          status={stats.avgReliability >= 99 ? "healthy" : stats.avgReliability >= 97 ? "busy" : "jammed"}
        />
        <span className="w-px h-7 bg-[--border-subtle] hidden sm:block" />
        <HUDPill label="Congestion" value={stats.congestionState} status={stats.congestionStatus} />
        {stats.degraded > 0 && (
          <>
            <span className="w-px h-7 bg-[--border-subtle] hidden sm:block" />
            <HUDPill label="Degraded" value={stats.degraded} status="jammed" />
          </>
        )}
      </div>

      {/* Fleet composition bar */}
      <div className="mt-3 relative z-10 flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[--text-tertiary] font-mono shrink-0">
          Fleet
        </span>
        <FleetBar healthy={stats.healthy} busy={stats.busy} jammed={stats.jammed} className="flex-1 max-w-[200px]" />
        <div className="flex items-center gap-2 text-xs font-mono text-[--text-tertiary]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[--status-healthy]" />
            {stats.healthy}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[--status-warn]" />
            {stats.busy}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[--status-critical]" />
            {stats.jammed}
          </span>
        </div>
      </div>
    </div>
  );
}

function HUDPill({
  label,
  value,
  status = "healthy",
}: {
  label: string;
  value: string | number;
  status?: "healthy" | "busy" | "jammed";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn(
        "metric-xl tabular-nums",
        status === "healthy" && "text-[--status-healthy]",
        status === "busy" && "text-[--status-warn]",
        status === "jammed" && "text-[--status-critical]",
      )}>
        {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value}
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[--text-tertiary] font-mono">
        {label}
      </span>
    </div>
  );
}
