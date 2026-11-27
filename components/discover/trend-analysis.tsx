"use client";

import { TrendingUp, Minus, CheckCircle2, Waypoints } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { PanelHeader } from "./ops-primitives";
import { HorizontalSparkline } from "./horizontal-sparkline";
import { cn } from "@/lib/utils";

const GRADE_STROKE: Record<TrendGrade, string> = {
  rising: "var(--status-healthy)",
  improving: "var(--status-info)",
  stable: "var(--status-warn)",
  declining: "var(--status-critical)",
};

interface TrendAnalysisProps {
  models: NIMModel[];
}

type TrendGrade = "rising" | "improving" | "stable" | "declining";

interface TrendEntry {
  model: NIMModel;
  grade: TrendGrade;
}

function classify(model: NIMModel): TrendGrade {
  const trend = model.congestionTrend;
  const rel = model.reliability;
  const cong = model.congestion;
  if ((trend === "declining" || trend === "stagnant") && cong > 45) return "declining";
  if (trend === "improving" && rel >= 98) return "rising";
  if (trend === "stable" || (rel >= 99 && cong < 40)) return "stable";
  return "improving";
}

const GRADE_CONFIG: Record<TrendGrade, { label: string; icon: React.ElementType }> = {
  rising: { label: "Rising", icon: TrendingUp },
  improving: { label: "Improving", icon: TrendingUp },
  stable: { label: "Stable", icon: Minus },
  declining: { label: "Declining", icon: TrendingUp },
};

export function TrendAnalysis({ models }: TrendAnalysisProps) {
  const entries: TrendEntry[] = models.map((m) => ({ model: m, grade: classify(m) }));
  const grouped: Record<TrendGrade, TrendEntry[]> = { rising: [], improving: [], stable: [], declining: [] };
  entries.forEach((e) => grouped[e.grade].push(e));

  if (!models.length) {
    return (
      <section className="ops-card">
        <PanelHeader label="Trend analysis" icon={Waypoints} tone="info" />
        <div className="py-8 text-center body-sm text-text-muted">No trend data.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Trend analysis"
        icon={Waypoints}
        tone="info"
        meta={<span>{models.length} models tracked</span>}
      />

      <div className="panel-pad grid grid-cols-2 lg:grid-cols-4 gap-2">
        {(Object.keys(grouped) as TrendGrade[]).map((grade) => {
          const items = grouped[grade];
          const cfg = GRADE_CONFIG[grade];
          const Icon = cfg.icon;

          return (
            <div key={grade} className="min-w-0 rounded-md border border-border-subtle bg-surface-recessed p-3">
              <div className="mb-2 flex items-center gap-2">
                <Icon className={cn("h-4 w-4 text-text-muted", grade === "declining" && "rotate-180")} aria-hidden="true" />
                <span className="text-sm font-medium text-text-primary">{cfg.label}</span>
                <span className="ml-auto font-mono text-xs text-text-muted">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <div className="flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                  <span className="body-sm text-text-muted">All clear</span>
                </div>
              ) : (
                <div className="space-y-0.5 animate-stagger">
                  {items.slice(0, 5).map((t) => (
                    <TrendRow key={t.model.id} model={t.model} grade={grade} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrendRow({ model, grade }: { model: NIMModel; grade: TrendGrade }) {
  const recent = model.reliabilityHistory.slice(-8).map((p) => p.score);

  return (
    <div className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-surface-elevated transition-colors group min-w-0">
      <span className="body-sm flex-1 truncate text-text-primary group-hover:underline">{model.name}</span>
      <HorizontalSparkline
        data={recent}
        color={GRADE_STROKE[grade]}
        width={40}
        height={14}
        area={false}
        strokeWidth={1.5}
        className="shrink-0"
      />
      <span className="metric-xs w-9 shrink-0 text-right tabular-nums text-text-muted">{model.reliability}%</span>
    </div>
  );
}
