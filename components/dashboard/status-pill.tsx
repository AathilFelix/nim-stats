import type { StatusKey } from "@/lib/design-tokens";
import { StatusGlyph, type GlyphState } from "@/components/dashboard/status-glyph";

const GLYPH: Record<StatusKey, GlyphState> = {
  healthy: "healthy",
  busy: "busy",
  jammed: "jammed",
};

/** The word for each state, shared with the table's folded mobile line. */
export const STATUS_WORD: Record<StatusKey, string> = {
  healthy: "Answering",
  busy: "Busy",
  jammed: "Not responding",
};

/** "avoid_for_production" -> "Avoid for production" (sentence case, no underscores). */
export function humanize(value: string | undefined | null): string {
  const t = (value ?? "").replace(/_/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "—";
}

interface StatusPillProps {
  status: StatusKey;
  /** `sm` sits in table rows; `md` is the same pill with a larger shape (drawer header). */
  size?: "sm" | "md";
}

/**
 * State as shape plus an ink word on the chip fill (circle answering, diamond
 * busy, triangle not responding). The colour sits on the shape only (R16).
 */
export function StatusPill({ status, size = "md" }: StatusPillProps) {
  return (
    <span className="stc">
      <StatusGlyph state={GLYPH[status]} size={size === "sm" ? 12 : 14} />
      {STATUS_WORD[status]}
    </span>
  );
}
