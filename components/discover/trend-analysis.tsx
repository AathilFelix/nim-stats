"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { SurfaceCard, SectionLabel } from "./discover-primitives";

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
    <SurfaceCard className="p-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
        <DeltaSection label="Most Improved" entries={improved} accent="emerald" />
        <DeltaSection label="Most Degraded" entries={degraded} accent="red" />
        <DeltaSection label="Rising Congestion" entries={rising} accent="amber" />
        <DeltaSection label="Recovery Leaders" entries={recovering} accent="emerald" />
      </div>
    </SurfaceCard>
  );
}

function DeltaSection({ label, entries, accent }: DeltaProps) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="p-2 space-y-1">
      <span
        className={`block text-[10px] font-bold uppercase tracking-[0.08em] font-mono ${accentClass}`}
      >
        {label}
      </span>
      {entries.length === 0 ? (
        <p className="text-[11px] text-muted-foreground font-mono">No data</p>
      ) : (
        <div className="space-y-0.5">
          {entries.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-0.5"
            >
              <span className="truncate text-[11px] text-foreground">
                {m.name}
              </span>
              <span className="tabular-nums text-[10px] text-muted-foreground font-mono ml-2 shrink-0">
                {m.provider}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
