"use client";

import type { NIMModel } from "./mock-data";
import { getStatusColor } from "./mock-data";
import { cn } from "@/lib/utils";

interface Props {
  models: NIMModel[];
}

export function ActiveRecommendations({ models }: Props) {
  const recs = [
    { label: "Best for coding", pick: bestByThroughput(models), reason: "Highest throughput" },
    { label: "Best for long sessions", pick: bestBySessionReliability(models), reason: "Highest session reliability" },
    { label: "Lowest congestion", pick: bestLowCongestion(models), reason: "Lowest queue pressure" },
    { label: "Fastest response", pick: bestByTTFT(models), reason: "Lowest latency" },
    { label: "Most stable", pick: bestByStability(models), reason: "Consistent throughput" },
  ].filter((r) => r.pick);

  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-base)',
        borderRadius: '0.5rem',
      }}
    >
      <div
        className="px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
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
          Active Recommendations
        </p>
      </div>

      <div className="p-2">
        {recs.map((rec) => {
          const color = rec.pick ? getStatusColor(rec.pick.status as "healthy" | "busy" | "jammed") : '#10b981';
          return (
            <div
              key={rec.label}
              className="flex items-center gap-2.5 py-2 px-2 transition-colors duration-150"
              style={{
                borderBottom: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-recessed)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}80`,
                }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-text-tertiary uppercase tracking-wider"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.6rem',
                    letterSpacing: '0.06em',
                    fontWeight: 500,
                  }}
                >
                  {rec.label}
                </p>
                <p
                  className="font-semibold truncate mt-0.5"
                  style={{
                    fontFamily: '"IBM Plex Sans", sans-serif',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {rec.pick?.name ?? "—"}
                </p>
              </div>
              <span
                className="text-[10px] text-text-tertiary tabular-nums shrink-0"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {rec.reason}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function bestByThroughput(models: NIMModel[]): NIMModel | undefined {
  return [...models].sort((a, b) => b.throughput - a.throughput)[0];
}
function bestBySessionReliability(models: NIMModel[]): NIMModel | undefined {
  return [...models].sort((a, b) => (b.sessionReliability.score - a.sessionReliability.score))[0];
}
function bestLowCongestion(models: NIMModel[]): NIMModel | undefined {
  return [...models].sort((a, b) => a.congestion - b.congestion)[0];
}
function bestByTTFT(models: NIMModel[]): NIMModel | undefined {
  return [...models].sort((a, b) => a.ttft - b.ttft)[0];
}
function bestByStability(models: NIMModel[]): NIMModel | undefined {
  return [...models].sort((a, b) => b.sessionReliability.score - a.sessionReliability.score)[0];
}
