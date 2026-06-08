"use client";

import { useMemo } from "react";
import { type NIMModel } from "./mock-data";

interface VerdictBannerProps {
  models: NIMModel[];
}

interface ModelScore {
  model: NIMModel;
  score: number;
}

export function VerdictBanner({ models }: VerdictBannerProps) {
  const recommendation = useMemo<ModelScore | null>(() => {
    const candidates = models.filter((m) => m.status !== "jammed");
    if (candidates.length === 0) return null;

    const scored: ModelScore[] = candidates.map((m) => {
      const reliabilityWeight = m.reliability / 100;
      const congestionWeight = (100 - m.congestion) / 100;
      const throughputWeight = m.throughput / 150;
      const score =
        reliabilityWeight * 0.4 + congestionWeight * 0.3 + throughputWeight * 0.3;
      return { model: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }, [models]);

  const altModel = useMemo(() => {
    if (!recommendation) return null;
    return models.find((m) => m.id !== recommendation.model.id) ?? null;
  }, [models, recommendation]);

  const statusColor = recommendation
    ? recommendation.model.status === "healthy"
      ? "#10b981"
      : recommendation.model.status === "busy"
        ? "#f59e0b"
        : "#ef4444"
    : "#ef4444";

  const statusLabel = recommendation
    ? recommendation.model.status === "healthy"
      ? "Optimal"
      : recommendation.model.status === "busy"
        ? "Elevated load"
        : "Degraded"
    : "No available models";

  const narrative = useMemo(() => {
    if (!recommendation) return null;
    const m = recommendation.model;
    const parts: string[] = [];

    if (m.congestion < 25) {
      parts.push(`Lowest congestion in fleet at ${m.congestion}%.`);
    } else if (m.congestion < 35) {
      parts.push(`Below-average congestion at ${m.congestion}%.`);
    }

    const recent = m.reliabilityHistory.slice(-6);
    const avgRecent =
      recent.reduce((acc, p) => acc + p.score, 0) / recent.length;
    if (avgRecent > 97.5) {
      parts.push(`Stable across last 6h (${avgRecent.toFixed(1)}% avg).`);
    }

    if (m.status === "busy") {
      parts.push("Elevated load; viable for short queries.");
    } else if (m.throughput > 90) {
      parts.push("High throughput; suitable for long sessions.");
    }

    return parts.join(" ");
  }, [recommendation, models]);

  if (!recommendation) {
    return (
      <div className="border-b border-border-subtle pb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-[7px] h-[7px] rounded-full bg-red-500" />
          <span className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
            Fleet unavailable
          </span>
        </div>
        <p className="text-text-tertiary text-base">
          All models currently degraded.
        </p>
      </div>
    );
  }

  const m = recommendation.model;

  return (
    <div className="rounded-2xl border border-border-base overflow-hidden">
      <div className="bg-surface-elevated px-6 py-5">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span
              className="w-[7px] h-[7px] rounded-full shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
              {statusLabel}
            </span>
            <span className="h-3 w-px bg-border-subtle" aria-hidden="true" />
            <span className="text-[11px] text-text-tertiary font-mono tabular-nums">
              {models.filter((x) => x.status === "healthy").length}/
              {models.length} healthy
            </span>
          </div>
          {altModel && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-tertiary">Alt:</span>
              <span className="text-[11px] text-text-secondary">
                {altModel.name}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    altModel.status === "healthy"
                      ? "#10b981"
                      : altModel.status === "busy"
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
          )}
        </div>

        {/* Recommendation headline */}
        <div className="mb-6">
          <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-bold mb-3">
            Use this
          </p>
          <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold text-text-primary tracking-tight leading-[1.1] text-wrap:balance">
            {m.name}
          </h1>
          <div className="flex items-center gap-x-2.5 text-[13px] text-text-tertiary mt-1.5 font-mono">
            <span className="text-text-secondary">{m.provider}</span>
            <span className="text-border-base" aria-hidden="true">
              /
            </span>
            <span>{m.uptime.toFixed(2)}% uptime</span>
          </div>
        </div>

        {/* Narrative */}
        {narrative && (
          <p className="text-[13px] text-text-tertiary leading-relaxed max-w-2xl mb-6">
            {narrative}
          </p>
        )}

        {/* Evidence grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-border-subtle rounded-xl overflow-hidden">
          <EvidenceCell
            value={`${m.throughput.toFixed(1)} tok/s`}
            label="Throughput"
          />
          <EvidenceCell
            value={`${m.congestion}%`}
            label="Congestion"
            tone={m.congestion >= 80 ? "bad" : m.congestion > 50 ? "warn" : "normal"}
          />
          <EvidenceCell
            value={`${m.reliability}%`}
            label="Reliability"
            tone={m.reliability >= 95 ? "normal" : m.reliability >= 85 ? "warn" : "bad"}
          />
          <EvidenceCell
            value={`${m.ttft}ms`}
            label="First token"
            tone={m.ttft > 1000 ? "bad" : m.ttft > 500 ? "warn" : "normal"}
          />
        </div>
      </div>
    </div>
  );
}

function EvidenceCell({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: "normal" | "warn" | "bad";
}) {
  const color =
    tone === "bad"
      ? "#ef4444"
      : tone === "warn"
        ? "#f59e0b"
        : tone === "normal"
          ? "#10b981"
          : undefined;

  return (
    <div className="bg-surface-recessed px-4 py-3.5">
      <p className="text-[10px] text-text-tertiary uppercase tracking-[0.08em] font-bold mb-1">
        {label}
      </p>
      <p
        className="text-sm font-bold tabular-nums tracking-tight"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
