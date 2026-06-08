import { MODELS } from "@/components/dashboard/mock-data";
import type { NIMModel } from "@/components/dashboard/mock-data";
import { NavBar } from "@/components/navigation/nav-bar";
import { DiscoverView } from "@/components/discover/discover-view";
import { ProviderIntelligence } from "@/components/discover/provider-intelligence";
import { TrendAnalysis } from "@/components/discover/trend-analysis";
import { UseCaseRankings } from "@/components/discover/use-case-rankings";
import { ReliabilityHeatmap } from "@/components/discover/reliability-heatmap";
import { IncidentTimeline } from "@/components/discover/incident-timeline";
import { getAllIncidents } from "@/lib/operational-engine";

export default function DiscoverPage() {
  const models = MODELS as NIMModel[];
  const enriched = models as unknown as Array<Record<string, unknown>>;

  const healthy = models.filter((m) => m.status === "healthy").length;
  const total = models.length;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="relative pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Compact status strip */}
          <div
            className="flex items-center gap-5 px-4 py-2.5"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border-base)',
              borderRadius: '0.5rem',
            }}
          >
            <span className="flex items-center gap-2">
              <span
                className="text-[10px] uppercase tracking-wider font-medium text-emerald-500"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                }}
              >
                Healthy
              </span>
              <span
                className="tabular-nums font-semibold text-emerald-500"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {healthy}/{total}
              </span>
            </span>
            <span
              className="h-3 w-px bg-border-base"
              aria-hidden="true"
            />
            <span
              className="text-text-tertiary uppercase tracking-wider"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.6rem',
                letterSpacing: '0.06em',
              }}
            >
              {total} endpoints
            </span>
          </div>

          {/* Main explorer — full width, no sidebar */}
          <DiscoverView models={models} />

          {/* Context sections */}
          <ProviderIntelligence models={models} />
          <TrendAnalysis models={models} />
          <UseCaseRankings models={models} />
          <ReliabilityHeatmap models={models} />
          <IncidentTimeline incidents={getAllIncidents(enriched)} />
        </div>
      </main>
    </div>
  );
}
