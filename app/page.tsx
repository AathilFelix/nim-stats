import { Suspense } from "react";
import { NavBar } from "@/components/navigation/nav-bar";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { FleetSummary } from "@/components/dashboard/fleet-summary";
import { FleetTrendChart } from "@/components/dashboard/fleet-trend-chart";
import { BestModelNow } from "@/components/dashboard/best-model-now";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { ModelExplorer } from "@/components/dashboard/model-explorer";
import { SlaTracker } from "@/components/dashboard/sla-tracker";
import { UptimeCalendar } from "@/components/dashboard/uptime-calendar";
import { LatencyHeatmap } from "@/components/dashboard/latency-heatmap";
import { QuotaBanner } from "@/components/dashboard/quota-banner";
import { computeFleetState, findBestModel, getAllIncidents } from "@/lib/operational-engine";
import { getDashboardModels, getFleetTrend } from "@/lib/dashboard-data";
import { formatTimeAgo } from "@/components/dashboard/mock-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [models, trend] = await Promise.all([getDashboardModels(), getFleetTrend()]);

  if (models.length === 0) return <EmptyState />;

  const enriched = models as unknown as Array<Record<string, unknown>>;
  const fleetState = computeFleetState(enriched);
  const bestModel = findBestModel(enriched);
  const incidents = getAllIncidents(enriched);

  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;

  const measuredTput = models.filter((m) => m.throughput > 0);
  const avgThroughput = measuredTput.length
    ? measuredTput.reduce((a, m) => a + m.throughput, 0) / measuredTput.length
    : 0;
  const withTtft = models.filter((m) => m.ttft > 0);
  const avgTtft = withTtft.length ? withTtft.reduce((a, m) => a + m.ttft, 0) / withTtft.length : 0;

  const incidents24h = incidents.filter((i) => i.severity === "critical").length;
  const lastChecked = models.reduce<Date | null>((latest, m) => {
    const d = m.lastChecked instanceof Date ? m.lastChecked : new Date(m.lastChecked);
    return !latest || d > latest ? d : latest;
  }, null);

  // Lightweight list for the calendar / heatmap model pickers (avoids shipping
  // full per-model histories to those client panels).
  const liteModels = models.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    status: m.status,
  }));

  return (
    <div className="min-h-screen text-text-primary">
      <NavBar />
      <AutoRefresh />

      <main style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Command header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="status-led status-led--healthy" style={{ width: 6, height: 6 }} aria-hidden="true" />
                <span className="label-sm text-text-tertiary">Command Center</span>
              </div>
              <h1 className="heading-xl text-text-primary">Fleet Overview</h1>
              <p className="mt-1.5 max-w-xl body-sm text-text-secondary">
                Real-time status and reliability for every free NVIDIA NIM endpoint, probed continuously.
              </p>
            </div>
            <dl className="flex items-center gap-5 sm:gap-6">
              <HeaderStat label="Endpoints" value={`${models.length}`} />
              <HeaderStat label="Healthy" value={`${healthy}`} tone="healthy" />
              <HeaderStat label="Incidents" value={`${incidents24h}`} tone={incidents24h > 0 ? "critical" : "healthy"} />
              <HeaderStat label="Last probe" value={lastChecked ? formatTimeAgo(lastChecked) : "—"} mono />
            </dl>
          </header>

          <div className="space-y-5">
            <FleetSummary
              fleetState={fleetState}
              total={models.length}
              healthy={healthy}
              busy={busy}
              jammed={jammed}
              avgTtft={avgTtft}
              avgThroughput={avgThroughput}
              incidents24h={incidents24h}
              lastProbe={lastChecked ? formatTimeAgo(lastChecked) : null}
            />

            <FleetTrendChart data={trend} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
              <BestModelNow recommendation={bestModel} models={enriched} />
              <IncidentFeed incidents={incidents} />
            </div>

            {/* Anomaly detection is API-only for now (/api/fleet/anomalies).
                The client callout panel popped in below-the-fold content on its
                fetch/60s-poll, shifting scroll position — bad UX. Re-enable once
                that layout shift is solved (reserve space / render in a portal). */}
            <QuotaBanner />

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="section-label">Model Fleet</h2>
                <p className="metric-xs text-text-tertiary">Search, filter, pin & export · {models.length} endpoints</p>
              </div>
              <Suspense fallback={null}>
                <ModelExplorer models={models} />
              </Suspense>
            </section>

            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="section-label">Reliability &amp; SLA</h2>
                <p className="metric-xs text-text-tertiary">Uptime history · time-of-day latency · error budgets</p>
              </div>
              <div className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-2">
                  <SlaTracker />
                  <UptimeCalendar models={liteModels} />
                </div>
                <LatencyHeatmap />
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer
        className="mt-4 border-t border-border-subtle px-4 py-6 sm:px-6 lg:px-8"
        style={{ paddingBottom: "max(1.5rem, var(--safe-bottom))" }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="status-led status-led--healthy" style={{ width: 6, height: 6 }} aria-hidden="true" />
            <p className="body-xs text-text-tertiary">
              Live status of free NVIDIA NIM endpoints. Not affiliated with NVIDIA.
            </p>
          </div>
          <p className="metric-xs text-text-quaternary">Auto-refresh · 30s</p>
        </div>
      </footer>
    </div>
  );
}

function HeaderStat({
  label, value, tone = "neutral", mono = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "healthy" | "critical";
  mono?: boolean;
}) {
  const base = mono ? "metric-sm" : "metric-lg";
  const color = tone === "critical" ? "text-status-critical" : tone === "healthy" ? "text-status-healthy" : "text-text-primary";
  return (
    <div className="flex flex-col items-end">
      <dd className={`${base} ${color}`}>{value}</dd>
      <dt className="label-xs text-text-tertiary mt-0.5">{label}</dt>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen text-text-primary">
      <NavBar />
      <main
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}
      >
        <span className="status-led status-led--warn mb-4" aria-hidden="true" />
        <h1 className="heading-lg text-text-primary">Fleet awaiting first probe</h1>
        <p className="mt-2 max-w-md body-sm text-text-tertiary">
          No endpoints have been measured yet. Start the collector with{" "}
          <code className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-text-secondary">npm run worker</code>{" "}
          and data appears within a minute.
        </p>
      </main>
    </div>
  );
}
