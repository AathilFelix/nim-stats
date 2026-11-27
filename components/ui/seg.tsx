"use client";

import { useEffect, useLayoutEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * M4: segmented control with one thumb. The columns are equal (`.seg` is a grid
 * of 1fr), so the thumb never changes size: it is carried between segments with
 * `transform: translateX`, retargeting from wherever it is if clicked again
 * mid-flight. The pressed segment's label colour crosses 40ms after the thumb
 * leaves. Children are the usual `<button aria-pressed>` list. Without JS, and
 * until the first measure, the pressed button paints its own background.
 */
export function Seg({ className, children, ...rest }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  // Place the thumb under the pressed button. Equal columns are what keep it
  // transform-only; on a narrow screen the columns can be forced unequal by their
  // labels, and then there is no thumb: the pressed button paints its own
  // background (a 150ms colour change) exactly as it does without JS.
  const place = (root: HTMLElement) => {
    const buttons = Array.from(root.querySelectorAll<HTMLElement>(":scope > button"));
    const on = buttons.find((b) => b.getAttribute("aria-pressed") === "true" || b.getAttribute("aria-selected") === "true");
    if (!on || on.offsetWidth === 0) return;
    const equal = buttons.every((b) => Math.abs(b.offsetWidth - on.offsetWidth) <= 1);
    if (!equal) {
      delete root.dataset.thumb;
      return;
    }
    const x = `${on.offsetLeft}px`;
    const w = `${on.offsetWidth}px`;
    if (root.style.getPropertyValue("--thumb-x") !== x) root.style.setProperty("--thumb-x", x);
    if (root.style.getPropertyValue("--thumb-w") !== w) root.style.setProperty("--thumb-w", w);
    root.dataset.thumb = "1";
  };

  // After every commit: the pressed button may have changed. Cheap (3 buttons).
  useLayoutEffect(() => {
    if (ref.current) place(ref.current);
  });

  // Reflow (a resize, the web font arriving, the group becoming visible) moves
  // the thumb without animating it; travel is enabled one frame after the first
  // placement so the thumb is born in place.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      const wasAnimating = root.dataset.anim;
      delete root.dataset.anim;
      place(root);
      if (wasAnimating) requestAnimationFrame(() => requestAnimationFrame(() => (root.dataset.anim = "1")));
    });
    ro.observe(root);
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => (root.dataset.anim = "1")));
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={cn("seg", className)} {...rest}>
      {children}
      <span className="seg-thumb" aria-hidden="true" />
    </div>
  );
}
