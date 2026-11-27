"use client";

import { useMemo, useState } from "react";
import { useReliability } from "@/lib/client/use-reliability";
import { usePreferences } from "@/lib/client/preferences";
import { slaBudget, fmtDuration } from "@/lib/reliability-format";
import type { ModelReliability, SlaWindow } from "@/lib/reliability-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusGlyph, type GlyphState } from "./status-glyph";
import { Seg } from "@/components/ui/seg";

type WindowKey = "d1" | "d7" | "d30";
const WINDOWS: { key: WindowKey; label: string; days: number }[] = [
  { key: "d1", label: "24h", days: 1 },
  { key: "d7", label: "7d", days: 7 },
  { key: "d30", label: "30d", days: 30 },
];
const TARGETS = [99.5, 99.9, 99.95, 99.99];

interface Row {
  model: ModelReliability;
  win: SlaWindow;
  budget: ReturnType<typeof slaBudget>;
}

function verdict(budget: Row["budget"]): { label: string; glyph: GlyphState } {
  if (budget.passing == null || budget.budgetUsedPct == null) return { label: "No data", glyph: "neutral" };
  if (!budget.passing) return { label: "Breach", glyph: "jammed" };
  if (budget.budgetUsedPct >= 75) return { label: "At risk", glyph: "busy" };
  return { label: "Pass", glyph: "healthy" };
}

// A breaching model can burn many multiples of its tiny error budget (e.g. 13%
// uptime against a 99.9% target ≈ 86,000% used), which renders as nonsense.
// Cap the readout — past 100% the only useful signal is "budget blown".
function fmtBudgetUsed(pct: number | null): string {
  if (pct == null) return "—";
  if (pct > 100) return "100%+";
  return `${Math.round(pct)}%`;
}

export function SlaTracker() {
  const { data, loading, error } = useReliability();
  const { prefs, setSlaTarget } = usePreferences();
  const [win, setWin] = useState<WindowKey>("d7");

  const target = prefs.slaTarget;
  const windowDays = WINDOWS.find((w) => w.key === win)!.days;

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    return data.models
      .map((m) => {
        const w = m.sla[win];
        return { model: m, win: w, budget: slaBudget(w.uptime, target, windowDays) };
      })
      .filter((r) => r.win.total > 0)
      .sort((a, b) => {
        // Breaches first, then by budget used desc.
        const av = a.budget.budgetUsedPct ?? -1;
        const bv = b.budget.budgetUsedPct ?? -1;
        return bv - av;
      });
  }, [data, win, target, windowDays]);

  const passing = rows.filter((r) => r.budget.passing === true).length;
  const breaching = rows.filter((r) => r.budget.passing === false).length;

  return (
    <section aria-label="SLA compliance" className="panel col-span-12 flex flex-col min-[1100px]:col-span-6">
      <div className="hdiv">
        <h2 className="heading-md">SLA compliance</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(target)} onValueChange={(v) => setSlaTarget(Number(v))}>
            <SelectTrigger aria-label="SLA target" className="min-w-[132px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGETS.map((t) => (
                <SelectItem key={t} value={String(t)}>{t}% target</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Seg role="group" aria-label="SLA window">
            {WINDOWS.map((w) => (
              <button key={w.key} type="button" onClick={() => setWin(w.key)} aria-pressed={win === w.key}>
                {w.label}
              </button>
            ))}
          </Seg>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-border-subtle px-4 py-4 md:px-6">
        <Stat glyph="healthy" label="Meeting SLA" value={`${passing}`} />
        <Stat glyph={breaching > 0 ? "jammed" : "neutral"} label="Breaching" value={`${breaching}`} />
        <Stat label="Allowed downtime" value={fmtDuration(((100 - target) / 100) * windowDays * 24 * 60)} />
      </dl>

      {/* One fixed box for loading, loaded, error and empty (R10a). */}
      <div
        role="region"
        tabIndex={0}
        aria-label={`Uptime and error budget by endpoint against the ${target}% target. Scrollable.`}
        aria-busy={loading && !data}
        className="h-[420px] overflow-auto scroll-y-lane"
      >
        {!data || rows.length === 0 ? (
          <p className="px-4 py-8 body-sm text-text-muted md:px-6" role={error && !data ? "alert" : undefined}>
            {!data
              ? loading ? "Loading SLA data…" : error ? "Couldn’t load SLA data." : "No SLA data yet."
              : "No samples in this window yet."}
          </p>
        ) : (
          <table className="dtable dtable--sm">
            <caption className="sr-only">Uptime and error budget by endpoint against the {target}% target</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-[1]">Model</th>
                <th scope="col" className="r sticky top-0 z-[1]">Uptime</th>
                <th scope="col" className="r sticky top-0 z-[1] max-sm:hidden">Downtime</th>
                <th scope="col" className="sticky top-0 z-[1] max-md:hidden">Error budget</th>
                <th scope="col" className="sticky top-0 z-[1]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ model, win: w, budget }) => {
                const v = verdict(budget);
                const used = Math.min(100, budget.budgetUsedPct ?? 0);
                return (
                  <tr key={model.id}>
                    <th scope="row" className="nm max-w-[150px] sm:max-w-[220px]">
                      <span className="block sm:truncate" title={model.name}>{model.name}</span>
                      <span className="mt-0.5 block font-sans body-sm text-text-muted">{model.provider}</span>
                    </th>
                    <td className="r num">{w.uptime != null ? `${w.uptime.toFixed(2)}%` : "—"}</td>
                    <td className="r max-sm:hidden">
                      <span className="font-mono text-xs">
                        {fmtDuration(budget.actualDowntimeMin)}
                        <span className="text-text-muted"> / {fmtDuration(budget.allowedDowntimeMin)}</span>
                      </span>
                    </td>
                    <td className="max-md:hidden">
                      <span className="mbar">
                        <i style={{ "--w": `${used}%` } as React.CSSProperties} />
                        <span className="w-12 text-right font-mono text-xs text-text-primary">{fmtBudgetUsed(budget.budgetUsedPct)}</span>
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-text-primary">
                        <StatusGlyph state={v.glyph} />
                        {v.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, glyph }: { label: string; value: string; glyph?: GlyphState }) {
  return (
    <div>
      <dt className="flex items-center gap-2 body-sm text-text-muted">
        {glyph && <StatusGlyph state={glyph} />}
        {label}
      </dt>
      <dd className="metric-lg text-text-primary">{value}</dd>
    </div>
  );
}
