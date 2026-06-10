import { NavBar } from "@/components/navigation/nav-bar";
import { FleetIntelligence } from "@/components/discover/fleet-intelligence";
import { RevealSection } from "@/components/discover/reveal-section";
import { DiscoverView } from "@/components/discover/discover-view";
import { ProviderIntelligence } from "@/components/discover/provider-intelligence";
import { TrendAnalysis } from "@/components/discover/trend-analysis";
import { UseCaseRankings } from "@/components/discover/use-case-rankings";
import { ReliabilityHeatmap } from "@/components/discover/reliability-heatmap";
import { IncidentTimeline } from "@/components/discover/incident-timeline";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { getDashboardModels } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const models = await getDashboardModels();

  if (models.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] surface-texture">
        <NavBar />
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
          <p className="label-sm text-text-tertiary">No telemetry yet</p>
          <h1 className="metric-lg mt-2">Fleet awaiting first probe</h1>
          <p className="mono-xs mt-3 max-w-md text-text-tertiary">
            Start the collector with <code className="text-text-secondary">npm run worker</code> and discovery data will populate within a minute.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] surface-texture">
      <NavBar />
      <AutoRefresh />
      <main className="relative min-h-screen" style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-10">

          {/* Fleet Intelligence — Hero Bar */}
          <RevealSection className="mb-6">
            <FleetIntelligence models={models} />
          </RevealSection>

          {/* DiscoverView — Model Registry (full-width bento) */}
          <RevealSection className="mb-5">
            <DiscoverView models={models} />
          </RevealSection>

          {/* Provider Intelligence — Full width */}
          <RevealSection className="mb-4">
            <ProviderIntelligence models={models} />
          </RevealSection>

          {/* Trend Analysis — Full width */}
          <RevealSection className="mb-4">
            <TrendAnalysis models={models} />
          </RevealSection>

          {/* Use-case Rankings — Full width */}
          <RevealSection className="mb-4">
            <UseCaseRankings models={models} />
          </RevealSection>

          {/* Reliability + Incidents — 2-col grid */}
          <RevealSection>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ReliabilityHeatmap models={models} />
              <IncidentTimeline models={models} />
            </div>
          </RevealSection>

        </div>
      </main>
    </div>
  );
}
