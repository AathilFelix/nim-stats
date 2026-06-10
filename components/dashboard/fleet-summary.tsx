import type { FleetStateResult } from "@/lib/operational-types";

interface Props {
  fleetState: FleetStateResult;
  total: number;
  healthy: number;
  busy: number;
  jammed: number;
  avgTtft: number;
  avgThroughput: number;
  incidents24h: number;
  lastProbe: string | null;
}

const STATE_META: Record<FleetStateResult["state"], { label: string; tone: "healthy" | "warn" | "critical" }> = {
  healthy: { label: "Operational", tone: "healthy" },
  recovery_in_progress: { label: "Recovering", tone: "warn" },
  elevated_congestion: { label: "Elevated congestion", tone: "warn" },
  partial_degradation: { label: "Partial degradation", tone: "critical" },
};

const TONE_TEXT = {
  healthy: "text-(--status-healthy)",
  warn: "text-(--status-warn)",
  critical: "text-(--status-critical)",
} as const;

export function FleetSummary({
  fleetState, total, healthy, busy, jammed, avgTtft, avgThroughput, incidents24h, lastProbe,
}: Props) {
  const meta = STATE_META[fleetState.state];
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <section className="overflow-hidden rounded-xl border border-border-base bg-surface-card">
      <div className="grid gap-px bg-border-subtle md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Status */}
        <div className="bg-surface-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className={`status-led status-led--${meta.tone}`} aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Fleet status</span>
          </div>
          <p className={`mt-2.5 text-2xl font-semibold tracking-tight ${TONE_TEXT[meta.tone]}`}>{meta.label}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {healthy} of {total} endpoints healthy
          </p>

          <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
            <span className="bg-(--status-healthy)" style={{ width: `${pct(healthy)}%` }} />
            <span className="bg-(--status-warn)" style={{ width: `${pct(busy)}%` }} />
            <span className="bg-(--status-critical)" style={{ width: `${pct(jammed)}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
            <Legend tone="healthy" label="Healthy" n={healthy} />
            <Legend tone="warn" label="Busy" n={busy} />
            <Legend tone="critical" label="Jammed" n={jammed} />
          </div>
        </div>

        <Tile label="Avg latency" value={Math.round(avgTtft).toString()} unit="ms" />
        <Tile label="Avg throughput" value={avgThroughput.toFixed(1)} unit="tok/s" />
        <Tile
          label="Incidents 24h"
          value={incidents24h.toString()}
          unit={incidents24h === 0 ? "all clear" : "critical"}
          tone={incidents24h > 0 ? "critical" : undefined}
          sub={lastProbe ? `Updated ${lastProbe}` : undefined}
        />
      </div>
    </section>
  );
}

function Tile({
  label, value, unit, tone, sub,
}: { label: string; value: string; unit: string; tone?: "critical"; sub?: string }) {
  return (
    <div className="flex flex-col justify-center bg-surface-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums text-text-primary">
        {value}
        <span className={`ml-1.5 text-xs font-normal ${tone === "critical" ? "text-(--status-critical)" : "text-text-tertiary"}`}>
          {unit}
        </span>
      </p>
      {sub && <p className="mt-1 text-xs text-text-tertiary">{sub}</p>}
    </div>
  );
}

const DOT_BG = {
  healthy: "bg-(--status-healthy)",
  warn: "bg-(--status-warn)",
  critical: "bg-(--status-critical)",
} as const;

function Legend({ tone, label, n }: { tone: "healthy" | "warn" | "critical"; label: string; n: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_BG[tone]}`} aria-hidden="true" />
      {label} <span className="font-mono tabular-nums text-text-secondary">{n}</span>
    </span>
  );
}
