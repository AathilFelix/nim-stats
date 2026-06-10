import { useMemo } from "react";
import { MODELS } from "@/components/dashboard/mock-data";
import type { NIMModel } from "@/components/dashboard/mock-data";
import { NavBar } from "@/components/navigation/nav-bar";
import { FleetStateBanner } from "@/components/dashboard/fleet-state-banner";
import { BestModelNow } from "@/components/dashboard/best-model-now";
import { IncidentFeed } from "@/components/dashboard/incident-feed";
import { ActiveRecommendations } from "@/components/dashboard/active-recommendations";
import { GlobalFleetPulse } from "@/components/dashboard/global-fleet-pulse";
import { ModelTable } from "@/components/dashboard/model-table";
import { computeFleetState, findBestModel, getAllIncidents } from "@/lib/operational-engine";

export default function Home() {
  const models = MODELS as NIMModel[];
  const enriched = models as unknown as Array<Record<string, unknown>>;

  const fleetState = useMemo(() => computeFleetState(enriched), [enriched]);
  const bestModel = useMemo(() => findBestModel(enriched), [enriched]);
  const allIncidents = useMemo(() => getAllIncidents(enriched), [enriched]);

  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  const degraded = fleetState.degradedCount;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Top status metrics */}
      <div
        className="fixed top-11 left-0 right-0 z-40"
        style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', top: 'calc(2.75rem + var(--safe-top))' }}
      >
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 px-3 sm:px-5 lg:px-7 h-9">
          <StatusCount label="HEALTHY" value={healthy} tone="good" />
          <StatusCount label="BUSY" value={busy} tone="warn" />
          {jammed > 0 && <StatusCount label="JAMMED" value={jammed} tone="bad" />}
          <span className="h-3 w-px bg-border-base hidden sm:block" aria-hidden="true" />
          <SummaryMetric label="AVG THROUGHPUT" value={`${Math.round(models.reduce((a, m) => a + m.throughput, 0) / models.length)} tok/s`} />
          <SummaryMetric label="AVG UPTIME" value={`${(models.reduce((a, m) => a + m.uptime, 0) / models.length).toFixed(2)}%`} />
          {degraded > 0 && (
            <>
              <span className="h-3 w-px bg-border-base hidden sm:block" aria-hidden="true" />
              <span className="flex items-center gap-2">
                <span className="label-xs text-amber-500">{degraded}/{models.length}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <main className="relative pt-28 min-h-screen" style={{ paddingTop: 'calc(7rem + var(--safe-top))' }}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <FleetStateBanner state={fleetState} />
            <BestModelNow recommendation={bestModel} models={enriched} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentFeed incidents={allIncidents} />
            <ActiveRecommendations models={models} />
          </div>

          <GlobalFleetPulse models={models} />

          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="label-sm text-text-tertiary">Model Fleet</p>
              <p className="metric-sm text-text-tertiary">{models.length} endpoints</p>
            </div>
            <ModelTable models={models} />
          </section>
        </div>
      </main>

      <footer className="border-t border-border-subtle px-4 sm:px-6 lg:px-8 py-4 mt-8" style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <p className="mono-xs text-text-tertiary">Mock data — not live endpoint status</p>
          <p className="mono-xs text-text-tertiary">Refreshes every 30s</p>
        </div>
      </footer>
    </div>
  );
}

function StatusCount({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" }) {
  const colorClass = tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex items-center gap-2">
      <span className={`${colorClass} label-xs`}>{label}</span>
      <span className={`${colorClass} metric-md`}>{value}</span>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="label-xs text-text-tertiary">{label}</span>
      <span className="metric-sm text-text-secondary">{value}</span>
    </div>
  );
}
