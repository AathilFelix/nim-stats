import type { Metadata } from "next";
import Link from "next/link";
import { BuiltBy } from "@/components/site/built-by";
import { getCatalogFunnel, getDashboardModels } from "@/lib/dashboard-data";
import { CatalogFunnel } from "@/components/dashboard/catalog-funnel";
import { computeFleetState } from "@/lib/operational-engine";
import { TimeAgo } from "@/components/dashboard/time-ago";
import { StatusGlyph, type GlyphState } from "@/components/dashboard/status-glyph";
import { SITE_NAME } from "@/lib/site";
import { CLIENT_REFRESH_MS } from "@/lib/config/cadence";

// See /discover for why every indexable page carries its own title.
export const metadata: Metadata = {
  title: `Live status for free NVIDIA NIM API endpoints | ${SITE_NAME}`,
  description:
    "Live operational status for the free NVIDIA NIM inference endpoints — operational, degraded, or disrupted for every model, updated continuously from real probes.",
  alternates: { canonical: "/status" },
};

// ISR, revalidated on demand every site refresh (20 min); 1800s is only the safety
// net (see app/page.tsx for the full rationale).
export const revalidate = 1800;

// State shapes carry the colour; every word on this page is ink or muted.
const STATUS_GLYPH: Record<string, GlyphState> = {
  healthy: "healthy",
  busy: "busy",
  jammed: "jammed",
};

const STATUS_LABEL: Record<string, string> = {
  healthy: "Operational",
  busy: "Degraded",
  jammed: "Disrupted",
};

export default async function StatusPage() {
  const [models, catalog] = await Promise.all([getDashboardModels(), getCatalogFunnel()]);
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
                <StatusGlyph state={STATUS_GLYPH[overallStatus]} />
                <span className="label-sm text-text-muted">NIM Stats, public status</span>
              </div>
              <h1 className="heading-lg text-text-primary">NVIDIA NIM endpoint status</h1>
              <p className="mt-1 max-w-lg body-sm text-text-muted">
                Live health of free NVIDIA NIM chat-completion endpoints, probed continuously.
                Not affiliated with NVIDIA.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="stc">
                <StatusGlyph state={STATUS_GLYPH[overallStatus]} />
                {overallStatus === "healthy" ? "All systems operational" : overallStatus === "busy" ? "Partial degradation" : "Service disruption"}
              </span>
              <p className="body-sm text-text-muted">
                Updated {lastProbe ? <TimeAgo date={lastProbe} /> : "—"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
        {/* Fleet summary */}
        <section>
          <h2 className="section-label mb-4">Fleet overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total endpoints", value: `${models.length}`, glyph: null },
              { label: "Operational", value: `${healthy}`, glyph: "healthy" as GlyphState },
              { label: "Degraded", value: `${busy}`, glyph: "busy" as GlyphState },
              { label: "Disrupted", value: `${jammed}`, glyph: "jammed" as GlyphState },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border-base bg-surface-card p-4">
                <p className="metric-xl text-text-primary">{s.value}</p>
                <p className="mt-0.5 flex items-center gap-2 body-sm text-text-muted">
                  {s.glyph && <StatusGlyph state={s.glyph} />}
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Health bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="body-sm text-text-muted">Fleet health</span>
              <span className="metric-xs text-text-primary">{healthyPct}% operational</span>
            </div>
            <div className="h-2 rounded-full bg-border-subtle overflow-hidden flex">
              <div className="h-full bg-status-healthy" style={{ width: `${(healthy / models.length) * 100}%` }} />
              <div className="h-full bg-status-warn" style={{ width: `${(busy / models.length) * 100}%` }} />
              <div className="h-full bg-status-critical" style={{ width: `${(jammed / models.length) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4">
              {[
                { glyph: "healthy" as GlyphState, label: "Operational" },
                { glyph: "busy" as GlyphState, label: "Degraded" },
                { glyph: "jammed" as GlyphState, label: "Disrupted" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <StatusGlyph state={l.glyph} />
                  <span className="body-sm text-text-muted">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <CatalogFunnel className="mt-5" catalog={catalog} healthy={healthy} />
        </section>

        {/* Per-model status */}
        <section>
          <h2 className="section-label mb-4">Endpoint status</h2>
          <div className="rounded-lg border border-border-base overflow-hidden divide-y divide-border-subtle">
            {models.map((m) => {
              const label = STATUS_LABEL[m.status] ?? m.status;
              return (
                <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-surface-card hover:bg-surface-recessed transition-colors">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-text-primary">{m.name}</p>
                    <p className="body-sm text-text-muted">{m.provider}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {m.ttft > 0 && (
                      <span className="metric-xs hidden text-text-muted sm:block">
                        {m.ttft} ms first token
                      </span>
                    )}
                    <span className="metric-xs hidden text-text-muted sm:block">
                      {m.uptime.toFixed(1)}% uptime
                    </span>
                    <span className="stc">
                      <StatusGlyph state={STATUS_GLYPH[m.status] ?? "neutral"} />
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
            <p className="mb-1 body-sm text-text-muted">Fleet assessment</p>
            <p className="body-sm text-text-primary">{(fleetState as { summary?: string }).summary ?? "Fleet is being monitored."}</p>
          </section>
        )}
      </main>

      <footer className="border-t border-border-subtle mt-8">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="body-xs text-text-muted">
            Data refreshes every {CLIENT_REFRESH_MS >= 60_000 ? `${Math.round(CLIENT_REFRESH_MS / 60_000)} min` : `${Math.round(CLIENT_REFRESH_MS / 1000)} s`} · Probe cycle every ~10 min · Not affiliated with NVIDIA
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
