import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { NavBar } from "@/components/navigation/nav-bar";
import { BuiltBy } from "@/components/site/built-by";
import { HomeExplainer } from "@/components/site/home-explainer";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { FleetMetrics, FleetSummary } from "@/components/dashboard/fleet-summary";
import { StatusGlyph } from "@/components/dashboard/status-glyph";
import { TrendRangeProvider } from "@/components/dashboard/trend-range";
import { SectionBar } from "@/components/navigation/section-bar";
import { FleetTrendChart } from "@/components/dashboard/fleet-trend-chart";
import { BestModelNow } from "@/components/dashboard/best-model-now";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { ModelExplorer, ModelExplorerSkeleton } from "@/components/dashboard/model-explorer";
import { SlaTracker } from "@/components/dashboard/sla-tracker";
import { UptimeCalendar } from "@/components/dashboard/uptime-calendar";
import { LatencyHeatmap } from "@/components/dashboard/latency-heatmap";
import { computeFleetState, findBestModel } from "@/lib/operational-engine";
import type { Incident } from "@/lib/operational-types";
import { getCatalogFunnel, getDashboardModels, getFleetTrend } from "@/lib/dashboard-data";
import { CLIENT_REFRESH_MS } from "@/lib/config/cadence";

// ISR — render once, then serve cached HTML from Workers Cache. Under a traffic
// spike (e.g. an X post), visitors are served from the edge instead of each
// running a full render, so Worker CPU stays flat regardless of pageviews.
//
// Freshness is ON DEMAND: every SITE_REFRESH_CYCLES probe cycles (20 min) the
// collector POSTs /api/internal/revalidate, which marks this page stale, and the
// next visit regenerates it once. A timer regenerates on a clock unrelated to
// when data lands — the old 300s window re-rendered (and re-wrote to the ISR
// cache) twice per 10-min probe, usually with nothing new to show.
//
// 1800s = PAGE_FALLBACK_REVALIDATE in lib/config/cadence.ts: a safety net that
// only fires if the revalidation hook stops arriving. Must stay a literal — Next
// only statically analyses route segment config, so an imported constant is not
// read. Keep the two in sync.
export const revalidate = 1800;

export default async function Home() {
  const [models, trend, catalog] = await Promise.all([getDashboardModels(), getFleetTrend(), getCatalogFunnel()]);

  if (models.length === 0) return <EmptyState />;

  const enriched = models as unknown as Array<Record<string, unknown>>;
  const fleetState = computeFleetState(enriched);
  const bestModel = findBestModel(enriched);
  // Every incident the models carry (the last 24 h, per model). getAllIncidents
  // truncates to 20 and orders by the relative-time string, so it can neither
  // count nor rank them.
  const incidents = models.flatMap((m) => m.incidents as Incident[]);

  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;

  const measuredTput = models.filter((m) => m.throughput > 0);
  const avgThroughput = measuredTput.length
    ? measuredTput.reduce((a, m) => a + m.throughput, 0) / measuredTput.length
    : 0;
  const withTtft = models.filter((m) => m.ttft > 0);
  const avgTtft = withTtft.length ? withTtft.reduce((a, m) => a + m.ttft, 0) / withTtft.length : 0;

  const critical24h = incidents.filter((i) => i.severity === "critical").length;
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
      <NavBar sticky={false} />
      <AutoRefresh />

      <TrendRangeProvider>
        <SectionBar lastProbe={lastChecked} />

        <main>
          <div className="mx-auto max-w-(--page-max) px-4 pb-16 pt-4 md:px-6 md:pt-6">
            <div id="fleet" className="grid scroll-mt-16 max-md:scroll-mt-4 grid-cols-12 gap-3 md:gap-4">
              <FleetSummary
                fleetState={fleetState}
                total={models.length}
                healthy={healthy}
                busy={busy}
                jammed={jammed}
                catalog={catalog}
              />
              <BestModelNow recommendation={bestModel} />
              <FleetMetrics
                total={models.length}
                healthy={healthy}
                avgTtft={avgTtft}
                ttftCount={withTtft.length}
                avgThroughput={avgThroughput}
                throughputCount={measuredTput.length}
                critical24h={critical24h}
              />
              {/* One row for the chart and the changes list; the Incidents tab lands here. */}
              <div
                id="incidents"
                className="reveal col-span-12 grid scroll-mt-16 grid-cols-12 gap-3 max-md:scroll-mt-4 md:gap-4"
                style={{ "--i": 3 } as CSSProperties}
              >
                <FleetTrendChart data={trend} />
                <IncidentFeed incidents={incidents} models={liteModels} />
              </div>
            </div>

            {/* Anomaly detection and quota proximity are API-only for now
                (/api/fleet/anomalies, /api/fleet/quota). Both client panels
                rendered nothing until their fetch/60s-poll resolved, then popped
                in and shifted scroll position — bad UX. Re-enable once that layout
                shift is solved (reserve space up front / render in a fixed layer). */}

            <section
              id="endpoints"
              aria-label="Endpoints"
              className="reveal mt-3 scroll-mt-16 max-md:scroll-mt-4 md:mt-4"
              style={{ "--i": 4 } as CSSProperties}
            >
              <Suspense fallback={<ModelExplorerSkeleton />}>
                <ModelExplorer models={models} />
              </Suspense>
            </section>

            <section
              id="reliability"
              aria-label="Reliability and SLA"
              className="reveal mt-3 grid scroll-mt-16 max-md:scroll-mt-4 grid-cols-12 gap-3 md:mt-4 md:gap-4"
              style={{ "--i": 4 } as CSSProperties}
            >
              <SlaTracker />
              <UptimeCalendar models={liteModels} />
              <LatencyHeatmap />
            </section>

            <div className="reveal mt-3 md:mt-4" style={{ "--i": 4 } as CSSProperties}>
              <HomeExplainer />
            </div>
          </div>
        </main>
      </TrendRangeProvider>

      <footer
        className="border-t border-border-base py-6"
        style={{ paddingBottom: "max(1.5rem, var(--safe-bottom))" }}
      >
        <div className="mx-auto flex max-w-(--page-max) flex-col px-4 md:px-6 gap-x-6 gap-y-3 body-sm text-text-muted lg:flex-row lg:items-center lg:justify-between">
          <p>Live status of free NVIDIA NIM endpoints. Not affiliated with NVIDIA.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Crawl path to the trust-anchor pages — agents check these before
                treating a source as legitimate, and nothing linked to them. */}
            <nav aria-label="Site information" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <FooterLink href="/status" label="Status" />
              <FooterLink href="/api" label="API" />
              <FooterLink href="/about" label="About" />
              <FooterLink href="/contact" label="Contact" />
              <FooterLink href="/privacy" label="Privacy" />
            </nav>
            <BuiltBy />
            <p>Auto-refresh every {refreshEvery(CLIENT_REFRESH_MS)}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** "5 min" / "45 s", from the same constant AutoRefresh polls on. */
function refreshEvery(ms: number): string {
  return ms >= 60_000 ? `${Math.round(ms / 60_000)} min` : `${Math.round(ms / 1000)} s`;
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="foot-link">
      {label}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen text-text-primary">
      <NavBar />
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center sm:px-6">
        <StatusGlyph state="busy" size={16} className="mb-4" />
        <h1 className="heading-lg text-text-primary">Fleet awaiting first probe</h1>
        <p className="mt-2 max-w-[44ch] body-sm text-text-secondary">
          No endpoints have been measured yet. Start the collector with{" "}
          <code className="rounded-sm border border-border-base bg-surface-recessed px-1.5 py-0.5 font-mono text-xs text-text-primary">
            npm run worker
          </code>{" "}
          and data appears within a minute.
        </p>
      </main>
    </div>
  );
}
