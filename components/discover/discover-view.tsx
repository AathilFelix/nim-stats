"use client";

import { useState, useMemo, useCallback } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import { CATEGORIES, type DiscoverCategory } from "./discover-data";
import { RankCard } from "./rank-card";
import { ComparisonPanel } from "./comparison-panel";
import { cn } from "@/lib/utils";

const PRIMARY_CATEGORIES = CATEGORIES.filter((c) =>
  ["fastest", "most-reliable", "least-congested"].includes(c.id),
);
const SECONDARY_CATEGORIES = CATEGORIES.filter((c) =>
  ["best-for-coding", "trending-degradation", "emerging-standouts"].includes(c.id),
);

export function DiscoverView({ models }: { models: NIMModel[] }) {
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>("fastest");
  const [selectedIds, setSelectedIds] = useState<[string | null, string | null]>([null, null]);
  const [reversed, setReversed] = useState(false);
  const [baseCategory, setBaseCategory] = useState<DiscoverCategory | null>(null);

  const ranked = useMemo(() => {
    const sorted = CATEGORIES.find((c) => c.id === activeCategory)?.sort([...models]) ?? models;
    return reversed ? [...sorted].reverse() : sorted;
  }, [activeCategory, reversed, models]);

  const hasSelection = selectedIds[0] !== null || selectedIds[1] !== null;

  const selectedModels = useMemo<[NIMModel, NIMModel] | "clear-selected">(() => {
    if (!selectedIds[0]) return "clear-selected";
    const first = models.find((m) => m.id === selectedIds[0]);
    if (!first) return "clear-selected";
    const second = selectedIds[1] ? models.find((m) => m.id === selectedIds[1]) : first;
    if (!second) return "clear-selected";
    if (second.id === first.id) return "clear-selected";
    return [first, second];
  }, [selectedIds, models]);

  const comparisonModels = selectedModels === "clear-selected" ? null : selectedModels;

  const handleCardSelect = useCallback(
    (model: NIMModel) => {
      setSelectedIds((prev) => {
        const [first, second] = prev;
        if (first === model.id) return [null, second];
        if (second === model.id) return [first, null];
        if (first === null) return [model.id, null];
        if (!baseCategory || baseCategory !== activeCategory) {
          setBaseCategory(activeCategory);
          return [first, model.id];
        }
        return [model.id, second];
      });
    },
    [baseCategory, activeCategory],
  );

  const handleClearComparison = useCallback(() => {
    setSelectedIds([null, null]);
    setBaseCategory(null);
  }, []);

  const categoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? activeCategory;

  const headlineMetric: Record<
    string,
    { value: (m: NIMModel) => string; label: string; history: (m: NIMModel) => number[] }
  > = {
    fastest: {
      value: (m) => `${m.throughput.toFixed(1)}`,
      label: "tok/s",
      history: (m) => m.throughputHistory,
    },
    "most-reliable": {
      value: (m) => `${m.reliability}%`,
      label: "reliability",
      history: (m) => m.reliabilityHistory.map((p) => p.score),
    },
    "least-congested": {
      value: (m) => `${m.congestion}%`,
      label: "congestion",
      history: (m) => m.reliabilityHistory.map((p) => p.score),
    },
    "best-for-coding": {
      value: (m) => `${m.throughput.toFixed(1)}`,
      label: "tok/s",
      history: (m) => m.throughputHistory,
    },
    "trending-degradation": {
      value: (m) => `${m.reliability}%`,
      label: "reliability",
      history: (m) => m.reliabilityHistory.map((p) => p.score),
    },
    "emerging-standouts": {
      value: (m) => `${m.throughput.toFixed(1)}`,
      label: "tok/s",
      history: (m) => m.throughputHistory,
    },
  };

  const metricCfg = headlineMetric[activeCategory] ?? headlineMetric["fastest"];
  const rankLabel = baseCategory
    ? CATEGORIES.find((c) => c.id === baseCategory)?.label ?? baseCategory
    : categoryLabel;

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className="uppercase tracking-wider font-medium"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.6rem',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.12em',
                fontWeight: 600,
              }}
            >
              {rankLabel}
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Primary categories">
            {PRIMARY_CATEGORIES.map((cat) => (
              <CategoryButton
                key={cat.id}
                label={cat.label}
                active={cat.id === activeCategory}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setReversed(false);
                  setSelectedIds([null, null]);
                  setBaseCategory(null);
                }}
              />
            ))}
          </nav>

          <div
            style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }}
            aria-hidden="true"
          />

          <nav className="flex flex-wrap items-center gap-1.5" aria-label="Secondary categories">
            {SECONDARY_CATEGORIES.map((cat) => (
              <CategoryButton
                key={cat.id}
                label={cat.label}
                active={cat.id === activeCategory}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setReversed(false);
                  setSelectedIds([null, null]);
                  setBaseCategory(null);
                }}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span
            className="uppercase tracking-wider"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {reversed ? "Underperforming" : "Ranking"}
          </span>
          <button
            onClick={() => setReversed((v) => !v)}
            className="uppercase tracking-wider transition-colors duration-150 hover:text-text-secondary"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.08em',
            }}
          >
            {reversed ? "Best first" : "Worst first"}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {ranked.map((model) => (
            <RankCard
              key={model.id}
              model={model}
              headlineMetric={{
                value: metricCfg.value(model),
                label: metricCfg.label,
              }}
              secondaryMetrics={[
                { value: `${model.reliability}%`, label: "REL" },
                { value: `${model.congestion}%`, label: "CONG" },
              ]}
              historyData={metricCfg.history(model)}
              selected={selectedIds.includes(model.id)}
              onSelect={handleCardSelect}
            />
          ))}
        </div>
      </div>

      <ComparisonPanel models={comparisonModels} onClear={handleClearComparison} />
    </div>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-sm text-xs transition-colors duration-150 whitespace-nowrap",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
      style={{
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '0.7rem',
        letterSpacing: '-0.01em',
        backgroundColor: active ? 'var(--surface-elevated)' : undefined,
        border: active ? '1px solid var(--border-base)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  );
}
