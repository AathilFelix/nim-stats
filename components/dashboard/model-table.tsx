"use client";

import { useState, type CSSProperties } from "react";
import { Star } from "lucide-react";
import { Tick } from "@/components/ui/tick";
import { StatusPill, STATUS_WORD, humanize } from "@/components/dashboard/status-pill";
import { StatusGlyph, type GlyphState } from "@/components/dashboard/status-glyph";
import { Sparkline } from "@/components/dashboard/sparkline";
import { TimeAgo } from "@/components/dashboard/time-ago";
import { cn, formatTput } from "@/lib/utils";
import type { NIMModel } from "./mock-data";

interface ModelTableProps {
  models: NIMModel[];
  /** Set of favorited model ids — renders a leading pin column when provided. */
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  /** Open a detail view for a model (row / name click). */
  onSelect?: (model: NIMModel) => void;
  /** Skip the built-in status sort (caller already ordered the rows). */
  presorted?: boolean;
  /** Also show the operational columns (congestion, session, P95 …). md and up. */
  advanced?: boolean;
  /**
   * Rows of height to keep while a filter narrows the list, so the footer line
   * under the table does not jump (R10). Omit for a table that sizes to its rows.
   */
  reserveRows?: number;
}

// Columns behind the "All metrics" toggle, in their original order.
const ADVANCED_COLS = [
  "Congestion", "Session reliability", "Volatility", "Timeout", "P95", "P99",
  "Recovery", "Queue", "Routing", "Trend",
];

// Each state-word column keeps its meaning in the word; the shape carries the tone.
const SESSION: Record<string, GlyphState> = { stable: "healthy", moderate_interruption_risk: "busy" };
const VOLATILITY: Record<string, GlyphState> = { stable: "healthy", fluctuating: "busy" };
const PRESSURE: Record<string, GlyphState> = { low: "healthy", elevated: "busy" };
const ROUTING: Record<string, GlyphState> = { high_confidence: "healthy", moderate_confidence: "busy" };
const tone = (map: Record<string, GlyphState>, key: string | undefined): GlyphState => map[key ?? ""] ?? "neutral";

const ms = (v: number) => (v > 0 ? <>{v}<span className="u">ms</span></> : "—");
// A table numeral that changed since the last render gets the colour-neutral wash.
const mt = (v: number) => (v > 0 ? <><Tick value={v} variant="wash" /><span className="u">ms</span></> : "—");

function Word({ glyph, children }: { glyph: GlyphState; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-text-primary">
      <StatusGlyph state={glyph} />
      {children}
    </span>
  );
}

function PinButton({ model, pinned, onToggle, className }: {
  model: NIMModel; pinned: boolean; onToggle: (id: string) => void; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(model.id);
      }}
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${model.name}` : `Pin ${model.name}`}
      title={pinned ? "Unpin from watchlist" : "Pin to watchlist"}
      className={cn(
        "press grid h-8 w-8 shrink-0 place-items-center rounded-sm hover:bg-chip",
        pinned ? "text-text-primary" : "text-text-muted hover:text-text-primary",
        className,
      )}
    >
      <Star className="h-4 w-4" fill={pinned ? "currentColor" : "none"} strokeWidth={1.75} />
    </button>
  );
}

export function ModelTable({ models, favorites, onToggleFavorite, onSelect, presorted, advanced = false, reserveRows }: ModelTableProps) {
  // M12: rows whose id was not in the previous render fade in (160ms, no travel);
  // rows that leave just go. Never on first paint, and never when only the order or
  // the values changed. Derived during render so the class is on the row's first paint.
  const ids = models.map((m) => m.id).join("\n");
  const [seen, setSeen] = useState<{ ids: string; all: Set<string>; fresh: Set<string> }>(() => ({
    ids,
    all: new Set(models.map((m) => m.id)),
    fresh: new Set(),
  }));
  if (seen.ids !== ids) {
    setSeen({
      ids,
      all: new Set(models.map((m) => m.id)),
      fresh: new Set(models.filter((m) => !seen.all.has(m.id)).map((m) => m.id)),
    });
  }

  const sorted = presorted
    ? models
    : [...models].sort((a, b) => {
        const order = { jammed: 0, busy: 1, healthy: 2 } as Record<string, number>;
        return order[a.status] - order[b.status];
      });

  const showStar = !!onToggleFavorite;
  const selectable = !!onSelect;
  // Throughput bars scale to the fastest endpoint in view.
  const maxTput = sorted.reduce((m, x) => Math.max(m, x.throughput), 0);

  return (
    <div className={reserveRows ? "dtable-reserve" : undefined} style={reserveRows ? ({ "--rows": reserveRows } as CSSProperties) : undefined}>
      <div className="scroll-x-lane">
        <table className="dtable">
          <caption className="sr-only">NVIDIA NIM endpoint status and reliability metrics</caption>
          <thead>
            <tr>
              {showStar && (
                <th scope="col" className="stick left-0 w-10 min-w-10 max-md:hidden md:w-14 md:min-w-14">
                  <span className="sr-only">Pinned</span>
                </th>
              )}
              <th scope="col" className={cn("stick max-md:w-full", showStar ? "max-md:pl-4 md:left-14" : "left-0")}>Model</th>
              <th scope="col" className="col-provider max-md:hidden">Provider</th>
              <th scope="col" className="col-status max-md:hidden">Status</th>
              <th scope="col" className="r">First token</th>
              <th scope="col" className="r">Throughput</th>
              <th scope="col" className="r max-md:hidden">Up, 24 h</th>
              {advanced &&
                ADVANCED_COLS.map((label) => (
                  <th key={label} scope="col" className="max-md:hidden">{label}</th>
                ))}
              <th scope="col" className="r max-md:hidden">Checked</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((model) => {
              const sRel = model.sessionReliability as { score: number; state: string };
              const vol = model.volatility as { measure: string; score: number };
              const fav = favorites?.has(model.id) ?? false;
              const word = STATUS_WORD[model.status];
              return (
                <tr
                  key={model.id}
                  className={cn("active:bg-surface-recessed", selectable && "cursor-pointer", seen.fresh.has(model.id) && "row-new")}
                  onClick={selectable ? () => onSelect!(model) : undefined}
                >
                  {showStar && (
                    <td className="stick left-0 w-10 min-w-10 max-md:hidden md:w-14 md:min-w-14">
                      <PinButton model={model} pinned={fav} onToggle={onToggleFavorite!} />
                    </td>
                  )}
                  <th scope="row" className={cn("nm stick", showStar ? "max-md:pl-4 md:left-14" : "left-0")}>
                    {selectable ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelect!(model); }}
                        className="rounded-xs text-left underline-offset-[3px] hover:underline"
                      >
                        {model.name}
                      </button>
                    ) : (
                      model.name
                    )}
                    {/* Below md the provider and state fold under the name. */}
                    <small className="mt-1 flex items-center gap-2 body-sm text-text-muted md:hidden">
                      <StatusGlyph state={model.status} />
                      <span className="min-w-0">{model.provider}, {word.toLowerCase()}</span>
                      {showStar && <PinButton model={model} pinned={fav} onToggle={onToggleFavorite!} className="ml-auto -my-1 -mr-2" />}
                    </small>
                  </th>
                  <td className="col-provider max-md:hidden">{model.provider}</td>
                  <td className="col-status max-md:hidden">
                    <Tick value={model.status} variant="fade">
                      <StatusPill status={model.status} size="sm" />
                    </Tick>
                  </td>
                  <td className="r num">{mt(model.ttft)}</td>
                  <td className="r num">
                    <span className="mbar">
                      {model.throughput > 0 && maxTput > 0 && (
                        <i className="max-md:hidden" style={{ "--w": `${Math.min(100, (model.throughput / maxTput) * 100)}%` } as React.CSSProperties} />
                      )}
                      <span className="min-w-[76px] text-right max-md:min-w-0">
                        {model.throughput > 0 ? <Tick value={formatTput(model.throughput)} variant="wash" /> : formatTput(model.throughput)}
                        {model.throughput > 0 && <span className="u">tok/s</span>}
                      </span>
                    </span>
                  </td>
                  <td className="r num max-md:hidden">
                    <Tick value={model.uptime.toFixed(2)} variant="wash" />%
                  </td>
                  {advanced && (
                    <>
                      <td className="max-md:hidden">
                        <span className="mbar justify-start text-text-primary">
                          <i style={{ "--w": `${Math.min(100, model.congestion)}%` } as React.CSSProperties} />
                          <span className="min-w-[3ch] text-right font-mono text-sm">{model.congestion}%</span>
                        </span>
                      </td>
                      <td className="max-md:hidden">
                        <Word glyph={tone(SESSION, sRel?.state)}>
                          <span className="font-mono text-sm">{sRel?.score ?? "—"}</span>
                          <span className="text-text-muted">{humanize(sRel?.state)}</span>
                        </Word>
                      </td>
                      <td className="max-md:hidden">
                        <Word glyph={tone(VOLATILITY, vol?.measure)}>{humanize(vol?.measure)}</Word>
                      </td>
                      <td className="num max-md:hidden">{model.timeoutRate.toFixed(1)}%</td>
                      <td className="num max-md:hidden">{ms(model.p95Latency)}</td>
                      <td className="num max-md:hidden">{ms(model.p99Latency)}</td>
                      <td className="max-md:hidden">{humanize(model.recovery as string)}</td>
                      <td className="max-md:hidden">
                        <Word glyph={tone(PRESSURE, model.queuePressure as string)}>{humanize(model.queuePressure as string)}</Word>
                      </td>
                      <td className="max-md:hidden">
                        <Word glyph={tone(ROUTING, model.routingConfidence as string)}>
                          {humanize(model.routingConfidence as string)}
                        </Word>
                      </td>
                      <td className="max-md:hidden">
                        <Sparkline data={model.throughputHistory} height={24} />
                      </td>
                    </>
                  )}
                  <td className="r max-md:hidden">
                    <TimeAgo date={model.lastChecked} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-10">
          <StatusGlyph state="neutral" />
          <p className="body-sm text-text-muted">No endpoints match the current filters.</p>
        </div>
      )}
    </div>
  );
}
