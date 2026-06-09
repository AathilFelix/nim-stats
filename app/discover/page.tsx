import { MODELS } from "@/components/dashboard/mock-data";
import type { NIMModel } from "@/components/dashboard/mock-data";
import { getAllIncidents } from "@/lib/operational-engine";
import { NavBar } from "@/components/navigation/nav-bar";
import { DiscoverView } from "@/components/discover/discover-view";
import { ProviderIntelligence } from "@/components/discover/provider-intelligence";
import { TrendAnalysis } from "@/components/discover/trend-analysis";
import { UseCaseRankings } from "@/components/discover/use-case-rankings";
import { ReliabilityHeatmap } from "@/components/discover/reliability-heatmap";
import { IncidentTimeline } from "@/components/discover/incident-timeline";
import { FleetIntelligence } from "@/components/discover/fleet-intelligence";

export default function DiscoverPage() {
  const models = MODELS as NIMModel[];
  const enriched = models as unknown as Array<Record<string, unknown>>;
  const incidents = getAllIncidents(enriched);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="relative pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          <FleetIntelligence models={models} incidents={incidents} />
          <DiscoverView models={models} />
          <ProviderIntelligence models={models} />
          <TrendAnalysis models={models} />
          <UseCaseRankings models={models} />
          <ReliabilityHeatmap models={models} />
          <IncidentTimeline incidents={incidents} />
        </div>
      </main>
    </div>
  );
}
