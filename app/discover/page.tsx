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
import { formatTimeAgo } from "@/components/dashboard/mock-data";

export const dynamic = "force-dynamic";

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
      <main className="relative" style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">

          {/* Command header */}
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="status-led status-led--info" style={{ width: 6, height: 6 }} aria-hidden="true" />
                <span className="label-sm text-text-tertiary">Fleet Operations</span>
              </div>
              <h1 className="heading-xl text-text-primary">Discover</h1>
              <p className="body-sm text-text-secondary mt-1.5 max-w-xl">
                Live operational intelligence across every free NVIDIA NIM endpoint — ranked by
                throughput, reliability, and congestion, refreshed continuously.
              </p>
            </div>
            <dl className="flex items-center gap-5 sm:gap-6">
              <HeaderStat label="Endpoints" value={`${models.length}`} />
              <HeaderStat label="Providers" value={`${providers}`} />
              <HeaderStat
                label="Degraded"
                value={`${degraded}`}
                tone={degraded > 0 ? "critical" : "healthy"}
              />
              <HeaderStat
                label="Last probe"
                value={lastChecked ? formatTimeAgo(lastChecked) : "—"}
                mono
              />
            </dl>
          </header>

          <div className="space-y-4">
            <RevealSection>
              <FleetIntelligence models={models} />
            </RevealSection>

            <RevealSection>
              <DiscoverView models={models} />
            </RevealSection>

            <RevealSection>
              <FleetTrendChart data={trend} />
            </RevealSection>

            <RevealSection>
              <ProviderIntelligence models={models} />
            </RevealSection>

            <RevealSection>
              <UseCaseRankings models={models} />
            </RevealSection>

            <RevealSection>
              <TrendAnalysis models={models} />
            </RevealSection>

            <RevealSection>
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
  label, value, tone = "neutral", mono = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "healthy" | "critical";
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <dd
        className={cnTone(tone, mono)}
      >
        {value}
      </dd>
      <dt className="label-xs text-text-tertiary mt-0.5">{label}</dt>
    </div>
  );
}

function cnTone(tone: "neutral" | "healthy" | "critical", mono: boolean) {
  const base = mono ? "metric-sm" : "metric-lg";
  if (tone === "critical") return `${base} text-status-critical`;
  if (tone === "healthy") return `${base} text-status-healthy`;
  return `${base} text-text-primary`;
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
          No telemetry yet. Start the collector with{" "}
          <code className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-text-secondary">npm run worker</code>{" "}
          and discovery data appears within a minute.
        </p>
      </main>
    </div>
  );
}
