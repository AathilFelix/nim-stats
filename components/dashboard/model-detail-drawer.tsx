"use client";

import { useEffect } from "react";
import { X, Star, AlertTriangle } from "lucide-react";
import { StatusPill } from "./status-pill";
import { CalendarGrid } from "./uptime-calendar";
import { HourStrip } from "./latency-heatmap";
import { useReliability, findModelReliability } from "@/lib/client/use-reliability";
import { fmtDuration, slaBudget } from "@/lib/reliability-format";
import { usePreferences } from "@/lib/client/preferences";
import type { NIMModel } from "./mock-data";
import { cn } from "@/lib/utils";

interface Props {
  model: NIMModel | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function ModelDetailDrawer({ model, onClose, isFavorite, onToggleFavorite }: Props) {
  const { data } = useReliability();
  const { prefs } = usePreferences();

  useEffect(() => {
    if (!model) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [model, onClose]);

  if (!model) return null;

  const rel = findModelReliability(data, model.id);
  const sRel = model.sessionReliability as { score: number; state: string };
  const target = prefs.slaTarget;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={`${model.name} details`}>
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-fade-in"
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col border-l border-border-base bg-surface-base shadow-[-16px_0_48px_rgba(0,0,0,0.5)] animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-base px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <StatusPill status={model.status} size="sm" />
              <span className="metric-xs text-text-tertiary">{model.provider}</span>
            </div>
            <h2 className="heading-md text-text-primary truncate">{model.name}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavorite(model.id)}
              aria-pressed={isFavorite}
              title={isFavorite ? "Unpin from watchlist" : "Pin to watchlist"}
              className={cn(
                "rounded-md p-2 transition-colors",
                isFavorite ? "text-status-warn" : "text-text-quaternary hover:text-text-secondary",
              )}
            >
              <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-2 text-text-tertiary transition-colors hover:bg-surface-recessed hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Vitals */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Vital label="TTFT" value={`${model.ttft}`} unit="ms" />
            <Vital label="Throughput" value={model.throughput.toFixed(1)} unit="tok/s" />
            <Vital label="Congestion" value={`${model.congestion}`} unit="%" />
            <Vital label="Uptime" value={model.uptime.toFixed(2)} unit="%" />
            <Vital label="Reliability" value={`${model.reliability}`} unit="%" />
            <Vital label="P95" value={`${model.p95Latency}`} unit="ms" />
            <Vital label="P99" value={`${model.p99Latency}`} unit="ms" />
            <Vital label="Timeout" value={model.timeoutRate.toFixed(1)} unit="%" />
          </div>

          {/* Operational read */}
          <div className="grid grid-cols-2 gap-2">
            <Tag label="Session reliability" value={`${sRel?.score ?? "—"} · ${(sRel?.state ?? "").replace(/_/g, " ")}`} />
            <Tag label="Routing" value={(model.routingConfidence as string).replace(/_/g, " ")} />
            <Tag label="Queue pressure" value={model.queuePressure as string} />
            <Tag label="Recovery" value={model.recovery as string} />
          </div>

          {/* SLA windows */}
          {rel && (
            <div>
              <p className="section-label mb-2">SLA vs {target}% target</p>
              <div className="grid grid-cols-3 gap-2">
                {([["24h", rel.sla.d1, 1], ["7d", rel.sla.d7, 7], ["30d", rel.sla.d30, 30]] as const).map(
                  ([label, w, days]) => {
                    const b = slaBudget(w.uptime, target, days);
                    return (
                      <div key={label} className="rounded-lg border border-border-subtle bg-surface-recessed p-3">
                        <p className="metric-xs text-text-tertiary">{label}</p>
                        <p
                          className={cn(
                            "metric-lg",
                            w.uptime == null ? "text-text-quaternary" : b.passing ? "text-status-healthy" : "text-status-critical",
                          )}
                        >
                          {w.uptime != null ? `${w.uptime.toFixed(2)}` : "—"}
                          <span className="metric-xs text-text-quaternary ml-0.5">%</span>
                        </p>
                        <p className="metric-xs text-text-quaternary mt-0.5">
                          {w.uptime == null ? "no data" : `${fmtDuration(b.actualDowntimeMin)} down`}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Uptime calendar */}
          <div>
            <p className="section-label mb-2">Uptime · 90 days</p>
            <CalendarGrid days={rel?.days ?? []} />
          </div>

          {/* Hourly latency */}
          <div>
            <p className="section-label mb-2">Latency by hour (UTC)</p>
            <HourStrip hours={rel?.hours ?? Array.from({ length: 24 }, (_, h) => ({ hour: h, total: 0, ok: 0, avgTtft: null, avgLatency: null, uptime: null }))} />
          </div>

          {/* Incidents */}
          <div>
            <p className="section-label mb-2">Recent incidents</p>
            {model.incidents.length === 0 ? (
              <p className="body-xs text-text-tertiary">No incidents recorded in the last 24h.</p>
            ) : (
              <div className="space-y-1.5">
                {model.incidents.slice(0, 12).map((inc) => {
                  const color =
                    inc.severity === "critical" ? "var(--status-critical)" : inc.severity === "warning" ? "var(--status-warn)" : "var(--status-healthy)";
                  return (
                    <div key={inc.id} className="flex items-start gap-2.5 rounded-md border border-border-subtle bg-surface-recessed px-3 py-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} />
                      <div className="min-w-0 flex-1">
                        <p className="body-sm text-text-primary [overflow-wrap:anywhere]">{inc.message}</p>
                        <p className="metric-xs text-text-quaternary">{inc.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Vital({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-recessed p-2.5">
      <p className="label-xs text-text-tertiary">{label}</p>
      <p className="metric-lg text-text-primary mt-0.5">
        {value}
        <span className="metric-xs text-text-quaternary ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-md border border-border-subtle bg-surface-recessed px-3 py-1.5">
      <span className="label-xs text-text-tertiary">{label}</span>
      <span className="body-xs text-text-secondary capitalize text-right">{value}</span>
    </div>
  );
}
