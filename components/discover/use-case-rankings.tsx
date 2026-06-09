"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import { GradeBadge, SectionLabel } from "./discover-primitives";
import { SurfaceCard } from "./discover-primitives";

interface UseCaseRankingsProps {
  models: NIMModel[];
}

interface UseCaseBlock {
  label: string;
  entries: { model: NIMModel; score: number }[];
}

export function UseCaseRankings({ models }: UseCaseRankingsProps) {
  const blocks = useMemo<UseCaseBlock[]>(() => {
    const rankWith = (scorer: (m: NIMModel) => number) =>
      models
        .map((m) => ({ model: m, score: scorer(m) }))
        .sort((a, b) => b.score - a.score);

    return [
      { label: "Coding", entries: rankWith((m) => m.throughput * 0.5 + (200 - m.ttft) * 0.3 + (100 - m.congestion) * 0.2) },
      { label: "Reasoning", entries: rankWith((m) => m.reliability * 0.6 + ((m.sessionReliability as { score?: number }).score ?? 50) * 0.4) },
      { label: "Long Context", entries: rankWith((m) => m.uptime * 0.4 + ((m.sessionReliability as { score?: number }).score ?? 50) * 0.4 + m.reliability * 0.2) },
      { label: "Low Latency", entries: rankWith((m) => (200 - Math.min(m.ttft, 200)) * 0.6 + (m.p95Latency ?? 200) * 0.4) },
      { label: "Stability", entries: rankWith((m) => m.uptime * 0.4 + m.reliability * 0.3 + (100 - ((m.volatility as { score?: number }).score ?? 10) * 3) * 0.3) },
    ];
  }, [models]);

  return (
    <SurfaceCard className="p-2">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
        <SectionLabel>Use-case Rankings</SectionLabel>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-border">
        {blocks.map((block) => (
          <div key={block.label} className="p-2">
            <SectionLabel className="mb-1">{block.label}</SectionLabel>
            <div className="space-y-0.5">
              {block.entries.slice(0, 3).map((entry, i) => (
                <div
                  key={entry.model.id}
                  className="flex items-center gap-1.5 py-0.5"
                >
                  <GradeBadge grade={["A", "B", "C"][i] ?? "C"} />
                  <span className="truncate text-[11px] text-foreground">
                    {entry.model.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
