"use client";

import { useMemo } from "react";
import { Grid2x2 } from "lucide-react";
import type { NIMModel } from "../dashboard/mock-data";
import { PanelHeader } from "./ops-primitives";

interface ReliabilityHeatmapProps {
  models: NIMModel[];
}

// Fixed column count — the matrix shows the most-recent N probe buckets per
// model so every row lines up into a grid (Penpot: "ReliabilityHeatmap").
const COLS = 12;

type Band = { fg: string; alpha: number };

// Score → status color + background alpha. Bands mirror the Penpot design:
// bright green for near-perfect, green for healthy, amber for wobbly, red for
// unreliable. Colors are the theme-aware status tokens (dark + light).
function band(score: number): Band {
  if (score >= 98) return { fg: "var(--status-healthy)", alpha: 0.16 };
  if (score >= 94) return { fg: "var(--status-healthy)", alpha: 0.09 };
  if (score >= 90) return { fg: "var(--status-warn)", alpha: 0.14 };
  return { fg: "var(--status-critical)", alpha: 0.14 };
}

type Cell = { key: string; score: number | null };

// Last COLS history points, right-aligned. Models with fewer points get empty
// leading cells so the grid stays aligned across rows.
function toCells(model: NIMModel): Cell[] {
  const pts = model.reliabilityHistory.slice(-COLS);
  const pad = COLS - pts.length;
  const cells: Cell[] = [];
  for (let i = 0; i < pad; i++) cells.push({ key: `pad-${i}`, score: null });
  pts.forEach((p, i) => cells.push({ key: `${p.time}-${i}`, score: Math.round(p.score) }));
  return cells;
}

export function ReliabilityHeatmap({ models }: ReliabilityHeatmapProps) {
  const rows = useMemo(
    () =>
      [...models]
        .sort((a, b) => b.reliability - a.reliability)
        .map((m) => ({ model: m, cells: toCells(m) })),
    [models],
  );

  if (!models.length) {
    return (
      <section className="ops-card">
        <PanelHeader label="Reliability Matrix" icon={Grid2x2} tone="info" />
        <div className="py-8 text-center text-text-tertiary body-xs">No data.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Reliability Matrix"
        icon={Grid2x2}
        tone="info"
        meta={<span className="metric-xs">recent · by model</span>}
      />

      <div className="panel-pad space-y-1.5">
        {rows.map(({ model, cells }) => (
          <div key={model.id} className="flex items-center gap-1.5">
            {/* Model name — row label */}
            <span className="w-32 shrink-0 truncate font-mono text-[11px] text-text-secondary">
              {model.name}
            </span>

            {/* Score cells — the matrix body */}
            <div className="grid min-w-0 flex-1 grid-cols-12 gap-1">
              {cells.map((c) => {
                if (c.score == null) {
                  return (
                    <div
                      key={c.key}
                      className="h-7 rounded-[5px] bg-[--border-subtle]"
                    />
                  );
                }
                const { fg, alpha } = band(c.score);
                return (
                  <div
                    key={c.key}
                    className="flex h-7 items-center justify-center rounded-[5px] font-mono text-[11px] tabular-nums"
                    style={{
                      color: fg,
                      background: `color-mix(in srgb, ${fg} ${alpha * 100}%, transparent)`,
                    }}
                    title={`${model.name} · ${c.score}%`}
                  >
                    {c.score}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
