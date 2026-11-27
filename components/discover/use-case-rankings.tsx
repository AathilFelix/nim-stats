"use client";

import { useMemo } from "react";
import { Award, Trophy } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { RankBadge, GradeBadge } from "./discover-primitives";
import { PanelHeader } from "./ops-primitives";
import { cn, svgPoint } from "@/lib/utils";

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

export function UseCaseRankings({ models }: UseCaseRankingsProps) {
  const ranked = useMemo(
    () => [...models].sort((a, b) => score(b) - score(a)),
    [models],
  );

  const top3 = ranked.slice(0, 3);
  const topScore = top3.length > 0 ? score(top3[0]) : 1;

  if (!models.length) {
    return (
      <section className="ops-card">
        <PanelHeader label="Overall rankings" icon={Trophy} tone="info" />
        <div className="py-8 text-center body-sm text-text-muted">No models.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Overall rankings"
        icon={Trophy}
        tone="info"
        meta={<span>{ranked.length} ranked by throughput, reliability and congestion</span>}
      />

      <div className="panel-pad">
      {/* Podium — top 3 */}
      {top3.length >= 1 && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-center">
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
      <div className="mb-3 h-px bg-border-subtle" />

      {/* Leaderboard list */}
      <div className="animate-stagger">
        {ranked.map((model, idx) => (
          <div
            key={model.id}
            className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-surface-recessed"
          >
            <RankBadge rank={idx + 1} />
            <div className="flex-1 min-w-0">
              <div className="truncate font-mono text-sm text-text-primary">{model.name}</div>
              <div className="body-xs text-text-muted">{model.provider}</div>
            </div>
            <InlineSparkline data={model.throughputHistory} />
            <span className="w-10 text-right font-mono text-sm tabular-nums text-text-primary">
              {score(model).toFixed(0)}
            </span>
            <GradeBadge grade={letterGrade(score(model))} />
          </div>
        ))}
      </div>
      </div>
    </section>
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
        "min-w-0 flex-1 rounded-lg border p-3 text-center",
        highlight ? "border-text-primary bg-surface-elevated max-sm:order-first sm:min-h-[120px]" : "border-border-subtle bg-surface-recessed",
        !highlight && (rank === 2 ? "sm:min-h-[100px]" : "sm:min-h-[85px]"),
      )}
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        <Award className="h-4 w-4 text-text-muted" aria-hidden="true" />
        <span className={cn("body-sm", rank === 1 ? "font-medium text-text-primary" : "text-text-muted")}>
          {rank === 1 ? "Best overall" : rank === 2 ? "Runner up" : "Third"}
        </span>
      </div>
      <div className="mb-0.5 truncate font-mono text-sm text-text-primary">{model.name}</div>
      <div className="mb-2 body-xs text-text-muted">{model.provider}</div>
      <div className="mb-1 h-1 w-full overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: highlight ? "var(--text-primary)" : "var(--text-muted)",
          }}
        />
      </div>
      <div className="font-mono text-xs tabular-nums text-text-muted">{s.toFixed(0)} pts</div>
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
      return svgPoint(x, y);
    })
    .join(" ");

  return (
    <svg width="56" height="16" viewBox="0 0 56 16" className="shrink-0 overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
