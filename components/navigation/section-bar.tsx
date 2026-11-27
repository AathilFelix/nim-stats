"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { SUPPORTED_RANGES, useTrendRange } from "@/components/dashboard/trend-range";
import { Seg } from "@/components/ui/seg";
import { cn } from "@/lib/utils";

// Tab order is the information scent; the scroll spy below goes by DOM position.
const TABS = [
  { id: "fleet", label: "Fleet" },
  { id: "endpoints", label: "Endpoints" },
  { id: "reliability", label: "Reliability" },
  { id: "incidents", label: "Incidents" },
] as const;

// The picker only offers windows the trend API serves (12h, 24h, 7d).
const RANGE_LABELS = SUPPORTED_RANGES;

// Space between the viewport top and the point where a section counts as "reached".
const SPY_OFFSET = 96;

// "Updated 38 s ago" ticks once a second; the quantised snapshot keeps
// getSnapshot stable inside a second.
function subscribeSecond(notify: () => void) {
  const id = setInterval(notify, 1000);
  return () => clearInterval(id);
}
const nowSecond = () => Math.floor(Date.now() / 1000);
const serverSecond = () => null;

function formatAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

// The underline spans the label text, not the tab's horizontal padding.
function placeUnderline(nav: HTMLElement): boolean {
  const tab = nav.querySelector<HTMLElement>('.tab[aria-current="true"]');
  if (!tab || tab.offsetWidth === 0) return false;
  const cs = getComputedStyle(tab);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  nav.style.setProperty("--tab-x", `${tab.offsetLeft + padL}px`);
  nav.style.setProperty("--tab-w", String(Math.max(1, tab.offsetWidth - padL - padR)));
  nav.style.setProperty("--tab-y", `${nav.clientHeight - (tab.offsetTop + tab.offsetHeight)}px`);
  nav.dataset.ready = "1";
  return true;
}

/**
 * Section tabs (anchor links) plus the trend range picker and the "Updated … ago"
 * refresh control. Sticky from 768px up; static on phones, where the nav above
 * it scrolls away.
 */
export function SectionBar({ lastProbe }: { lastProbe: Date | string | null }) {
  const { range, setRange } = useTrendRange();
  const [active, setActive] = useState<string>(TABS[0].id);
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const second = useSyncExternalStore(subscribeSecond, nowSecond, serverSecond);
  const navRef = useRef<HTMLElement>(null);
  // After a tab click the destination is locked until the smooth scroll arrives,
  // so the underline does not flip through every section on the way. A wheel,
  // touch or key press hands control back to the spy.
  const lock = useRef<string | null>(null);

  // M5: one underline carried to the active tab. It is placed in the same commit
  // the active tab changes and travels on transform (translateX + scaleX).
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (nav) placeUnderline(nav);
  });
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(() => {
      delete nav.dataset.anim;
      if (!placeUnderline(nav)) return;
      requestAnimationFrame(() => requestAnimationFrame(() => (nav.dataset.anim = "1")));
    });
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // Scroll spy: the active tab is the last section whose top has passed the bar.
  useEffect(() => {
    let frame = 0;
    let settle = 0;
    const measure = () => {
      frame = 0;
      if (lock.current) {
        setActive(lock.current);
        return;
      }
      let current: string = TABS[0].id;
      let best = -Infinity;
      for (const t of TABS) {
        const el = document.getElementById(t.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= SPY_OFFSET && top > best) {
          best = top;
          current = t.id;
        }
      }
      setActive(current);
    };
    const release = () => {
      if (!lock.current) return;
      lock.current = null;
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onScroll = () => {
      if (lock.current) {
        // The smooth scroll has arrived once it has been quiet for a moment.
        clearTimeout(settle);
        settle = window.setTimeout(release, 140);
      }
      if (!frame) frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", release);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", release);
    };
  }, []);

  const probeAt = lastProbe ? new Date(lastProbe).getTime() : null;
  const ago =
    probeAt != null && second != null ? formatAgo(Math.max(0, second - Math.floor(probeAt / 1000))) : "—";
  const updated = probeAt != null ? `Updated ${ago}` : "Refresh";

  return (
    <div className="border-b border-border-base bg-surface-base md:sticky md:top-0 md:z-40">
      <div className="mx-auto flex max-w-(--page-max) flex-col px-4 md:h-12 md:flex-row md:items-stretch md:gap-6 md:px-6">
        <nav
          ref={navRef}
          aria-label="Sections"
          className="tabs-nav no-scrollbar -mx-3 flex h-12 gap-1 overflow-x-auto md:mx-0 md:h-auto"
        >
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="tab"
              aria-current={active === t.id ? "true" : undefined}
              onClick={() => {
                lock.current = t.id;
                setActive(t.id);
              }}
            >
              {t.label}
            </a>
          ))}
          <span className="tab-line" aria-hidden="true" />
        </nav>

        <div className="flex items-center justify-between gap-3 border-t border-border-subtle py-3 md:ml-auto md:gap-4 md:border-0 md:py-0">
          <Seg role="group" aria-label="Time range" className="max-md:flex-1">
            {RANGE_LABELS.map((r) => (
              <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </Seg>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            aria-label={updated === "Refresh" ? "Refresh" : `${updated}. Refresh`}
            className="press inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xs px-1 md:-mr-1 body-sm text-text-muted hover:text-text-primary max-md:w-9 max-md:justify-center"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "spin")} strokeWidth={2} aria-hidden="true" />
            {/* The server and first client render show a placeholder; the real "x ago"
                arrives at hydration. The widest string is reserved in the same grid
                cell and the placeholder is not painted, so the right-hand group never
                moves and nothing reflows when the real value lands (R10). */}
            <span className="grid max-md:hidden">
              <span className="invisible col-start-1 row-start-1" aria-hidden="true">Updated 59 min ago</span>
              <span className={cn("col-start-1 row-start-1 text-right", second == null && "invisible")} suppressHydrationWarning>
                {updated}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
