import type { Metadata } from "next";

import { NavBar } from "@/components/navigation/nav-bar";
import { FleetIntelligence } from "@/components/discover/fleet-intelligence";
import { RevealSection } from "@/components/discover/reveal-section";
import { DiscoverView } from "@/components/discover/discover-view";
import { ProviderIntelligence } from "@/components/discover/provider-intelligence";
import { TrendAnalysis } from "@/components/discover/trend-analysis";
import { UseCaseRankings } from "@/components/discover/use-case-rankings";
import { ReliabilityHeatmap } from "@/components/discover/reliability-heatmap";
import { IncidentTimeline } from "@/components/discover/incident-timeline";
import { FleetTrendChart } from "@/components/dashboard/fleet-trend-chart";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { getDashboardModels, getFleetTrend } from "@/lib/dashboard-data";
import { TimeAgo } from "@/components/dashboard/time-ago";
import { SITE_NAME } from "@/lib/site";

// Without its own metadata this page inherited the root title verbatim, so /,
// /discover and /status all shipped the same <title> and description — three
// indexable URLs competing as duplicates. Each indexable page states its own.
export const metadata: Metadata = {
  title: `Discover — compare free NVIDIA NIM models by speed and reliability | ${SITE_NAME}`,
  description:
    "Rank and compare every free NVIDIA NIM endpoint by time-to-first-token, throughput, uptime, and congestion. Provider breakdowns, reliability heatmaps, incident timelines, and use-case rankings.",
  alternates: { canonical: "/discover" },
};

// ISR, revalidated on demand every site refresh (20 min); 1800s is only the safety
// net (see app/page.tsx for the full rationale).
export const revalidate = 1800;

export default async function DiscoverPage() {
  const [models, trend] = await Promise.all([getDashboardModels(), getFleetTrend()]);

  if (models.length === 0) return <EmptyState />;

  const providers = new Set(models.map((m) => m.provider)).size;
  const degraded = models.filter((m) => m.status !== "healthy").length;
  const lastChecked = models.reduce<Date | null>((latest, m) => {
    const d = m.lastChecked instanceof Date ? m.lastChecked : new Date(m.lastChecked);
    return !latest || d > latest ? d : latest;
  }, null);

  return (
    <div className="min-h-screen text-text-primary">
      <NavBar />
      <AutoRefresh />
      <main className="relative">
        <div className="mx-auto max-w-(--page-max) px-4 pb-16 pt-6 md:px-6">

          {/* Command header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="heading-xl text-text-primary">Discover</h1>
              <p className="mt-1.5 max-w-xl body-sm text-text-muted">
                Live operational intelligence across every free NVIDIA NIM endpoint — ranked by
                throughput, reliability, and congestion, refreshed continuously.
              </p>
            </div>
            <dl className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-x-6">
              <HeaderStat label="Endpoints" value={`${models.length}`} />
              <HeaderStat label="Providers" value={`${providers}`} />
              <HeaderStat label="Degraded" value={`${degraded}`} />
              <HeaderStat
                label="Last probe"
                value={
                  lastChecked ? (
                    // The widest value is reserved, so the placeholder swapping for the
                    // real "x min ago" at hydration moves nothing.
                    <span className="grid">
                      <span className="invisible col-start-1 row-start-1" aria-hidden="true">59 min ago</span>
                      <span className="col-start-1 row-start-1 text-right"><TimeAgo date={lastChecked} hidePlaceholder /></span>
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </header>

          <div className="space-y-4">
            <RevealSection step={1}>
              <FleetIntelligence models={models} />
            </RevealSection>

            <RevealSection step={2}>
              <DiscoverView models={models} />
            </RevealSection>

            <RevealSection step={3}>
              <FleetTrendChart data={trend} />
            </RevealSection>

            <RevealSection step={4}>
              <ProviderIntelligence models={models} />
            </RevealSection>

            <RevealSection step={4}>
              <UseCaseRankings models={models} />
            </RevealSection>

            <RevealSection step={4}>
              <TrendAnalysis models={models} />
            </RevealSection>

            <RevealSection step={4}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <ReliabilityHeatmap models={models} />
                <IncidentTimeline models={models} />
              </div>
            </RevealSection>
          </div>
        </div>
      </main>
    </div>
  );
}

function HeaderStat({
  label, value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-end">
      {/* Always ink: status colour never sets text. The state shapes and words below carry it. */}
      <dd className="metric-lg text-text-primary">{value}</dd>
      <dt className="mt-0.5 body-sm text-text-muted">{label}</dt>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen text-text-primary">
      <NavBar />
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <span className="status-led status-led--warn mb-4" aria-hidden="true" />
        <h1 className="heading-lg text-text-primary">Fleet awaiting first probe</h1>
        <p className="mt-2 max-w-md body-sm text-text-muted">
          No telemetry yet. Start the collector with{" "}
          <code className="rounded-xs bg-chip px-1.5 py-0.5 font-mono text-sm text-text-primary">npm run worker</code>{" "}
          and discovery data appears within a minute.
        </p>
      </main>
    </div>
  );
}
