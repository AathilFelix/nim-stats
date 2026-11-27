import type { CSSProperties, ReactNode } from "react";
import type { FleetStateResult } from "@/lib/operational-types";
import type { CatalogFunnel } from "@/lib/dashboard-data";
import { StatusGlyph, type GlyphState } from "./status-glyph";
import { Tick } from "@/components/ui/tick";

interface SummaryProps {
  fleetState: FleetStateResult;
  total: number;
  healthy: number;
  busy: number;
  jammed: number;
  catalog?: CatalogFunnel;
}

const STATE_META: Record<FleetStateResult["state"], { label: string; glyph: GlyphState }> = {
  healthy: { label: "Operational", glyph: "healthy" },
  recovery_in_progress: { label: "Recovering", glyph: "busy" },
  elevated_congestion: { label: "Elevated congestion", glyph: "busy" },
  partial_degradation: { label: "Partial degradation", glyph: "jammed" },
};

const em = (n: number) => (
  <b className="font-medium text-text-primary">
    <Tick value={n} />
  </b>
);

/**
 * The five-second read: one verdict (shape + ink word), a sentence, the
 * distribution bar and a counted legend. The shape carries the status colour;
 * the word is ink.
 */
export function FleetSummary({ fleetState, total, healthy, busy, jammed, catalog }: SummaryProps) {
  const meta = STATE_META[fleetState.state];
  const barLabel = `${healthy} answering, ${busy} busy, ${jammed} not responding of ${total} endpoints`;

  let tail: ReactNode = null;
  if (jammed > 0) tail = <> and {em(jammed)} {jammed === 1 ? "is" : "are"} not responding</>;
  else if (busy > 0) tail = <> and {em(busy)} {busy === 1 ? "is" : "are"} busy</>;

  const notCallable = catalog ? Math.max(0, catalog.listed - catalog.callable) : 0;

  return (
    <section
      aria-label="Fleet status"
      className="panel col-span-12 flex flex-col gap-4 p-4 md:p-6 min-[1100px]:col-span-8"
    >
      <div className="flex items-center gap-3">
        <Tick value={fleetState.state} variant="fade" className="flex">
          <StatusGlyph state={meta.glyph} size={24} className="max-md:h-5 max-md:w-5" />
        </Tick>
        <h1 className="heading-xl text-text-primary">
          <span className="sr-only">NVIDIA NIM fleet status: </span>
          <Tick value={fleetState.state} variant="fade" className="tick--inline">
            {meta.label}
          </Tick>
        </h1>
      </div>

      <div className="max-w-[56ch] body-lg text-text-muted">
        <p>
          {healthy === total ? (
            <>All {em(total)} endpoints are answering cleanly.</>
          ) : (
            <>
              {em(healthy)} of {em(total)} endpoints {healthy === 1 ? "is" : "are"} answering cleanly{tail}.
            </>
          )}
        </p>
        {catalog && (
          <p>
            NVIDIA lists {catalog.listed};{" "}
            {notCallable === 0
              ? `all ${catalog.callable} are callable.`
              : `${catalog.callable} are callable, the other ${notCallable} don’t answer chat requests.`}
          </p>
        )}
      </div>

      <div className="fleet-bar mt-auto" role="img" aria-label={barLabel}>
        {healthy > 0 && <Segment className="bg-status-healthy" n={healthy} />}
        {busy > 0 && <Segment className="bg-status-warn" n={busy} />}
        {jammed > 0 && <Segment className="bg-status-critical" n={jammed} />}
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 body-sm text-text-muted">
        <Legend glyph="healthy" word="Answering" n={healthy} />
        <Legend glyph="busy" word="Busy" n={busy} />
        <Legend glyph="jammed" word="Not responding" n={jammed} />
      </ul>
    </section>
  );
}

function Segment({ className, n }: { className: string; n: number }) {
  return <span className={className} style={{ flex: `${n} 1 0`, minWidth: 3 }} />;
}

function Legend({ glyph, word, n }: { glyph: GlyphState; word: string; n: number }) {
  // A zero count shows the neutral ring, so a status shape never sits next to "0".
  return (
    <li className="flex items-center gap-2">
      <StatusGlyph state={n > 0 ? glyph : "neutral"} />
      <b className="font-medium text-text-primary">
        <Tick value={n} />
      </b>
      {word}
    </li>
  );
}

interface MetricsProps {
  total: number;
  healthy: number;
  avgTtft: number;
  /** Endpoints that reported a first-token time. */
  ttftCount: number;
  avgThroughput: number;
  /** Endpoints that reported a throughput. */
  throughputCount: number;
  /** Critical incidents in the last 24 h. */
  critical24h: number;
}

const basis = (n: number, total: number) => (n >= total ? `Across all ${total} endpoints` : `Across ${n} of ${total} endpoints`);

/**
 * Four metric cards. No change-versus-previous-window chips: the app keeps no
 * previous-window aggregate, so none is shown (a fake delta would be worse than
 * none). Each card states its basis instead, so an average over a subset says so.
 */
export function FleetMetrics({
  total, healthy, avgTtft, ttftCount, avgThroughput, throughputCount, critical24h,
}: MetricsProps) {
  return (
    <>
      <Metric label="Answering endpoints" value={String(healthy)} unit={`of ${total}`} basis="At the latest probe" />
      <Metric
        label="Average first token"
        value={avgTtft > 0 ? String(Math.round(avgTtft)) : "—"}
        unit={avgTtft > 0 ? "ms" : undefined}
        basis={basis(ttftCount, total)}
      />
      <Metric
        label="Average throughput"
        value={avgThroughput > 0 ? avgThroughput.toFixed(1) : "—"}
        unit={avgThroughput > 0 ? "tok/s" : undefined}
        basis={basis(throughputCount, total)}
      />
      <Metric label="Critical incidents" value={String(critical24h)} basis="Last 24 h" />
    </>
  );
}

function Metric({ label, value, unit, basis: basisText }: { label: string; value: string; unit?: string; basis: string }) {
  return (
    <section
      className="reveal panel col-span-6 flex flex-col gap-2 p-4 md:p-6 min-[1100px]:col-span-3"
      style={{ "--i": 2 } as CSSProperties}
    >
      <p className="body-sm text-text-muted">{label}</p>
      <p className="metric-xl text-text-primary">
        <Tick value={value} />
        {unit && <small className="body-sm ml-1 tracking-normal text-text-muted max-md:block max-md:ml-0">{unit}</small>}
      </p>
      <p className="body-sm text-text-muted">{basisText}</p>
    </section>
  );
}
