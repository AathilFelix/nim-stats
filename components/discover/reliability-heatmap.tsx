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

// Score -> level for `.score-cell` in globals.css: faint emerald tints with ink
// text, and a hatch under 90 so the worst cells never rely on a hue.
function level(score: number): string {
  if (score >= 98) return "4";
  if (score >= 94) return "3";
  if (score >= 90) return "2";
  return "bad";
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
        <PanelHeader label="Reliability matrix" icon={Grid2x2} tone="info" />
        <div className="py-8 text-center body-sm text-text-muted">No data.</div>
      </section>
    );
  }

  return (
    <section className="ops-card">
      <PanelHeader
        label="Reliability matrix"
        icon={Grid2x2}
        tone="info"
        meta={<span>Recent, by model</span>}
      />

      <div className="panel-pad space-y-1.5">
        {rows.map(({ model, cells }) => (
          <div key={model.id} className="flex items-center gap-1.5">
            {/* Model name — row label */}
            <span className="w-24 shrink-0 truncate font-mono text-xs text-text-primary sm:w-32" title={model.name}>
              {model.name}
            </span>

            {/* Score cells — the matrix body */}
            <div className="grid min-w-0 flex-1 grid-cols-12 gap-0.5 sm:gap-1">
              {cells.map((c) => {
                if (c.score == null) {
                  return <div key={c.key} className="score-cell h-7" data-lv="0" />;
                }
                return (
                  <div
                    key={c.key}
                    className="score-cell h-7 font-mono text-xs tabular-nums text-text-primary"
                    data-lv={level(c.score)}
                    title={`${model.name}: ${c.score}%`}
                  >
                    {c.score}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <p className="pt-2 body-sm text-text-muted">Reliability score for each recent probe window. Hatched cells are under 90.</p>
      </div>
    </section>
  );
}
