"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";

interface Props {
  models: NIMModel[];
}

interface RankingEntry {
  model: NIMModel;
  score: number;
}

export function UseCaseRankings({ models }: Props) {
  const categories = useMemo(() => {
    const coding = useCaseScore(models, (m) => m.throughput * 0.5 + (200 - m.ttft) * 0.3 + (100 - m.congestion) * 0.2);
    const reasoning = useCaseScore(models, (m) => m.reliability * 0.6 + (m.sessionReliability.score ?? 50) * 0.4);
    const longContext = useCaseScore(models, (m) => m.uptime * 0.4 + (m.sessionReliability.score ?? 50) * 0.4 + m.reliability * 0.2);
    const lowLatency = useCaseScore(models, (m) => (200 - Math.min(m.ttft, 200)) * 0.6 + (m.p95Latency ?? 200) * 0.4);
    const stability = useCaseScore(models, (m) => m.uptime * 0.4 + m.reliability * 0.3 + (100 - ((m.volatility.score ?? 10) * 3)) * 0.3);

    return [
      { label: "Coding", entries: coding },
      { label: "Reasoning", entries: reasoning },
      { label: "Long Context", entries: longContext },
      { label: "Low Latency", entries: lowLatency },
      { label: "Stability", entries: stability },
    ];
  }, [models]);

  return (
    <div className="space-y-3">
      <p
        className="uppercase tracking-wider font-medium"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.12em',
          fontWeight: 600,
        }}
      >
        Use-case Rankings
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1.5"
        style={{ border: '1px solid var(--border-base)', borderRadius: '0.5rem' }}
      >
        {categories.map((cat) => (
          <div key={cat.label} className="p-3">
            <p
              className="uppercase tracking-wider mb-2"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.6rem',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              {cat.label}
            </p>
            <div className="space-y-1">
              {cat.entries.slice(0, 3).map((entry, i) => (
                <div key={entry.model.id} className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-sm shrink-0"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.25)',
                      backgroundColor: 'rgba(16,185,129,0.1)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="truncate flex-1"
                    style={{
                      fontFamily: '"IBM Plex Sans", sans-serif',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {entry.model.name}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '0.65rem',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {entry.score.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function useCaseScore(models: NIMModel[], scorer: (m: NIMModel) => number): RankingEntry[] {
  return models.map((m) => ({ model: m, score: scorer(m) })).sort((a, b) => b.score - a.score);
}
