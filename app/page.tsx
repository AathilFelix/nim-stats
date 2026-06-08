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

  const fleetState = computeFleetState(enriched);
  const bestModel = findBestModel(enriched);

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
        style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-5 px-5 lg:px-7 h-9">
          <StatusCount label="HEALTHY" value={healthy} tone="good" />
          <StatusCount label="BUSY" value={busy} tone="warn" />
          {jammed > 0 && <StatusCount label="JAMMED" value={jammed} tone="bad" />}
          <span className="h-3 w-px bg-border-base" aria-hidden="true" />
          <SummaryMetric label="AVG THROUGHPUT" value={`${Math.round(models.reduce((a, m) => a + m.throughput, 0) / models.length)} tok/s`} />
          <SummaryMetric label="AVG UPTIME" value={`${(models.reduce((a, m) => a + m.uptime, 0) / models.length).toFixed(2)}%`} />
          {degraded > 0 && (
            <>
              <span className="h-3 w-px bg-border-base" aria-hidden="true" />
              <span className="flex items-center gap-2">
                <span
                  className="text-amber-500 uppercase tracking-wider"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                  }}
                >
                  DEGRADED
                </span>
                <span
                  className="tabular-nums text-amber-500"
                  style={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {degraded}/{models.length}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      <main className="relative pt-28 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <FleetStateBanner state={fleetState} />
            <BestModelNow recommendation={bestModel} models={enriched} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncidentFeed incidents={getAllIncidents(enriched)} />
            <ActiveRecommendations models={models} />
          </div>

          <GlobalFleetPulse models={models} />

          <section>
            <div className="flex items-center justify-between mb-3">
              <p
                className="uppercase tracking-wider text-text-tertiary"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                }}
              >
                Model Fleet
              </p>
              <p
                className="text-text-tertiary"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {models.length} endpoints
              </p>
            </div>
            <ModelTable models={models} />
          </section>
        </div>
      </main>

      <footer className="border-t border-border-subtle px-4 sm:px-6 lg:px-8 py-4 mt-8">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <p
            className="text-text-tertiary"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.04em',
            }}
          >
            Mock data — not live endpoint status
          </p>
          <p
            className="text-text-tertiary"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.04em',
            }}
          >
            Refreshes every 30s
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatusCount({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" }) {
  const colorClass = tone === "good" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${colorClass} uppercase tracking-wider`}
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.55rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>
      <span
        className={`tabular-nums font-semibold ${colorClass}`}
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.7rem',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const valueColor = highlight ? "text-amber-500" : "text-text-secondary";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${highlight ? "text-amber-500" : "text-text-tertiary"} uppercase tracking-wider`}
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.55rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${valueColor}`}
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.65rem',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
    </div>
  );
}
