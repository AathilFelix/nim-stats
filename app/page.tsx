import { NavBar } from "@/components/navigation/nav-bar";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { FleetSummary } from "@/components/dashboard/fleet-summary";
import { FleetTrendChart } from "@/components/dashboard/fleet-trend-chart";
import { BestModelNow } from "@/components/dashboard/best-model-now";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { ModelTable } from "@/components/dashboard/model-table";
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

  return (
    <div className="min-h-screen bg-surface-base">
      <NavBar />
      <AutoRefresh />

      <main style={{ paddingTop: "calc(3rem + var(--safe-top))" }}>
        <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
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

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <BestModelNow recommendation={bestModel} models={enriched} />
            <IncidentFeed incidents={incidents} />
          </div>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-text-primary">Model fleet</h2>
              <p className="font-mono text-xs tabular-nums text-text-tertiary">{models.length} endpoints</p>
            </div>
            <ModelTable models={models} />
          </section>
        </div>
      </main>

      <footer
        className="border-t border-border-subtle px-4 py-5 sm:px-6 lg:px-8"
        style={{ paddingBottom: "max(1.25rem, var(--safe-bottom))" }}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-1 sm:flex-row">
          <p className="text-xs text-text-tertiary">
            Live status of free NVIDIA NIM endpoints. Not affiliated with NVIDIA.
          </p>
          <p className="font-mono text-xs text-text-tertiary">Refreshes every 30s</p>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-surface-base">
      <NavBar />
      <main
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
        style={{ paddingTop: "calc(3rem + var(--safe-top))" }}
      >
        <span className="status-led status-led--warn mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">Fleet awaiting first probe</h1>
        <p className="mt-2 max-w-md text-sm text-text-tertiary">
          No endpoints have been measured yet. Start the collector with{" "}
          <code className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-text-secondary">npm run worker</code>{" "}
          and data appears within a minute.
        </p>
      </main>
    </div>
  );
}
