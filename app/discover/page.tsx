import { lazy, Suspense } from "react";
import { MODELS } from "@/components/dashboard/mock-data";
import type { NIMModel } from "@/components/dashboard/mock-data";
import { NavBar } from "@/components/navigation/nav-bar";
import { FleetIntelligence } from "@/components/discover/fleet-intelligence";
import { RevealSection } from "@/components/discover/reveal-section";

function SectionLoader() {
  return (
    <div className="rounded-lg border border-[--border-subtle] bg-[--surface-card] p-4 space-y-3">
      <div className="h-3 w-24 rounded bg-[--border-subtle] animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-[--border-subtle] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}

const DiscoverView = lazy(() =>
  import("@/components/discover/discover-view").then((m) => ({ default: m.DiscoverView })),
);
const ProviderIntelligence = lazy(() =>
  import("@/components/discover/provider-intelligence").then((m) => ({ default: m.ProviderIntelligence })),
);
const TrendAnalysis = lazy(() =>
  import("@/components/discover/trend-analysis").then((m) => ({ default: m.TrendAnalysis })),
);
const UseCaseRankings = lazy(() =>
  import("@/components/discover/use-case-rankings").then((m) => ({ default: m.UseCaseRankings })),
);
const ReliabilityHeatmap = lazy(() =>
  import("@/components/discover/reliability-heatmap").then((m) => ({ default: m.ReliabilityHeatmap })),
);
const IncidentTimeline = lazy(() =>
  import("@/components/discover/incident-timeline").then((m) => ({ default: m.IncidentTimeline })),
);

export default function DiscoverPage() {
  const models = MODELS as NIMModel[];

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)] surface-texture">
      <NavBar />
      <main className="relative min-h-screen" style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-10">

          {/* Fleet Intelligence — Hero Bar */}
          <RevealSection className="mb-6">
            <FleetIntelligence models={models} />
          </RevealSection>

          {/* DiscoverView — Model Registry (full-width bento) */}
          <RevealSection className="mb-5">
            <Suspense fallback={<SectionLoader />}>
              <DiscoverView models={models} />
            </Suspense>
          </RevealSection>

          {/* Provider Intelligence — Full width */}
          <RevealSection className="mb-4">
            <Suspense fallback={<SectionLoader />}>
              <ProviderIntelligence models={models} />
            </Suspense>
          </RevealSection>

          {/* Trend Analysis — Full width */}
          <RevealSection className="mb-4">
            <Suspense fallback={<SectionLoader />}>
              <TrendAnalysis models={models} />
            </Suspense>
          </RevealSection>

          {/* Use-case Rankings — Full width */}
          <RevealSection className="mb-4">
            <Suspense fallback={<SectionLoader />}>
              <UseCaseRankings models={models} />
            </Suspense>
          </RevealSection>

          {/* Reliability + Incidents — 2-col grid */}
          <RevealSection>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Suspense fallback={<SectionLoader />}>
                <ReliabilityHeatmap models={models} />
              </Suspense>
              <Suspense fallback={<SectionLoader />}>
                <IncidentTimeline models={models} />
              </Suspense>
            </div>
          </RevealSection>

        </div>
      </main>
    </div>
  );
}
