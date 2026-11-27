export type GlyphState = "healthy" | "busy" | "jammed" | "neutral";

const COLOR: Record<GlyphState, string> = {
  healthy: "text-status-healthy",
  busy: "text-status-warn",
  jammed: "text-status-critical",
  neutral: "text-status-neutral",
};

/**
 * State shape: circle (answering), diamond (busy), triangle (not responding),
 * ring (unmeasured). The colour sits on the shape only; the word beside it is
 * set in ink or muted, so state is never colour alone.
 */
export function StatusGlyph({
  state, size = 12, className = "",
}: { state: GlyphState; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      className={`block shrink-0 ${COLOR[state]} ${className}`}
    >
      {state === "healthy" && <circle cx="6" cy="6" r="5.2" fill="currentColor" />}
      {state === "busy" && <path d="M6 .4 11.6 6 6 11.6.4 6z" fill="currentColor" />}
      {state === "jammed" && <path d="M6 .8 11.7 11.2H.3z" fill="currentColor" />}
      {state === "neutral" && <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  );
}
