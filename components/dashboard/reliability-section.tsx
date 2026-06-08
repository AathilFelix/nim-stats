"use client";

import { type NIMModel } from "./mock-data";

interface ReliabilitySectionProps {
  models: NIMModel[];
}

export function ReliabilitySection({ models }: ReliabilitySectionProps) {
  return (
    <div className="rounded-2xl border border-border-base bg-surface-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-subtle">
        <p className="text-[10px] text-text-tertiary uppercase tracking-[0.1em] font-bold">
          Reliability &amp; Uptime
        </p>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {models.map((model) => (
            <ModelReliabilityCard key={model.id} model={model} />
          ))}
        </div>
      </div>
    </div>
  );
}

function thresholdColor(score: number): string {
  if (score >= 95) return "#10b981";
  if (score >= 85) return "#f59e0b";
  return "#ef4444";
}

function ModelReliabilityCard({ model }: { model: NIMModel }) {
  const color = thresholdColor(model.reliability);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-recessed px-4 py-3.5 cursor-default hover:border-border-base hover:bg-surface-elevated transition-colors duration-150">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-text-primary truncate">
            {model.name}
          </p>
          <p className="text-[10px] text-text-tertiary mt-0.5">{model.provider}</p>
        </div>
        <span className="text-sm font-bold tabular-nums ml-3 shrink-0" style={{ color }}>
          {model.reliability}
        </span>
      </div>
      <div className="h-1 bg-border-subtle rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${model.reliability}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-text-tertiary font-mono">
        <span>{model.uptime.toFixed(2)}% uptime</span>
        <span>{model.ttft}ms</span>
      </div>
    </div>
  );
}
