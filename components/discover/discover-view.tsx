"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Zap, Shield, Activity, Code2, TrendingDown, Star, GitCompare, ArrowDownUp,
} from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { CATEGORIES, type DiscoverCategory } from "./discover-data";
import { ComparisonPanel } from "./comparison-panel";
import { StatusDot } from "./discover-primitives";
import { PanelHeader } from "./ops-primitives";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<DiscoverCategory, React.ElementType> = {
  fastest: Zap,
  "most-reliable": Shield,
  "least-congested": Activity,
  "best-for-coding": Code2,
  "trending-degradation": TrendingDown,
  "emerging-standouts": Star,
};

type MetricKey = "throughput" | "reliability" | "congestion";

const CATEGORY_HIGHLIGHT: Record<DiscoverCategory, MetricKey> = {
  fastest: "throughput",
  "most-reliable": "reliability",
  "least-congested": "congestion",
  "best-for-coding": "throughput",
  "trending-degradation": "reliability",
  "emerging-standouts": "throughput",
};

export function DiscoverView({ models }: { models: NIMModel[] }) {
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>("fastest");
  const [selectedIds, setSelectedIds] = useState<[string | null, string | null]>([null, null]);
  const [reversed, setReversed] = useState(false);

  const highlight = CATEGORY_HIGHLIGHT[activeCategory];

  const ranked = useMemo(() => {
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    const sorted = (cat?.sort ?? ((m: NIMModel[]) => m))([...models]);
    return reversed ? [...sorted].reverse() : sorted;
  }, [activeCategory, reversed, models]);

  const selectedModels = useMemo<[NIMModel, NIMModel] | "none">(() => {
    if (!selectedIds[0]) return "none";
    const first = models.find((m) => m.id === selectedIds[0]);
    if (!first) return "none";
    const second = selectedIds[1] ? models.find((m) => m.id === selectedIds[1]) : first;
    if (!second || second.id === first.id) return "none";
    return [first, second];
  }, [selectedIds, models]);

  const comparisonModels = selectedModels === "none" ? null : selectedModels;

  const handleSelect = useCallback((model: NIMModel) => {
    setSelectedIds((prev) => {
      const [first, second] = prev;
      if (first === model.id) return [null, second];
      if (second === model.id) return [first, null];
      if (first === null) return [model.id, null];
      return [first, model.id];
    });
  }, []);

  const ActiveIcon = CATEGORY_ICONS[activeCategory];

  return (
    <section className="ops-card">
      <PanelHeader
        label="Model Registry"
        icon={ActiveIcon}
        tone="info"
        meta={<span className="metric-xs text-text-secondary">{ranked.length} endpoints</span>}
      />

      {/* Category selector + sort direction */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-border-subtle">
        <nav className="flex flex-wrap items-center gap-1" aria-label="Ranking categories">
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
        <button
          onClick={() => setReversed((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 metric-xs transition-colors",
            reversed
              ? "text-status-warn bg-status-warn/10"
              : "text-text-tertiary hover:text-text-secondary hover:bg-surface-recessed",
          )}
          title="Reverse ranking order"
        >
          <ArrowDownUp className="h-3 w-3" />
          {reversed ? "Worst first" : "Best first"}
        </button>
      </div>

      {/* Registry table + detail rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Table */}
        <div className="min-w-0 lg:border-r border-border-subtle">
          <div className="ops-table-header grid-cols-[28px_minmax(0,1fr)_64px_52px_56px_92px] hidden sm:grid">
            <span>#</span>
            <span>Model</span>
            <span className={cn("text-right", highlight === "throughput" && "text-text-accent")}>Tok/s</span>
            <span className={cn("text-right", highlight === "reliability" && "text-text-accent")}>Rel</span>
            <span className={cn("text-right", highlight === "congestion" && "text-text-accent")}>Cong</span>
            <span className="text-right">24h</span>
          </div>

          <div className="animate-stagger">
            {ranked.map((model, idx) => (
              <RegistryRow
                key={model.id}
                model={model}
                rank={idx + 1}
                highlight={highlight}
                selected={selectedIds.includes(model.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* Detail / comparison rail */}
        <aside className="min-w-0 bg-surface-recessed/40">
          <div className="p-3.5 lg:sticky lg:top-16">
            {selectedIds[0] ? (
              comparisonModels ? (
                <ComparisonPanel models={comparisonModels} onClear={() => setSelectedIds([null, null])} />
              ) : (
                <ModelDetail model={models.find((m) => m.id === selectedIds[0])!} />
              )
            ) : (
              <EmptyPrompt />
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function RegistryRow({
  model, rank, highlight, selected, onSelect,
}: {
  model: NIMModel;
  rank: number;
  highlight: MetricKey;
  selected: boolean;
  onSelect: (m: NIMModel) => void;
}) {
  const sparkColor =
    model.status === "jammed" ? "var(--status-critical)"
    : model.status === "busy" ? "var(--status-warn)"
    : "var(--status-healthy)";

  return (
    <button
      onClick={() => onSelect(model)}
      aria-pressed={selected}
      data-selected={selected}
      className={cn(
        "ops-table-row w-full text-left grid-cols-[28px_minmax(0,1fr)_auto]",
        "sm:grid-cols-[28px_minmax(0,1fr)_64px_52px_56px_92px]",
        selected && "bg-surface-elevated border-l-text-accent",
      )}
    >
      <span className={cn("metric-xs text-right tabular-nums", rank <= 3 ? "text-text-accent" : "text-text-quaternary")}>
        {rank}
      </span>

      <span className="flex items-center gap-2 min-w-0">
        <StatusDot status={model.status} size={7} />
        <span className="min-w-0">
          <span className="block truncate text-[0.82rem] font-medium text-text-primary leading-tight">
            {model.name}
          </span>
          <span className="block truncate label-xs text-text-quaternary mt-0.5">{model.provider}</span>
        </span>
      </span>

      <Cell value={`${model.throughput.toFixed(0)}`} active={highlight === "throughput"} className="hidden sm:flex" />
      <Cell value={`${model.reliability}`} active={highlight === "reliability"} warn={model.reliability < 95} className="hidden sm:flex" />
      <Cell value={`${model.congestion}`} active={highlight === "congestion"} warn={model.congestion > 60} className="hidden sm:flex" />

      <span className="hidden sm:flex justify-end items-center">
        <HorizontalSparkline data={model.throughputHistory} color={sparkColor} width={84} height={22} />
      </span>

      {/* Mobile headline metric */}
      <span className="flex sm:hidden items-baseline gap-1 justify-end">
        <span className="metric-sm font-semibold text-text-primary">
          {highlight === "throughput" ? model.throughput.toFixed(0) : highlight === "reliability" ? model.reliability : model.congestion}
        </span>
        <span className="label-xs text-text-quaternary">
          {highlight === "throughput" ? "t/s" : "%"}
        </span>
      </span>
    </button>
  );
}

function Cell({ value, active, warn, className }: { value: string; active?: boolean; warn?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "items-center justify-end metric-sm tabular-nums",
        warn ? "text-status-critical" : active ? "text-text-primary font-semibold" : "text-text-secondary",
        className,
      )}
    >
      {value}
    </span>
  );
}

function ModelDetail({ model }: { model: NIMModel }) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">Endpoint Detail</span>
        <span className="status-chip status-chip--neutral">{model.provider}</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status={model.status} size={8} />
        <span className="heading-md truncate text-text-primary">{model.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <DetailTile label="Throughput" value={model.throughput.toFixed(1)} unit="tok/s" />
        <DetailTile label="Reliability" value={`${model.reliability}`} unit="%" />
        <DetailTile label="TTFT" value={`${model.ttft}`} unit="ms" />
        <DetailTile label="Congestion" value={`${model.congestion}`} unit="%" warn={model.congestion > 60} />
        <DetailTile label="P95" value={`${model.p95Latency}`} unit="ms" />
        <DetailTile label="P99" value={`${model.p99Latency}`} unit="ms" />
        <DetailTile label="Uptime" value={model.uptime.toFixed(2)} unit="%" />
        <DetailTile label="Timeouts" value={`${model.timeoutRate}`} unit="%" warn={model.timeoutRate > 3} />
      </div>
      <p className="flex items-center gap-1.5 body-xs text-text-tertiary">
        <GitCompare className="h-3 w-3" />
        Select another endpoint to compare.
      </p>
    </div>
  );
}

function DetailTile({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className="hud-block">
      <span className="flex items-baseline gap-1">
        <span className={cn("metric-md", warn ? "text-status-critical" : "text-text-primary")}>{value}</span>
        <span className="label-xs text-text-quaternary">{unit}</span>
      </span>
      <span className="label-xs text-text-tertiary">{label}</span>
    </div>
  );
}

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-border-base bg-surface-recessed">
        <GitCompare className="h-4 w-4 text-text-tertiary" />
      </div>
      <p className="body-sm font-medium text-text-secondary mb-1">Inspect an endpoint</p>
      <p className="body-xs text-text-tertiary leading-relaxed max-w-[200px]">
        Select a row for full telemetry, or pick two to compare side by side.
      </p>
    </div>
  );
}
