"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { StatusDot, SectionLabel, MiniStatRow } from "./discover-primitives";

interface ComparisonPanelProps {
  models: [NIMModel, NIMModel] | null;
  onClear: () => void;
}

const METRICS = [
  { label: "First token", getValue: (m: NIMModel) => `${m.ttft}ms`, warn: (m: NIMModel) => m.ttft > 500 },
  { label: "Throughput", getValue: (m: NIMModel) => m.throughput > 0 ? `${m.throughput.toFixed(1)} tok/s` : "—" },
  { label: "Congestion", getValue: (m: NIMModel) => `${m.congestion}%`, warn: (m: NIMModel) => m.congestion > 50 },
  { label: "Reliability", getValue: (m: NIMModel) => `${m.reliability}%` },
  { label: "Uptime", getValue: (m: NIMModel) => `${m.uptime.toFixed(2)}%` },
];

export function ComparisonPanel({ models, onClear }: ComparisonPanelProps) {
  if (!models) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Pair comparison</SectionLabel>
        <button
          onClick={onClear}
          className="btn-quiet"
        >
          Clear
        </button>
      </div>
      <div className="space-y-3">
        {models.map((model) => {
          const flare = getStatusColor(model.status);
          return (
            <div key={model.id} className="rounded-md border border-border-subtle bg-surface-recessed p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <StatusDot status={model.status} size={5} />
                <span className="truncate font-mono text-sm text-text-primary">{model.name}</span>
                <span className="ml-auto body-xs text-text-muted">{model.provider}</span>
              </div>
              <div className="space-y-0.5">
                {METRICS.map((metric) => (
                  <MiniStatRow key={metric.label} label={metric.label} value={metric.getValue(model)} warn={metric.warn?.(model)} />
                ))}
              </div>
              <div className="mt-2 border-t border-border-subtle pt-2">
                <HorizontalSparkline data={model.throughputHistory} color={flare} width={180} height={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
