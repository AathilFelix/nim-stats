"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";

interface ProviderRow {
  name: string;
  count: number;
  avgCongestion: number;
  avgUptime: number;
  degradedCount: number;
  grade: "A" | "B" | "C" | "D";
}

export function ProviderIntelligence({ models }: { models: NIMModel[] }) {
  const providers = useMemo(() => {
    const map = new Map<string, NIMModel[]>();
    models.forEach((m) => {
      const arr = map.get(m.provider) ?? [];
      arr.push(m);
      map.set(m.provider, arr);
    });
    return Array.from(map.entries())
      .map(([name, group]) => {
        const avgCongestion = Math.round(group.reduce((s, m) => s + m.congestion, 0) / group.length);
        const avgUptime =
          Math.round((group.reduce((s, m) => s + m.uptime, 0) / group.length) * 100) / 100;
        const degraded = group.filter((m) => m.status !== "healthy").length;
        let grade: ProviderRow["grade"] = "A";
        if (degraded >= 2 || avgCongestion > 60) grade = "D";
        else if (degraded > 0 || avgCongestion > 45) grade = "C";
        else if (avgCongestion > 30) grade = "B";
        return { name, count: group.length, avgCongestion, avgUptime, degradedCount: degraded, grade };
      })
      .sort((a, b) => a.grade.localeCompare(b.grade));
  }, [models]);

  const gradeConfig: Record<string, { color: string; bg: string; border: string }> = {
    A: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
    B: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
    C: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
    D: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  };

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
        Provider Intelligence
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-1.5"
        style={{ border: '1px solid var(--border-base)', borderRadius: '0.5rem' }}
      >
        {providers.map((p, i) => {
          const gc = gradeConfig[p.grade] ?? gradeConfig.B;
          return (
            <div
              key={p.name}
              className="flex items-center justify-between p-3"
              style={{
                borderBottom: i < providers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-bold"
                    style={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontSize: '0.65rem',
                      color: gc.color,
                      backgroundColor: gc.bg,
                      border: `1px solid ${gc.border}`,
                    }}
                  >
                    {p.grade}
                  </span>
                  <span
                    className="font-medium truncate"
                    style={{
                      fontFamily: '"IBM Plex Sans", sans-serif',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1.5 ml-8">
                  <MiniStat label="CONG" value={`${p.avgCongestion}%`} warn={p.avgCongestion > 50} />
                  <MiniStat label="UP" value={`${p.avgUptime}%`} />
                  <MiniStat
                    label="DEGR"
                    value={String(p.degradedCount)}
                    warn={p.degradedCount > 0}
                  />
                </div>
              </div>
              <span
                className="text-text-tertiary tabular-nums ml-3"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                }}
              >
                {p.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="uppercase"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.55rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${warn ? 'text-amber-500' : ''}`}
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.7rem',
          color: warn ? '#f59e0b' : 'var(--text-secondary)',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
    </div>
  );
}
