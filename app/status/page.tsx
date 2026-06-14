import Link from "next/link";
import { BuiltBy } from "@/components/site/built-by";
import { getDashboardModels } from "@/lib/dashboard-data";
import { computeFleetState } from "@/lib/operational-engine";
import { formatTimeAgo } from "@/components/dashboard/mock-data";

// ISR — serve from the CDN and revalidate every 30s instead of running a
// function per visit (see app/page.tsx for the full rationale).
export const revalidate = 30;

const STATUS_COLOR: Record<string, string> = {
  healthy: "var(--status-healthy)",
  busy: "var(--status-warn)",
  jammed: "var(--status-critical)",
};

const STATUS_LABEL: Record<string, string> = {
  healthy: "Operational",
  busy: "Degraded",
  jammed: "Disrupted",
};

export default async function StatusPage() {
  const models = await getDashboardModels();
  const enriched = models as unknown as Array<Record<string, unknown>>;
  const fleetState = computeFleetState(enriched);

  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  const healthyPct = models.length ? Math.round((healthy / models.length) * 100) : 0;

  const lastProbe = models.reduce<Date | null>((latest, m) => {
    const d = m.lastChecked instanceof Date ? m.lastChecked : new Date(m.lastChecked);
    return !latest || d > latest ? d : latest;
  }, null);

  const overallStatus =
    jammed > models.length * 0.3 ? "jammed"
    : busy + jammed > models.length * 0.5 ? "busy"
    : "healthy";

  return (
    <div className="min-h-screen text-text-primary bg-surface-base">
      {/* Header */}
      <header className="border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[overallStatus] }}
                  aria-hidden="true"
                />
                <span className="label-sm text-text-tertiary">NIM Stats · Public Status</span>
              </div>
              <h1 className="heading-lg text-text-primary">NVIDIA NIM Endpoint Status</h1>
              <p className="mt-1 body-sm text-text-secondary max-w-lg">
                Live health of free NVIDIA NIM chat-completion endpoints, probed continuously.
                Not affiliated with NVIDIA.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 label-sm font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, ${STATUS_COLOR[overallStatus]} 10%, transparent)`,
                  borderColor: `color-mix(in srgb, ${STATUS_COLOR[overallStatus]} 25%, transparent)`,
                  color: STATUS_COLOR[overallStatus],
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[overallStatus] }} aria-hidden="true" />
                {overallStatus === "healthy" ? "All systems operational" : overallStatus === "busy" ? "Partial degradation" : "Service disruption"}
              </span>
              <p className="metric-xs text-text-quaternary">
                Updated {lastProbe ? formatTimeAgo(lastProbe) : "—"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Fleet summary */}
        <section>
          <h2 className="section-label mb-4">Fleet Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total endpoints", value: `${models.length}`, color: "text-text-primary" },
              { label: "Operational", value: `${healthy}`, color: "text-status-healthy" },
              { label: "Degraded", value: `${busy}`, color: "text-status-warn" },
              { label: "Disrupted", value: `${jammed}`, color: "text-status-critical" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border-base bg-surface-card p-4">
                <p className={`metric-xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="label-xs text-text-tertiary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Health bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="label-xs text-text-tertiary">Fleet health</span>
              <span className="metric-xs text-text-secondary">{healthyPct}% operational</span>
            </div>
            <div className="h-2 rounded-full bg-border-subtle overflow-hidden flex">
              <div className="h-full bg-status-healthy transition-all" style={{ width: `${(healthy / models.length) * 100}%` }} />
              <div className="h-full bg-status-warn transition-all" style={{ width: `${(busy / models.length) * 100}%` }} />
              <div className="h-full bg-status-critical transition-all" style={{ width: `${(jammed / models.length) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4">
              {[
                { color: "bg-status-healthy", label: "Operational" },
                { color: "bg-status-warn", label: "Degraded" },
                { color: "bg-status-critical", label: "Disrupted" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${l.color}`} />
                  <span className="label-xs text-text-quaternary">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Per-model status */}
        <section>
          <h2 className="section-label mb-4">Endpoint Status</h2>
          <div className="rounded-lg border border-border-base overflow-hidden divide-y divide-border-subtle">
            {models.map((m) => {
              const color = STATUS_COLOR[m.status] ?? "var(--text-tertiary)";
              const label = STATUS_LABEL[m.status] ?? m.status;
              return (
                <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-surface-card hover:bg-surface-recessed transition-colors">
                  <div className="min-w-0">
                    <p className="body-sm font-semibold text-text-primary truncate">{m.name}</p>
                    <p className="metric-xs text-text-quaternary">{m.provider}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {m.ttft > 0 && (
                      <span className="metric-xs text-text-tertiary hidden sm:block">
                        {m.ttft}ms TTFT
                      </span>
                    )}
                    <span className="metric-xs text-text-tertiary hidden sm:block">
                      {m.uptime.toFixed(1)}% uptime
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 label-xs font-medium"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
                        color,
                      }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Fleet state note */}
        {fleetState && (
          <section className="rounded-lg border border-border-subtle bg-surface-card px-4 py-4">
            <p className="label-xs text-text-tertiary uppercase tracking-wider mb-1">Fleet assessment</p>
            <p className="body-sm text-text-secondary">{(fleetState as { summary?: string }).summary ?? "Fleet is being monitored."}</p>
          </section>
        )}
      </main>

      <footer className="border-t border-border-subtle mt-8">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="body-xs text-text-quaternary">
            Data refreshes every 30s · Probe cycle every ~10 min · Not affiliated with NVIDIA
          </p>
          <BuiltBy />
          <Link
            href="/"
            className="label-xs text-text-tertiary hover:text-text-secondary transition-colors underline-offset-2 hover:underline"
          >
            Full dashboard →
          </Link>
        </div>
      </footer>
    </div>
  );
}
