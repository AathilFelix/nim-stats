"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { Button } from "@/components/ui/button";

interface ComparisonPanelProps {
  models: [NIMModel, NIMModel] | null;
  onClear: () => void;
}

const METRICS = [
  { label: "TTFT", getValue: (m: NIMModel) => `${m.ttft}ms` },
  { label: "THROUGHPUT", getValue: (m: NIMModel) => `${m.throughput.toFixed(1)} tok/s` },
  { label: "CONGESTION", getValue: (m: NIMModel) => `${m.congestion}%` },
  { label: "RELIABILITY", getValue: (m: NIMModel) => `${m.reliability}%` },
  { label: "UPTIME", getValue: (m: NIMModel) => `${m.uptime.toFixed(2)}%` },
];

import { StatusDotCircle, SurfaceCard, SectionLabel } from "./discover-primitives";

export function ComparisonPanel({ models, onClear }: ComparisonPanelProps) {
  if (!models) return null;

  return (
    <SurfaceCard className="p-0">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <SectionLabel>Comparison</SectionLabel>
        <Button variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border">
        {models.map((model) => {
          const statusColor = getStatusColor(model.status);
          return (
            <div key={model.id} className="p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <StatusDotCircle size={5} status={model.status} />
                <p className="truncate text-[11px] font-medium text-foreground">
                  {model.name}
                </p>
              </div>
              <p className="mb-3 text-[10px] text-muted-foreground font-mono">
                {model.provider}
              </p>

              <div className="space-y-1">
                {METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground font-mono shrink-0">
                      {metric.label}
                    </span>
                    <span className="tabular-nums text-[11px] font-bold text-foreground font-mono tracking-tight ml-3">
                      {metric.getValue(model)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-border">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono mb-1">
                  Throughput History
                </p>
                <HorizontalSparkline
                  data={model.throughputHistory}
                  color={statusColor}
                  width={152}
                  height={24}
                />
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}
