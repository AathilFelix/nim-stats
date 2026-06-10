"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Zap, Shield, Activity, Code2, TrendingDown, Star,
} from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { CATEGORIES, type DiscoverCategory } from "./discover-data";
import { RankCard } from "./rank-card";
import { ComparisonPanel } from "./comparison-panel";
import { SectionLabel } from "./discover-primitives";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<DiscoverCategory, React.ElementType> = {
  fastest: Zap,
  "most-reliable": Shield,
  "least-congested": Activity,
  "best-for-coding": Code2,
  "trending-degradation": TrendingDown,
  "emerging-standouts": Star,
};

export function DiscoverView({ models }: { models: NIMModel[] }) {
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>("fastest");
  const [selectedIds, setSelectedIds] = useState<[string | null, string | null]>([null, null]);
  const [reversed, setReversed] = useState(false);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === activeCategory);
  const sort = activeCategoryObj?.sort ?? ((m: NIMModel[]) => m);

  const ranked = useMemo(() => {
    const sorted = sort([...models]);
    return reversed ? [...sorted].reverse() : sorted;
  }, [activeCategory, reversed, models, sort]);

  const selectedModels = useMemo<[NIMModel, NIMModel] | "none">(() => {
    if (!selectedIds[0]) return "none";
    const first = models.find((m) => m.id === selectedIds[0]);
    if (!first) return "none";
    const second = selectedIds[1] ? models.find((m) => m.id === selectedIds[1]) : first;
    if (!second || second.id === first.id) return "none";
    return [first, second];
  }, [selectedIds, models]);

  const comparisonModels = selectedModels === "none" ? null : selectedModels;

  const handleCardSelect = useCallback(
    (model: NIMModel) => {
      setSelectedIds((prev) => {
        const [first, second] = prev;
        if (first === model.id) return [null, second];
        if (second === model.id) return [first, null];
        if (first === null) return [model.id, null];
        return [first, model.id];
      });
    },
    [],
  );

  const handleClearComparison = useCallback(() => {
    setSelectedIds([null, null]);
  }, []);

  const metricCfg: Record<string, {
    value: (m: NIMModel) => string;
    label: string;
    history: (m: NIMModel) => number[];
  }> = {
    fastest: { value: (m) => `${m.throughput.toFixed(1)}`, label: "tok/s", history: (m) => m.throughputHistory },
    "most-reliable": { value: (m) => `${m.reliability}%`, label: "reliability", history: (m) => m.reliabilityHistory.map((p) => p.score) },
    "least-congested": { value: (m) => `${m.congestion}%`, label: "congestion", history: (m) => m.reliabilityHistory.map((p) => p.score) },
    "best-for-coding": { value: (m) => `${m.throughput.toFixed(1)}`, label: "tok/s", history: (m) => m.throughputHistory },
    "trending-degradation": { value: (m) => `${m.reliability}%`, label: "reliability", history: (m) => m.reliabilityHistory.map((p) => p.score) },
    "emerging-standouts": { value: (m) => `${m.throughput.toFixed(1)}`, label: "tok/s", history: (m) => m.throughputHistory },
  };

  const metric = metricCfg[activeCategory] ?? metricCfg["fastest"];
  const ActiveIcon = CATEGORY_ICONS[activeCategory];

  return (
    <div className="ops-card p-4 sm:p-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <ActiveIcon className="w-4 h-4 text-[--text-accent]" />
          <SectionLabel>Model Registry</SectionLabel>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[--text-notice] font-mono">
          {ranked.length} models
        </span>
      </div>

      {/* Category nav */}
      <nav className="flex flex-wrap items-center gap-1 mb-4" aria-label="Model categories">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setReversed(false);
                setSelectedIds([null, null]);
              }}
              data-active={cat.id === activeCategory}
              className="cat-btn"
            >
              <Icon />
              {cat.label}
            </button>
          );
        })}
      </nav>

      {/* Rank direction toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-px flex-1 bg-[--border-subtle]" />
        <button
          onClick={() => setReversed((v) => !v)}
          className={cn(
            "text-xs font-bold uppercase tracking-[0.07em] font-mono transition-colors px-2",
            reversed ? "text-[--status-warn]" : "text-[--text-tertiary] hover:text-[--text-secondary]",
          )}
        >
          {reversed ? "▲ Best first" : "▼ Worst first"}
        </button>
        <div className="h-px flex-1 bg-[--border-subtle]" />
      </div>

      {/* Bento layout: rank grid + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rank cards grid — 2/3 width */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {ranked.map((model, idx) => (
              <RankCard
                key={model.id}
                model={model}
                rank={idx + 1}
                headlineMetric={{ value: metric.value(model), label: metric.label }}
                selected={selectedIds.includes(model.id)}
                onSelect={handleCardSelect}
              />
            ))}
          </div>
        </div>

        {/* Detail / Comparison panel — 1/3 width */}
        <div className="lg:col-span-1">
          <div className="surface-glass p-3.5 sticky top-16">
            {selectedIds[0] ? (
              comparisonModels ? (
                <ComparisonPanel models={comparisonModels} onClear={handleClearComparison} />
              ) : (
                <ModelDetail
                  model={models.find((m) => m.id === selectedIds[0])!}
                  onComparePrompt={() => {}}
                />
              )
            ) : (
              <EmptyPrompt />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelDetail({ model }: { model: NIMModel; onComparePrompt: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Model Detail</SectionLabel>
        <span className="text-xs font-mono text-[--text-tertiary]">{model.provider}</span>
      </div>
      <div className="text-base font-semibold text-[--text-primary] mb-3 truncate">{model.name}</div>
      <div className="space-y-1.5">
        <DetailRow label="Throughput" value={`${model.throughput.toFixed(1)} tok/s`} />
        <DetailRow label="Reliability" value={`${model.reliability}%`} />
        <DetailRow label="Congestion" value={`${model.congestion}%`} warn={model.congestion > 50} />
        <DetailRow label="TTFT" value={`${model.ttft}ms`} />
        <DetailRow label="Uptime" value={`${model.uptime.toFixed(2)}%`} />
        <DetailRow label="Timeout Rate" value={`${model.timeoutRate}%`} warn={model.timeoutRate > 3} />
        <DetailRow label="P95 Latency" value={`${model.p95Latency}ms`} />
        <DetailRow label="P99 Latency" value={`${model.p99Latency}ms`} />
      </div>
      <p className="text-xs font-mono text-[--text-tertiary] mt-3 leading-relaxed">
        Click another model to compare.
      </p>
    </div>
  );
}

function DetailRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs uppercase tracking-[0.06em] text-[--text-tertiary] shrink-0">{label}</span>
      <span className={cn(
        "text-sm font-mono tabular-nums",
        warn ? "text-[--status-critical] font-semibold" : "text-[--text-primary]",
      )}>
        {value}
      </span>
    </div>
  );
}

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-lg bg-[--surface-recessed] border border-[--border-subtle] flex items-center justify-center mb-3">
        <Activity className="w-4 h-4 text-[--text-tertiary]" />
      </div>
      <p className="text-sm font-medium text-[--text-secondary] mb-1">Select a model</p>
      <p className="text-xs font-mono text-[--text-tertiary] leading-relaxed">
        Click any card to view details or select two to compare.
      </p>
    </div>
  );
}
