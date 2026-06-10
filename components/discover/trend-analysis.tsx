"use client";

import { TrendingUp, Minus, CheckCircle2 } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { SurfaceCard, SectionLabel } from "./discover-primitives";
import { cn } from "@/lib/utils";

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
      <SurfaceCard className="p-4">
        <SectionLabel>Trend Analysis</SectionLabel>
        <div className="py-8 text-center text-[--text-tertiary] text-xs font-mono">No trend data.</div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Trend Analysis</SectionLabel>
        <span className="text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">
          {models.length} models tracked
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
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
    </SurfaceCard>
  );
}

function TrendRow({ model, grade }: { model: NIMModel; grade: TrendGrade }) {
  const recent = model.reliabilityHistory.slice(-6);
  const points = recent
    .map((v: { time: string; score: number }, i: number) => {
      const x = (i / Math.max(recent.length - 1, 1)) * 32;
      const y = 10 - ((v.score - 90) / 15) * 8 - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-[--surface-elevated] transition-colors group min-w-0">
      <span className="text-xs text-[--text-primary] truncate flex-1 group-hover:underline">{model.name}</span>
      <svg width="32" height="12" viewBox="0 0 32 12" className="shrink-0 overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={grade === "rising" ? "var(--status-healthy)" : grade === "declining" ? "var(--status-critical)" : "var(--status-warn)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[11px] font-mono text-[--text-tertiary] tabular-nums">{model.reliability}%</span>
    </div>
  );
}
