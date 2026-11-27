import type { Incident } from "@/lib/operational-types";
import { StatusGlyph, type GlyphState } from "./status-glyph";

interface Props {
  incidents: Incident[];
  /** id → display name, so the incident's model can be split off its message. */
  models?: Array<{ id: string; name: string }>;
}

const SHOWN = 5;

const GLYPH: Record<string, GlyphState> = { critical: "jammed", warning: "busy", info: "healthy" };
const RANK: Record<string, number> = { critical: 0, warning: 1, info: 2 };

/** "5m ago" / "2h ago" / "12s ago" / "1d ago" → seconds; unknown → Infinity. */
function ageSeconds(time: string): number {
  const m = /^(\d+)\s*([smhd])/.exec(time);
  if (!m) return Infinity;
  return Number(m[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[m[2] as "s" | "m" | "h" | "d"];
}

/**
 * Biggest changes: the recent state transitions the probe runner logged, worst
 * first (critical, then warning, then recoveries), newest first within a
 * severity, one row per endpoint and event.
 */
export function IncidentFeed({ incidents, models = [] }: Props) {
  const names = new Map(models.map((m) => [m.id, m.name]));

  const seen = new Set<string>();
  const ranked = [...incidents]
    .sort((a, b) => (RANK[a.severity] ?? 3) - (RANK[b.severity] ?? 3) || ageSeconds(a.time) - ageSeconds(b.time))
    .filter((inc) => {
      const key = `${inc.modelId ?? ""}|${inc.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const rows = ranked.slice(0, SHOWN);

  return (
    <section
      aria-label="Biggest changes"
      className="panel col-span-12 flex flex-col min-[1100px]:col-span-4"
    >
      <div className="hdiv">
        <h2 className="heading-md">Biggest changes</h2>
        <span className="body-sm text-text-muted">Last 24 h</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 body-sm text-text-muted md:px-6">No changes in the last 24 h</p>
      ) : (
        <ul>
          {rows.map((inc) => {
            const name = inc.modelId ? names.get(inc.modelId) : undefined;
            const hasName = name && inc.message.startsWith(name);
            const what = hasName ? inc.message.slice(name.length).trim() : inc.message;
            return (
              <li
                key={inc.id}
                className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-border-subtle px-4 py-3 last:border-b-0 md:px-6"
              >
                <div className="min-w-0">
                  {hasName && <p className="code [overflow-wrap:anywhere]">{name}</p>}
                  <p className="mt-1 flex items-center gap-2 body-sm text-text-muted">
                    <StatusGlyph state={GLYPH[inc.severity] ?? "neutral"} />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{what}</span>
                  </p>
                </div>
                <span className="body-sm whitespace-nowrap text-text-muted">{inc.time}</span>
              </li>
            );
          })}
          {ranked.length > SHOWN && (
            <li className="px-4 py-3 body-sm text-text-muted md:px-6">
              Showing {SHOWN} of {ranked.length}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
