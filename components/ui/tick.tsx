"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/client/motion";

/**
 * M2: a value that changed since the last render says so, once.
 *
 * - `roll`: the new value enters from the side it moved (higher from below,
 *   lower from above, 0.5em, 280ms) over a colour-neutral wash that holds to
 *   900ms and clears. Non-numeric changes fade instead.
 * - `wash`: the wash only (table numerals, so 50 rows never shift at once).
 * - `fade`: a 160ms fade of the replacement (state shapes and words).
 *
 * Never on first paint: the previous value is seeded at mount. Equal values do
 * nothing. If more than FLASH_BUDGET cells change in one commit (a tab coming
 * back from the background) nothing flashes; the values just swap. The old value
 * is replaced, not animated out, and nothing here changes the box: the wash is
 * absolutely positioned and the roll is a transform.
 */
export const FLASH_BUDGET = 6;

let queue: Array<() => void> = [];
let scheduled = false;

function enqueue(run: () => void) {
  queue.push(run);
  if (scheduled) return;
  scheduled = true;
  // All cells that changed in one commit register before this microtask runs.
  queueMicrotask(() => {
    const batch = queue;
    queue = [];
    scheduled = false;
    if (batch.length <= FLASH_BUDGET) batch.forEach((f) => f());
  });
}

function direction(before: string | number, after: string | number): "up" | "down" | "none" {
  const a = parseFloat(String(before));
  const b = parseFloat(String(after));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return "none";
  return b > a ? "up" : "down";
}

interface TickProps {
  /** The comparison key: when this changes, the cell flashes. */
  value: string | number;
  variant?: "roll" | "wash" | "fade";
  /** What to render; defaults to the value itself. */
  children?: ReactNode;
  className?: string;
}

export function Tick({ value, variant = "roll", children, className }: TickProps) {
  const [flash, setFlash] = useState<{ n: number; dir: "up" | "down" | "none" }>({ n: 0, dir: "none" });
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const before = prev.current;
    prev.current = value;
    if (prefersReducedMotion()) return;
    const dir = direction(before, value);
    enqueue(() => setFlash((f) => ({ n: f.n + 1, dir })));
  }, [value]);

  const live = flash.n > 0;
  return (
    <span className={className ? `tick ${className}` : "tick"}>
      {live && variant !== "fade" && <i key={`w${flash.n}`} className="tick-wash" aria-hidden="true" />}
      <span
        key={flash.n}
        className="tick-v"
        data-fx={live && variant !== "wash" ? variant : undefined}
        data-dir={flash.dir}
      >
        {children ?? value}
      </span>
    </span>
  );
}
