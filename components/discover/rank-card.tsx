"use client";

import { type NIMModel } from "../dashboard/mock-data";
import { getStatusColor } from "../dashboard/mock-data";
import { HorizontalSparkline } from "./horizontal-sparkline";

interface RankCardProps {
  model: NIMModel;
  headlineMetric: { value: string; label: string };
  secondaryMetrics: { value: string; label: string }[];
  historyData: number[];
  selected?: boolean;
  onSelect: (model: NIMModel) => void;
}

export function RankCard({
  model,
  headlineMetric,
  secondaryMetrics,
  historyData,
  selected,
  onSelect,
}: RankCardProps) {
  const statusColor = getStatusColor(model.status);

  return (
    <button
      onClick={() => onSelect(model)}
      className="relative w-[210px] shrink-0 rounded-sm text-left transition-all duration-150 group"
      aria-pressed={selected}
      style={{
        backgroundColor: selected ? 'var(--surface-elevated)' : 'var(--surface-recessed)',
        border: `1px solid ${selected ? 'var(--border-base)' : 'var(--border-subtle)'}`,
      }}
    >
      {selected && (
        <div
          className="absolute inset-x-3 top-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${statusColor}50, transparent)`,
          }}
        />
      )}

      <div className="p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="min-w-0 flex-1">
            <p
              className="font-semibold truncate transition-colors"
              style={{
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}
            >
              {model.name}
            </p>
            <p
              className="truncate"
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '0.65rem',
                color: 'var(--text-tertiary)',
              }}
            >
              {model.provider}
            </p>
          </div>
          <span
            className="shrink-0 ml-2"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: `0 0 6px ${statusColor}60`,
            }}
          />
        </div>

        <div className="mb-3">
          <p
            className="tabular-nums tracking-tight leading-none"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {headlineMetric.value}
          </p>
          <p
            className="mt-1 uppercase tracking-wider"
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '0.55rem',
              color: 'var(--text-tertiary)',
              fontWeight: 600,
              letterSpacing: '0.1em',
            }}
          >
            {headlineMetric.label}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-3">
          {secondaryMetrics.map((m) => (
            <div key={m.label} className="flex flex-col">
              <span
                className="tabular-nums"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                {m.value}
              </span>
              <span
                className="uppercase tracking-wider"
                style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.55rem',
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>

        <HorizontalSparkline
          data={historyData}
          color={statusColor}
          width={182}
          height={24}
        />
      </div>
    </button>
  );
}
