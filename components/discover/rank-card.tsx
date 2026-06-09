"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { StatusDotCircle, MetricPill, MiniStatRow } from "./discover-primitives";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RankCardProps {
  model: NIMModel;
  headlineMetric: { value: string; label: string };
  selected?: boolean;
  onSelect: (model: NIMModel) => void;
}

export function RankCard({
  model,
  headlineMetric,
  selected,
  onSelect,
}: RankCardProps) {
  const statusColor = getStatusColor(model.status);

  return (
    <button
      onClick={() => onSelect(model)}
      aria-pressed={selected}
      className="w-full text-left"
    >
      <Card
        className={cn(
          "w-[180px] shrink-0 rounded-md transition-all duration-150",
          selected ? "border-primary/70" : "",
        )}
      >
        <CardHeader className="px-3 pt-3 pb-2 space-y-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xs leading-tight">
                {model.name}
              </CardTitle>
              <p className="truncate text-[10px] text-muted-foreground font-mono mt-0.5">
                {model.provider}
              </p>
            </div>
            <StatusDotCircle status={model.status} size={5} />
          </div>
        </CardHeader>

        <CardContent className="px-3 py-2 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className="tabular-nums leading-none font-mono font-semibold text-foreground"
              style={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}
            >
              {headlineMetric.value}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-mono">
              {headlineMetric.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <MiniStatRow label="REL" value={`${model.reliability}%`} />
            <MiniStatRow label="CONG" value={`${model.congestion}%`} warn={model.congestion > 50} />
            <MiniStatRow label="TTFT" value={`${model.ttft}ms`} />
            <MiniStatRow
              label="T/O"
              value={`${model.timeoutRate}%`}
              warn={model.timeoutRate > 3}
            />
          </div>
        </CardContent>

        <CardFooter className="px-3 pb-3 pt-0">
          <HorizontalSparkline
            data={headlineMetric.label === "reliability" || headlineMetric.label === "congestion"
              ? model.reliabilityHistory.map((p) => p.score)
              : model.throughputHistory}
            color={statusColor}
            width={156}
            height={20}
          />
        </CardFooter>
      </Card>
    </button>
  );
}
