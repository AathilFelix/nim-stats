"use client";

import { useMemo } from "react";
import { Award } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { SurfaceCard, SectionLabel, RankBadge } from "./discover-primitives";
import { cn } from "@/lib/utils";

interface UseCaseRankingsProps {
  models: NIMModel[];
}

function score(model: NIMModel): number {
  return model.throughput * 2 + model.reliability * 3 + (100 - model.congestion) * 1.5;
}

function letterGrade(s: number): string {
  if (s >= 280) return "A";
  if (s >= 250) return "B";
  if (s >= 220) return "C";
  return "D";
}

const gradeColor: Record<string, string> = {
  A: "text-[--status-healthy] bg-[--status-healthy]/[0.08] border-[--status-healthy]/[0.20]",
  B: "text-[--status-warn] bg-[--status-warn]/[0.08] border-[--status-warn]/[0.20]",
  C: "text-[--status-info] bg-[--status-info]/[0.08] border-[--status-info]/[0.20]",
  D: "text-[--status-critical] bg-[--status-critical]/[0.08] border-[--status-critical]/[0.20]",
};

export function UseCaseRankings({ models }: UseCaseRankingsProps) {
  const ranked = useMemo(
    () => [...models].sort((a, b) => score(b) - score(a)),
    [models],
  );

  const top3 = ranked.slice(0, 3);
  const topScore = top3.length > 0 ? score(top3[0]) : 1;

  if (!models.length) {
    return (
      <SurfaceCard className="p-4">
        <SectionLabel>Use-Case Rankings</SectionLabel>
        <div className="py-8 text-center text-[--text-tertiary] text-xs font-mono">No models.</div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Use-Case Rankings</SectionLabel>
        <span className="text-xs font-bold uppercase tracking-[0.10em] text-[--text-tertiary] font-mono">
          {ranked.length} models ranked
        </span>
      </div>

      {/* Podium — top 3 */}
      {top3.length >= 1 && (
        <div className="flex items-end justify-center gap-2 mb-4">
          {/* 2nd place */}
          {top3[1] && (
            <PodiumSlot model={top3[1]} rank={2} topScore={topScore} />
          )}
          {/* 1st place */}
          <PodiumSlot model={top3[0]} rank={1} topScore={topScore} highlight />
          {/* 3rd place */}
          {top3[2] && (
            <PodiumSlot model={top3[2]} rank={3} topScore={topScore} />
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-[--border-subtle] mb-3" />

      {/* Leaderboard list */}
      <div className="animate-stagger">
        {ranked.map((model, idx) => (
          <div
            key={model.id}
            className="flex items-center gap-2.5 py-2 px-2 rounded-lg transition-colors duration-150 hover:bg-[--surface-recessed] border-l-2 border-transparent hover:border-l-[--text-accent]"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <RankBadge rank={idx + 1} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[--text-primary] truncate">{model.name}</div>
              <div className="text-[10px] font-mono text-[--text-tertiary]">{model.provider}</div>
            </div>
            <InlineSparkline data={model.throughputHistory} />
            <span className="text-sm font-mono tabular-nums text-[--text-primary] font-semibold w-10 text-right">
              {score(model).toFixed(0)}
            </span>
            <span className={cn(
              "text-xs font-bold font-mono px-1.5 py-0.5 rounded border w-5 text-center",
              gradeColor[letterGrade(score(model))],
            )}>
              {letterGrade(score(model))}
            </span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

function PodiumSlot({
  model, rank, topScore, highlight = false,
}: {
  model: NIMModel;
  rank: number;
  topScore: number;
  highlight?: boolean;
}) {
  const s = score(model);
  const pct = Math.round((s / topScore) * 100);

  return (
    <div
      className={cn(
        "flex-1 text-center rounded-xl border p-3 transition-all duration-200",
        highlight
          ? "border-[--text-accent]/20 bg-gradient-to-b from-[--text-accent]/[0.05] to-transparent"
          : "border-[--border-subtle] bg-[--surface-recessed]",
      )}
      style={{ minHeight: highlight ? 120 : rank === 2 ? 100 : 85 }}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <Award className={cn(
          "w-3.5 h-3.5",
          rank === 1 ? "text-[--text-accent]" : rank === 2 ? "text-[--text-secondary]" : "text-[--text-tertiary]",
        )} />
        <span className={cn(
          "text-xs font-bold uppercase tracking-[0.08em] font-mono",
          rank === 1 ? "text-[--text-accent]" : "text-[--text-tertiary]",
        )}>
          {rank === 1 ? "Best Overall" : rank === 2 ? "Runner Up" : "Third"}
        </span>
      </div>
      <div className="text-base font-semibold text-[--text-primary] truncate mb-0.5">{model.name}</div>
      <div className="text-xs font-mono text-[--text-tertiary] mb-2">{model.provider}</div>
      <div className="h-1.5 w-full bg-[--border-subtle] rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: highlight ? "var(--text-accent)" : "var(--text-tertiary)",
          }}
        />
      </div>
      <div className="text-xs font-mono tabular-nums text-[--text-tertiary]">{s.toFixed(0)} pts</div>
    </div>
  );
}

function InlineSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return <div className="w-14 h-4" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 56;
      const y = 16 - ((v - min) / range) * 14 - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="56" height="16" viewBox="0 0 56 16" className="shrink-0 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--text-tertiary)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
