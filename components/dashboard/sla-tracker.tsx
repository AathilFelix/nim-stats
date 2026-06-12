"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PanelHeader } from "@/components/discover/ops-primitives";
import { useReliability } from "@/lib/client/use-reliability";
import { usePreferences } from "@/lib/client/preferences";
import { slaBudget, fmtDuration } from "@/lib/reliability-format";
import type { ModelReliability, SlaWindow } from "@/lib/reliability-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

function verdict(budget: Row["budget"]): { label: string; tone: string } {
  if (budget.passing == null || budget.budgetUsedPct == null) return { label: "NO DATA", tone: "text-text-quaternary" };
  if (!budget.passing) return { label: "BREACH", tone: "text-status-critical" };
  if (budget.budgetUsedPct >= 75) return { label: "AT RISK", tone: "text-status-warn" };
  return { label: "PASS", tone: "text-status-healthy" };
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
  const { data, loading } = useReliability();
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
    <section className="ops-card">
      <PanelHeader
        label="SLA Compliance"
        icon={ShieldCheck}
        tone={breaching > 0 ? "critical" : "healthy"}
        meta={
          <div className="flex items-center gap-2">
            <Select value={String(target)} onValueChange={(v) => setSlaTarget(Number(v))}>
              <SelectTrigger size="sm" aria-label="SLA target" className="min-w-[112px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGETS.map((t) => (
                  <SelectItem key={t} value={String(t)}>{t}% target</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0.5 rounded-md border border-border-subtle bg-surface-recessed p-0.5">
              {WINDOWS.map((w) => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => setWin(w.key)}
                  aria-pressed={win === w.key}
                  className={cn(
                    "rounded px-2 py-0.5 metric-xs transition-colors",
                    win === w.key ? "bg-surface-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="flex items-center gap-4 border-b border-border-subtle px-4 py-2.5 sm:px-5">
        <Stat label="Meeting SLA" value={`${passing}`} tone="text-status-healthy" />
        <Stat label="Breaching" value={`${breaching}`} tone={breaching > 0 ? "text-status-critical" : "text-text-secondary"} />
        <Stat label="Allowed downtime" value={fmtDuration(((100 - target) / 100) * windowDays * 24 * 60)} tone="text-text-secondary" />
      </div>

      <div className="max-h-[420px] overflow-y-auto no-scrollbar">
        {loading && !data ? (
          <p className="body-xs text-text-tertiary py-8 text-center">Loading SLA data…</p>
        ) : rows.length === 0 ? (
          <p className="body-xs text-text-tertiary py-8 text-center">No samples in this window yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="label-xs text-text-tertiary px-4 py-2 text-left sm:px-5">Model</th>
                <th className="label-xs text-text-tertiary px-3 py-2 text-right">Uptime</th>
                <th className="label-xs text-text-tertiary px-3 py-2 text-right hidden sm:table-cell">Downtime</th>
                <th className="label-xs text-text-tertiary px-3 py-2 text-left hidden md:table-cell">Error budget</th>
                <th className="label-xs text-text-tertiary px-3 py-2 text-right sm:px-5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ model, win: w, budget }) => {
                const v = verdict(budget);
                const used = Math.min(100, budget.budgetUsedPct ?? 0);
                const over = (budget.budgetUsedPct ?? 0) > 100;
                return (
                  <tr key={model.id} className="border-b border-border-subtle/60 last:border-0">
                    <td className="px-4 py-2.5 sm:px-5">
                      <p className="body-sm font-medium text-text-primary truncate max-w-[180px]" title={model.name}>{model.name}</p>
                      <p className="metric-xs text-text-quaternary">{model.provider}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn("metric-sm", budget.passing ? "text-text-secondary" : "text-status-critical")}>
                        {w.uptime != null ? `${w.uptime.toFixed(2)}%` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden sm:table-cell">
                      <span className="metric-xs text-text-tertiary">
                        {fmtDuration(budget.actualDowntimeMin)}
                        <span className="text-text-quaternary"> / {fmtDuration(budget.allowedDowntimeMin)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border-subtle">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${used}%`,
                              backgroundColor: over
                                ? "var(--status-critical)"
                                : used >= 75
                                  ? "var(--status-warn)"
                                  : "var(--status-healthy)",
                            }}
                          />
                        </div>
                        <span className={cn("metric-xs w-12", over ? "text-status-critical" : "text-text-quaternary")}>
                          {fmtBudgetUsed(budget.budgetUsedPct)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right sm:px-5">
                      <span className={cn("metric-xs font-semibold", v.tone)}>{v.label}</span>
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

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col">
      <span className={cn("metric-md", tone)}>{value}</span>
      <span className="label-xs text-text-tertiary">{label}</span>
    </div>
  );
}
