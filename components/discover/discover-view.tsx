"use client";

import { useState, useMemo, useCallback } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import { CATEGORIES, type DiscoverCategory } from "./discover-data";
import { RankCard } from "./rank-card";
import { ComparisonPanel } from "./comparison-panel";
import { SectionLabel } from "./discover-primitives";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const PRIMARY_CATEGORIES = CATEGORIES.filter((c) =>
  ["fastest", "most-reliable", "least-congested"].includes(c.id),
);
const SECONDARY_CATEGORIES = CATEGORIES.filter((c) =>
  ["best-for-coding", "trending-degradation", "emerging-standouts"].includes(
    c.id,
  ),
);

export function DiscoverView({ models }: { models: NIMModel[] }) {
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>(
    "fastest",
  );
  const [selectedIds, setSelectedIds] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [reversed, setReversed] = useState(false);
  const [baseCategory, setBaseCategory] = useState<DiscoverCategory | null>(
    null,
  );

  const activeCategoryObj = CATEGORIES.find((c) => c.id === activeCategory);
  const sort = activeCategoryObj?.sort ?? ((m: NIMModel[]) => m);
  const categoryLabel = activeCategoryObj?.label ?? activeCategory;

  const ranked = useMemo(() => {
    const sorted = sort([...models]);
    return reversed ? [...sorted].reverse() : sorted;
  }, [activeCategory, reversed, models, sort]);

  const hasSelection =
    selectedIds[0] !== null || selectedIds[1] !== null;
  const selectedModels = useMemo<[NIMModel, NIMModel] | "none">(() => {
    if (!selectedIds[0]) return "none";
    const first = models.find((m) => m.id === selectedIds[0]);
    if (!first) return "none";
    const second = selectedIds[1]
      ? models.find((m) => m.id === selectedIds[1])
      : first;
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

  const metricCfg: Record<
    string,
    {
      value: (m: NIMModel) => string;
      label: string;
      history: (m: NIMModel) => number[];
    }
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

  const metric = metricCfg[activeCategory] ?? metricCfg["fastest"];
  const rankLabel = baseCategory
    ? CATEGORIES.find((c) => c.id === baseCategory)?.label ?? baseCategory
    : categoryLabel;

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <SectionLabel className="pl-0.5">{rankLabel}</SectionLabel>

        <nav
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Primary categories"
        >
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

        <Separator className="border-border" />

        <nav
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Secondary categories"
        >
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

      <div className="flex items-center justify-between px-1">
        <SectionLabel className="pl-0.5">
          {reversed ? "Underperforming" : "Ranking"}
        </SectionLabel>
        <button
          onClick={() => setReversed((v) => !v)}
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.08em] font-mono transition-colors duration-150",
            "text-muted-foreground hover:text-foreground data-[active=true]:text-foreground",
          )}
          data-active={reversed}
        >
          {reversed ? "Best first" : "Worst first"}
        </button>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {ranked.map((model) => (
          <RankCard
            key={model.id}
            model={model}
            headlineMetric={{
              value: metric.value(model),
              label: metric.label,
            }}
            secondaryMetrics={[
              { value: `${model.reliability}%`, label: "REL" },
              { value: `${model.congestion}%`, label: "CONG" },
            ]}
            historyData={metric.history(model)}
            selected={selectedIds.includes(model.id)}
            onSelect={handleCardSelect}
          />
        ))}
      </div>

      <ComparisonPanel
        models={comparisonModels}
        onClear={handleClearComparison}
      />
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
      data-active={active}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs font-mono transition-colors duration-150 whitespace-nowrap",
        "border",
        "data-[active=true]:bg-muted data-[active=true]:text-foreground data-[active=true]:border-border",
        "data-[active=false]:bg-transparent data-[active=false]:border-transparent data-[active=false]:text-muted-foreground",
        "hover:data-[active=false]:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
