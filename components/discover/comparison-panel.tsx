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
  { label: "TTFT", getValue: (m: NIMModel) => `${m.ttft}ms`, warn: (m: NIMModel) => m.ttft > 500 },
  { label: "Throughput", getValue: (m: NIMModel) => `${m.throughput.toFixed(1)} tok/s` },
  { label: "Congestion", getValue: (m: NIMModel) => `${m.congestion}%`, warn: (m: NIMModel) => m.congestion > 50 },
  { label: "Reliability", getValue: (m: NIMModel) => `${m.reliability}%` },
  { label: "Uptime", getValue: (m: NIMModel) => `${m.uptime.toFixed(2)}%` },
];

export function ComparisonPanel({ models, onClear }: ComparisonPanelProps) {
  if (!models) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Pair Comparison</SectionLabel>
        <button
          onClick={onClear}
          className="text-xs font-bold uppercase tracking-[0.08em] text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-3">
        {models.map((model) => {
          const flare = getStatusColor(model.status);
          return (
            <div key={model.id} className="p-2.5 rounded-lg border border-[--border-subtle] bg-[--surface-recessed]">
              <div className="flex items-center gap-1.5 mb-2">
                <StatusDot status={model.status} size={5} />
                <span className="text-sm font-medium text-[--text-primary] truncate">{model.name}</span>
                <span className="text-[10px] font-mono text-[--text-tertiary] ml-auto">{model.provider}</span>
              </div>
              <div className="space-y-0.5">
                {METRICS.map((metric) => (
                  <MiniStatRow key={metric.label} label={metric.label} value={metric.getValue(model)} warn={metric.warn?.(model)} />
                ))}
              </div>
              <div className="mt-2 pt-1.5 border-t border-[--border-subtle]">
                <HorizontalSparkline data={model.throughputHistory} color={flare} width={180} height={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
