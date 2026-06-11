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

const GRADE_CONFIG: Record<TrendGrade, {
  label: string;
  color: string;
  border: string;
  bg: string;
  icon: React.ElementType;
}> = {
  rising: { label: "Rising", color: "text-[--status-healthy]", border: "border-[--status-healthy]/20", bg: "bg-[--status-healthy]/5", icon: TrendingUp },
  improving: { label: "Improving", color: "text-[--status-info]", border: "border-[--status-info]/20", bg: "bg-[--status-info]/5", icon: TrendingUp },
  stable: { label: "Stable", color: "text-[--status-warn]", border: "border-[--status-warn]/20", bg: "bg-[--status-warn]/5", icon: Minus },
  declining: { label: "Declining", color: "text-[--status-critical]", border: "border-[--status-critical]/20", bg: "bg-[--status-critical]/5", icon: TrendingUp },
};

export function TrendAnalysis({ models }: TrendAnalysisProps) {
  const entries: TrendEntry[] = models.map((m) => ({ model: m, grade: classify(m) }));
  const grouped: Record<TrendGrade, TrendEntry[]> = { rising: [], improving: [], stable: [], declining: [] };
  entries.forEach((e) => grouped[e.grade].push(e));

  if (!models.length) {
    return (
      <section className="ops-card">
        <PanelHeader label="Trend Analysis" icon={Waypoints} tone="info" />
        <div className="py-8 text-center text-text-tertiary body-xs">No trend data.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Trend Analysis"
        icon={Waypoints}
        tone="info"
        meta={<span className="metric-xs">{models.length} models tracked</span>}
      />

      <div className="panel-pad grid grid-cols-2 lg:grid-cols-4 gap-2">
        {(Object.keys(grouped) as TrendGrade[]).map((grade) => {
          const items = grouped[grade];
          const cfg = GRADE_CONFIG[grade];
          const Icon = cfg.icon;

          return (
            <div key={grade} className="p-2.5 rounded-lg border border-[--border-subtle] bg-[--surface-recessed] min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <div className={cn("w-5 h-5 rounded flex items-center justify-center", cfg.bg)}>
                  <Icon className={cn("w-3 h-3", grade === "declining" && "rotate-180", cfg.color)} />
                </div>
                <span className={cn("text-xs font-bold uppercase tracking-[0.08em] font-mono", cfg.color)}>
                  {cfg.label}
                </span>
                <span className="text-[11px] font-mono text-[--text-tertiary] ml-auto">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <div className="flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="w-3 h-3 text-[--status-healthy]" />
                  <span className="text-xs font-mono text-[--text-tertiary]">All clear</span>
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
    <div className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-[--surface-elevated] transition-colors group min-w-0">
      <span className="body-xs text-text-primary truncate flex-1 group-hover:underline">{model.name}</span>
      <HorizontalSparkline
        data={recent}
        color={GRADE_STROKE[grade]}
        width={40}
        height={14}
        area={false}
        strokeWidth={1.5}
        className="shrink-0"
      />
      <span className="metric-xs text-text-tertiary tabular-nums w-9 shrink-0 text-right">{model.reliability}%</span>
    </div>
  );
}
