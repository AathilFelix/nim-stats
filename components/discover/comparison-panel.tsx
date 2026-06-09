"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { StatusDotCircle } from "./discover-primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function ComparisonPanel({ models, onClear }: ComparisonPanelProps) {
  if (!models) return null;

  return (
    <Card className="rounded-lg border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
          Comparison
        </CardTitle>
        <Button variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x divide-border">
          {models.map((model, idx) => {
            const statusColor = getStatusColor(model.status);
            return (
              <div key={model.id} className={cn("p-4", idx === 1 && "divide-x-0")}>
                <div className="flex items-center gap-2 mb-3">
                  <StatusDotCircle status={model.status} />
                  <p className="font-semibold truncate text-sm text-foreground">
                    {model.name}
                  </p>
                </div>
                <p className="mb-4 text-xs text-muted-foreground font-mono">
                  {model.provider}
                </p>

                <div className="space-y-2">
                  {METRICS.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-baseline justify-between"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground font-mono shrink-0">
                        {metric.label}
                      </span>
                      <span className="tabular-nums text-sm font-bold text-foreground font-mono tracking-tight ml-3">
                        {metric.getValue(model)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono mb-2">
                    Throughput History
                  </p>
                  <HorizontalSparkline
                    data={model.throughputHistory}
                    color={statusColor}
                    width={180}
                    height={32}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
