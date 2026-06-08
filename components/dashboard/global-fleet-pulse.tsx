"use client";

import { useMemo } from "react";
import type { NIMModel } from "./mock-data";
import { cn } from "@/lib/utils";
import { TYPE_SCALE } from "@/lib/design-tokens";

interface Props {
  models: NIMModel[];
}

export function GlobalFleetPulse({ models }: Props) {
  const total = useMemo(
    () => models.reduce((s, m) => s + m.throughput, 0) || 1,
    [models],
  );

  const segments = useMemo(
    () =>
      models.map((m) => ({
        id: m.id,
        name: m.name.split(" ").slice(0, 2).join(""),
        width: (m.throughput / total) * 100,
        color: m.status === "healthy" ? "#10b981" : m.status === "busy" ? "#f59e0b" : "#ef4444",
      })),
    [models, total],
  );

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-base)',
        borderRadius: '0.5rem',
      }}
    >
      <p
        className="uppercase tracking-wider font-medium mb-4"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.12em',
          fontWeight: 600,
        }}
      >
        Fleet Throughput Distribution
      </p>

      <div className="flex h-7 gap-px">
        {segments.map((s) => (
          <div
            key={s.id}
            className="relative transition-all duration-500 first:rounded-l-sm last:rounded-r-sm cursor-crosshair"
            style={{
              width: `${s.width}%`,
              backgroundColor: s.color,
              opacity: 0.75,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {s.width > 8 && (
                <span
                  className="text-white/90 px-1 truncate"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                  }}
                >
                  {s.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <p
          className="tabular-nums"
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            letterSpacing: '-0.01em',
          }}
        >
          Total: {total.toFixed(1)} tok/s
        </p>
        <div className="flex items-center gap-3">
          <Legend color="#10b981" label="Healthy" />
          <Legend color="#f59e0b" label="Busy" />
          <Legend color="#ef4444" label="Jammed" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span
        className="uppercase tracking-wider"
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </span>
  );
}
