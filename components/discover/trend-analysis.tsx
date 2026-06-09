"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { SectionLabel, SurfaceCard } from "./discover-primitives";

interface Props {
  models: NIMModel[];
}

interface DeltaProps {
  label: string;
  entries: NIMModel[];
  accent: "emerald" | "amber" | "red";
}

export function TrendAnalysis({ models }: Props) {
  const improved = [...models]
    .sort((a, b) => b.reliability - a.reliability)
    .slice(0, 3);
  const degraded = models
    .filter((m) => m.status === "jammed" || m.congestion > 60)
    .slice(0, 3);
  const rising = models
    .filter(
      (m) =>
        m.congestionTrend === "worsening" ||
        m.congestionTrend === "rapidly_increasing",
    )
    .slice(0, 3);
  const recovering = models
    .filter((m) => m.congestionTrend === "improving" && m.status === "healthy")
    .slice(0, 3);

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <SectionLabel>Trend Analysis</SectionLabel>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border">
        <DeltaSection label="Most Improved" entries={improved} accent="emerald" />
        <DeltaSection label="Most Degraded" entries={degraded} accent="red" />
        <DeltaSection label="Rising Congestion" entries={rising} accent="amber" />
        <DeltaSection label="Recovery Leaders" entries={recovering} accent="emerald" />
      </div>
    </SurfaceCard>
  );
}

function DeltaSection({ label, entries, accent }: DeltaProps) {
  const accentToken =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="p-3">
      <span
        className={cn(
          "block mb-2 text-[10px] font-bold uppercase tracking-[0.1em] font-mono",
          accentToken,
        )}
      >
        {label}
      </span>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground font-mono">No data</p>
      ) : (
        <div className="space-y-1">
          {entries.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-1 px-2 rounded-md bg-muted"
            >
              <span className="truncate text-xs font-medium text-foreground">
                {m.name}
              </span>
              <span className="tabular-nums text-[11px] text-muted-foreground font-mono ml-2 shrink-0">
                {m.provider}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
