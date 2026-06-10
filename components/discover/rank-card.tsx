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
          <div className="text-sm font-semibold text-[--text-primary] truncate leading-tight">{model.name}</div>
          <div className="text-[10px] font-mono text-[--text-tertiary] mt-0.5 tracking-wider uppercase">{model.provider}</div>
        </div>
      </div>

      {/* Headline metric */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="metric-xl text-[--text-primary] leading-none">
          {headlineMetric.value}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.06em] text-[--text-tertiary] font-mono">
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
        <MiniStat label="Rel" value={`${model.reliability}%`} />
        <MiniStat label="Cong" value={`${model.congestion}%`} warn={model.congestion > 50} />
        <MiniStat label="TTFT" value={`${model.ttft}ms`} />
      </div>
    </button>
  );
}

function MiniStat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] uppercase tracking-[0.06em] text-[--text-tertiary] shrink-0">{label}</span>
      <span className={`text-xs font-mono tabular-nums ${warn ? "text-[--status-critical] font-semibold" : "text-[--text-primary]"}`}>
        {value}
      </span>
    </div>
  );
}
