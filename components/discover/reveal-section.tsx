import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A page section that enters once on load: opacity and 6px of rise, 360ms
 * ease-out, staggered by `step` (capped at 4, 45ms each). It is a CSS animation on
 * server-rendered markup, so the content is visible without JavaScript, and
 * `prefers-reduced-motion` places it at its final state (see `.reveal` in
 * globals.css).
 */
export function RevealSection({ children, className, step = 1 }: { children: ReactNode; className?: string; step?: number }) {
  return (
    <div className={cn("reveal", className)} style={{ "--i": step } as CSSProperties}>
      {children}
    </div>
  );
}
