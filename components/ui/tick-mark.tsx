/**
 * A check mark that draws itself left to right. The wipe is a clip-path on the
 * svg (see `.tick-draw` in globals.css), which starts when its label turns on.
 */
export function TickMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ? `tick-draw ${className}` : "tick-draw"}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
