"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { StatusDotCircle, MetricPill } from "./discover-primitives";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface RankCardProps {
  model: NIMModel;
  headlineMetric: { value: string; label: string };
  secondaryMetrics: { value: string; label: string }[];
  historyData: number[];
  selected?: boolean;
  onSelect: (model: NIMModel) => void;
}

export function RankCard({
  model,
  headlineMetric,
  secondaryMetrics,
  historyData,
  selected,
  onSelect,
}: RankCardProps) {
  const statusColor = getStatusColor(model.status);
  const isHealthy = model.status === "healthy";

  return (
    <button
      onClick={() => onSelect(model)}
      aria-pressed={selected}
      className={`
        relative w-[220px] shrink-0 rounded-lg text-left transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
        ${selected ? "shadow-md" : "shadow-sm"}
      `}
      style={{
        backgroundColor: selected ? "var(--surface-elevated)" : "var(--surface-card)",
        border: `1px solid ${selected ? statusColor : "var(--border-subtle)"}`,
      }}
    >
      {selected && (
        <div
          className="absolute inset-x-3 top-0 h-px rounded-full"
          style={{ background: `linear-gradient(to right, transparent, ${statusColor}50, transparent)` }}
        />
      )}
      <CardHeader className="px-3.5 pt-3.5 pb-0 space-y-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-sm">{model.name}</CardTitle>
            <p className="truncate text-xs text-muted-foreground font-mono mt-0.5">{model.provider}</p>
          </div>
          <StatusDotCircle status={model.status} />
        </div>
      </CardHeader>

      <CardContent className="px-3.5 py-3">
        <div>
          <p
            className="tabular-nums tracking-tight leading-none font-mono font-semibold text-foreground"
            style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}
          >
            {headlineMetric.value}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
            {headlineMetric.label}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {secondaryMetrics.map((m) => (
            <MetricPill key={m.label} value={m.value} label={m.label} intent={isHealthy ? "muted" : "default"} />
          ))}
        </div>
      </CardContent>

      <CardFooter className="px-3.5 pb-3.5 pt-0">
        <HorizontalSparkline data={historyData} color={statusColor} width={186} height={24} />
      </CardFooter>
    </button>
  );
}
