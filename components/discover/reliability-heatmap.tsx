"use client";

import { useMemo } from "react";
import type { NIMModel } from "../dashboard/mock-data";
import { SectionLabel, SurfaceCard } from "./discover-primitives";

interface Props {
  models: NIMModel[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function bandFor(score: number) {
  if (score >= 99.5) return "high";
  if (score >= 99) return "mid";
  if (score >= 97) return "low";
  return "critical";
}

function hashDayScore(modelId: string, dayIndex: number): number {
  let h = 0;
  for (let i = 0; i < modelId.length; i++) {
    h = ((h << 5) - h + modelId.charCodeAt(i) + dayIndex) | 0;
  }
  const base = 95 + (Math.abs(h) % 5);
  const swing = (Math.abs(h * 7) % 3) - 1;
  return Math.min(100, Math.max(90, base + swing));
}

export function ReliabilityHeatmap({ models }: Props) {
  const rows = useMemo(
    () =>
      models.map((m) => ({
        model: m,
        cells: DAYS.map((_, i) => {
          const score = hashDayScore(m.id, i);
          return { score, band: bandFor(score) };
        }),
      })),
    [models],
  );

  return (
    <SurfaceCard className="p-0">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <SectionLabel>Reliability Heatmap</SectionLabel>
        <div className="flex items-center gap-3">
          <Palette label="≥99" band="high" />
          <Palette label="≥97" band="mid" />
          <Palette label="≥95" band="low" />
          <Palette label="<95" band="critical" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          <div
            className="grid items-center border-b border-border text-muted-foreground"
            style={{
              gridTemplateColumns: `6.5rem repeat(${DAYS.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-mono tabular-nums py-1">
                {d}
              </div>
            ))}
          </div>
          {rows.map((row, rowIdx) => (
            <div
              key={row.model.id}
              className={`grid items-center gap-px text-foreground ${
                rowIdx < rows.length - 1 ? "border-b border-border" : ""
              }`}
              style={{ gridTemplateColumns: `6.5rem repeat(${DAYS.length}, minmax(0, 1fr))` }}
            >
              <span className="text-[11px] font-mono truncate pr-2 py-1">{row.model.name}</span>
              {row.cells.map((cell) => {
                const palette = BAND_PALETTE[cell.band];
                return (
                  <div key={cell.band} className={`flex items-center justify-center h-5 ${palette.bg}`}>
                    <span className={`text-[10px] font-mono tabular-nums leading-5 ${palette.text}`}>
                      {cell.score.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

const BAND_PALETTE = {
  high: { bg: "bg-emerald-500/[0.08]", text: "text-emerald-600 dark:text-emerald-400" },
  mid: { bg: "bg-emerald-500/[0.06]", text: "text-emerald-400 dark:text-emerald-500" },
  low: { bg: "bg-amber-500/[0.08]", text: "text-amber-600 dark:text-amber-400" },
  critical: { bg: "bg-red-500/[0.08]", text: "text-red-600 dark:text-red-400" },
} as const;

type CellBand = keyof typeof BAND_PALETTE;

function Palette({ label, band }: { label: string; band: CellBand }) {
  const palette = BAND_PALETTE[band];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${palette.text}`}>
      <span className={`h-2 w-3 rounded-[2px] opacity-75 ${palette.bg}`} />
      {label}
    </span>
  );
}
