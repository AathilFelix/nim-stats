"use client";

import type { NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { StatusDot, RankBadge } from "./discover-primitives";

interface RankCardProps {
  model: NIMModel;
  rank: number;
  headlineMetric: { value: string; label: string };
  selected?: boolean;
  onSelect: (model: NIMModel) => void;
}

export function RankCard({ model, rank, headlineMetric, selected, onSelect }: RankCardProps) {
  const flare = getStatusColor(model.status);

  return (
    <button
      onClick={() => onSelect(model)}
      aria-pressed={selected}
      className="rank-card w-full text-left relative"
      data-selected={selected}
    >
      {/* Rank badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <RankBadge rank={rank} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2.5 pr-8">
        <StatusDot status={model.status} size={5} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm leading-tight text-text-primary">{model.name}</div>
          <div className="mt-0.5 body-xs text-text-muted">{model.provider}</div>
        </div>
      </div>

      {/* Headline metric */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="metric-xl leading-none text-text-primary">
          {headlineMetric.value}
        </span>
        <span className="body-sm text-text-muted">
          {headlineMetric.label}
        </span>
      </div>

      {/* Sparkline */}
      <div className="mb-2">
        <HorizontalSparkline
          data={
            headlineMetric.label === "reliability" || headlineMetric.label === "congestion"
              ? model.reliabilityHistory.map((p) => p.score)
              : model.throughputHistory
          }
          color={flare}
          width={160}
          height={20}
        />
      </div>

      {/* Mini stats */}
      <div className="space-y-0.5">
        <MiniStat label="Reliability" value={`${model.reliability}%`} />
        <MiniStat label="Congestion" value={`${model.congestion}%`} warn={model.congestion > 50} />
        <MiniStat label="First token" value={`${model.ttft}ms`} />
      </div>
    </button>
  );
}

function MiniStat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 body-xs text-text-muted">{label}</span>
      <span className={`flex items-center gap-1.5 font-mono text-xs tabular-nums text-text-primary ${warn ? "font-medium" : ""}`}>
        {warn && <StatusDot status="busy" size={8} />}
        {value}
      </span>
    </div>
  );
}
