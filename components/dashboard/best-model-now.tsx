"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TickMark } from "@/components/ui/tick-mark";
import type { BestModelResult } from "@/lib/operational-types";
import { Tick } from "@/components/ui/tick";

interface Props {
  recommendation: BestModelResult | null;
}

type CopyState = "idle" | "copied" | "failed";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Insecure context or denied permission: fall back to a transient textarea.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyId({ id }: { id: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    const ok = await writeClipboard(id);
    setState(ok ? "copied" : "failed");
    // A second click restarts the clock instead of stacking.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <>
      {/* The three labels share one grid cell, so the button is as wide as the
          widest and the id beside it never moves (R10). */}
      <button type="button" onClick={copy} className="btn btn-feat shrink-0">
        <span className="lbl-stack">
          <span className="lbl" data-on={state === "idle"} aria-hidden={state !== "idle"}>Copy id</span>
          <span className="lbl" data-on={state === "copied"} aria-hidden={state !== "copied"}>
            <TickMark />
            Copied
          </span>
          <span className="lbl" data-on={state === "failed"} aria-hidden={state !== "failed"}>Failed</span>
        </span>
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? `Copied ${id}` : state === "failed" ? "Could not copy" : ""}
      </span>
    </>
  );
}

const asNumber = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * "Call this now": the one inverted card (emerald in dark, ink in light). The
 * endpoint id sits in a code block with a Copy id button, then the two numbers
 * that justify the pick and a reason line built from the engine's own reasons.
 * When nothing qualifies the card keeps its size and says so.
 */
export function BestModelNow({ recommendation }: Props) {
  const m = recommendation?.model;
  // `findBestModel` signals "nothing qualified" with an empty object, not null:
  // truthy, so it has to be checked by key count.
  const model = m && Object.keys(m).length > 0 ? m : null;

  const id = model && typeof model.id === "string" ? model.id : null;
  const ttft = model ? asNumber(model.ttft) : null;
  const throughput = model ? asNumber(model.throughput) : null;
  const uptime = model ? asNumber(model.uptime) : null;
  const reasons = recommendation?.reasons ?? [];

  const reason = id
    ? [
        ...reasons.slice(0, 2).map((r) => `${r}.`),
        uptime != null ? `Uptime ${uptime}% on recent probes.` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "No endpoint currently meets the thresholds for routing. This updates after the next probe.";

  return (
    <aside
      aria-label="Recommended endpoint"
      className="reveal panel panel-featured col-span-12 flex flex-col gap-4 p-4 md:p-6 min-[1100px]:col-span-4"
      style={{ "--i": 1 } as CSSProperties}
    >
      <h2 className="heading-md">Call this now</h2>

      <div className="code-block">
        {id ? (
          <>
            <Tick value={id} variant="fade">
              <code className="code [overflow-wrap:anywhere]">{id}</code>
            </Tick>
            <CopyId id={id} />
          </>
        ) : (
          <>
            <span className="body-sm opacity-80">No endpoint qualifies</span>
            <button type="button" disabled className="btn btn-feat shrink-0 opacity-40">
              Copy id
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Figure value={ttft != null && ttft > 0 ? String(Math.round(ttft)) : "—"} unit="ms" caption="first token" />
        <Figure
          value={throughput != null && throughput > 0 ? throughput.toFixed(1) : "—"}
          unit="tok/s"
          caption="throughput"
        />
      </div>

      <p className="feat-mute mt-auto body-sm">{reason}</p>
    </aside>
  );
}

function Figure({ value, unit, caption }: { value: string; unit: string; caption: string }) {
  return (
    <div>
      <p className="metric-xl">
        <Tick value={value} />
        {value !== "—" && <small className="feat-mute body-sm ml-1 tracking-normal">{unit}</small>}
      </p>
      <p className="feat-mute body-sm">{caption}</p>
    </div>
  );
}
