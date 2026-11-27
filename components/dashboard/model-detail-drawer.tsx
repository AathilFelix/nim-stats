"use client";

import { useEffect, useRef, useState } from "react";
import { X, Star } from "lucide-react";
import { StatusPill, humanize } from "./status-pill";
import { StatusGlyph } from "./status-glyph";
import { CalendarGrid } from "./uptime-calendar";
import { HourStrip } from "./latency-heatmap";
import { useReliability, findModelReliability } from "@/lib/client/use-reliability";
import { fmtDuration, slaBudget } from "@/lib/reliability-format";
import { usePreferences } from "@/lib/client/preferences";
import type { NIMModel } from "./mock-data";
import { formatTput } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/client/motion";

interface Props {
  model: NIMModel | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ModelDetailDrawer({ model: selected, onClose, isFavorite, onToggleFavorite }: Props) {
  const { data } = useReliability();
  const { prefs } = usePreferences();
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = selected != null;
  // M7: the drawer stays mounted while it leaves. `held` keeps the last model so
  // the panel can slide out with its content; `closing` is derived, not stored.
  const [held, setHeld] = useState<NIMModel | null>(selected);
  if (selected && selected.id !== held?.id) setHeld(selected);
  const model = selected ?? held;
  const closing = selected == null && held != null;
  // Latest onClose without making it an effect dependency: callers pass a fresh
  // arrow each render, and re-running the effect would steal focus back.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Modal behaviour: Escape closes, Tab stays inside the panel, the page behind
  // does not scroll, and focus returns to whatever opened the drawer.
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Enter: mount closed, then flip one frame later so the panel travels in. Leave:
  // flip back (a transition retargets from wherever the panel is, so reopening
  // mid-exit does not jump).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!open) {
      root.dataset.open = "false";
      return;
    }
    const f = requestAnimationFrame(() => {
      void root.offsetWidth;
      root.dataset.open = "true";
    });
    return () => cancelAnimationFrame(f);
  }, [open, held]);

  // Unmount once the exit has run (200ms), then hand focus back to the opener.
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(
      () => {
        setHeld(null);
        const el = opener.current;
        if (el && document.contains(el)) el.focus();
      },
      prefersReducedMotion() ? 0 : 230,
    );
    return () => clearTimeout(t);
  }, [closing]);

  if (!model) return null;

  const rel = findModelReliability(data, model.id);
  const sRel = model.sessionReliability as { score: number; state: string };
  const target = prefs.slaTarget;

  return (
    <div
      ref={rootRef}
      className="drawer fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={`${model.name} details`}
      inert={closing}
    >
      <button
        type="button"
        aria-label="Close details"
        tabIndex={-1}
        onClick={onClose}
        className="drawer-scrim absolute inset-0 cursor-default bg-(--scrim)"
      />
      <div
        ref={panelRef}
        className="drawer-panel absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col border-l border-border-base bg-surface-overlay shadow-(--shadow-float) md:rounded-l-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-4 md:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusPill status={model.status} size="sm" />
              <span className="body-sm text-text-muted">{model.provider}</span>
            </div>
            <h2 className="font-mono text-lg leading-snug text-text-primary [overflow-wrap:anywhere]">{model.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleFavorite(model.id)}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? `Unpin ${model.name}` : `Pin ${model.name}`}
              title={isFavorite ? "Unpin from watchlist" : "Pin to watchlist"}
              className="btn btn-outline btn-icon"
            >
              <Star fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
            </button>
            <button
              type="button"
              data-autofocus
              onClick={onClose}
              aria-label="Close"
              className="btn btn-outline btn-icon"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          role="region"
          tabIndex={0}
          aria-label={`${model.name} details`}
          className="flex-1 space-y-6 overflow-y-auto px-4 py-5 md:px-6 scroll-y-lane"
        >
          {/* Vitals */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Vital label="First token" value={model.ttft > 0 ? `${model.ttft}` : "—"} unit={model.ttft > 0 ? "ms" : ""} />
            <Vital label="Throughput" value={formatTput(model.throughput)} unit={model.throughput > 0 ? "tok/s" : ""} />
            <Vital label="Congestion" value={`${model.congestion}`} unit="%" />
            <Vital label="Uptime" value={model.uptime.toFixed(2)} unit="%" />
            <Vital label="Reliability" value={`${model.reliability}`} unit="%" />
            <Vital label="P95" value={model.p95Latency > 0 ? `${model.p95Latency}` : "—"} unit={model.p95Latency > 0 ? "ms" : ""} />
            <Vital label="P99" value={model.p99Latency > 0 ? `${model.p99Latency}` : "—"} unit={model.p99Latency > 0 ? "ms" : ""} />
            <Vital label="Timeout" value={model.timeoutRate.toFixed(1)} unit="%" />
          </div>

          {/* Operational read */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Tag label="Session reliability" value={`${sRel?.score ?? "—"} · ${humanize(sRel?.state).toLowerCase()}`} />
            <Tag label="Routing" value={humanize(model.routingConfidence as string)} />
            <Tag label="Queue pressure" value={humanize(model.queuePressure as string)} />
            <Tag label="Recovery" value={humanize(model.recovery as string)} />
          </div>

          {/* SLA windows */}
          {rel && (
            <section>
              <h3 className="mb-3 text-base font-medium text-text-primary">SLA against the {target}% target</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([["24 h", rel.sla.d1, 1], ["7 d", rel.sla.d7, 7], ["30 d", rel.sla.d30, 30]] as const).map(
                  ([label, w, days]) => {
                    const b = slaBudget(w.uptime, target, days);
                    return (
                      <div key={label} className="rounded-md border border-border-subtle bg-surface-recessed p-3">
                        <p className="body-sm text-text-muted">{label}</p>
                        <p className="metric-lg mt-1 text-text-primary">
                          {w.uptime != null ? `${w.uptime.toFixed(2)}` : "—"}
                          <small className="body-xs ml-1 tracking-normal text-text-muted">%</small>
                        </p>
                        <p className="mt-1 flex items-center gap-2 body-sm text-text-muted">
                          <StatusGlyph state={w.uptime == null ? "neutral" : b.passing ? "healthy" : "jammed"} />
                          {w.uptime == null ? "No data" : `${b.passing ? "Meets" : "Misses"}, ${fmtDuration(b.actualDowntimeMin)} down`}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </section>
          )}

          {/* Uptime calendar */}
          <section>
            <h3 className="mb-3 text-base font-medium text-text-primary">Uptime, 90 days</h3>
            <CalendarGrid days={rel?.days ?? []} labelled={false} state={data ? "loaded" : "loading"} />
          </section>

          {/* Hourly latency */}
          <section>
            <h3 className="mb-3 text-base font-medium text-text-primary">First token by hour (UTC)</h3>
            <HourStrip hours={rel?.hours ?? Array.from({ length: 24 }, (_, h) => ({ hour: h, total: 0, ok: 0, avgTtft: null, avgLatency: null, uptime: null }))} />
          </section>

          {/* Incidents */}
          <section>
            <h3 className="mb-3 text-base font-medium text-text-primary">Recent incidents</h3>
            {model.incidents.length === 0 ? (
              <p className="body-sm text-text-muted">No incidents recorded in the last 24 h.</p>
            ) : (
              <ul className="overflow-hidden rounded-md border border-border-subtle">
                {model.incidents.slice(0, 12).map((inc) => (
                  <li key={inc.id} className="flex items-start gap-3 border-b border-border-subtle px-3 py-3 last:border-b-0">
                    <StatusGlyph
                      state={inc.severity === "critical" ? "jammed" : inc.severity === "warning" ? "busy" : "healthy"}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="body-sm text-text-primary [overflow-wrap:anywhere]">{inc.message}</p>
                      <p className="body-sm text-text-muted">{inc.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Vital({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-recessed p-3">
      <p className="body-sm text-text-muted">{label}</p>
      <p className="metric-lg mt-1 text-text-primary">
        {value}
        {unit && <small className="body-xs ml-1 tracking-normal text-text-muted">{unit}</small>}
      </p>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-md border border-border-subtle bg-surface-recessed px-3 py-2">
      <span className="body-sm text-text-muted">{label}</span>
      <span className="body-sm text-right text-text-primary">{value}</span>
    </div>
  );
}
