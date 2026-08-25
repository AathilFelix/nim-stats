import { NextResponse } from "next/server"
import { FLEET_CACHE_CONTROL } from "@/lib/config/cadence"
import { getReliabilityBreakdown } from "@/lib/dashboard-data"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 15

// Public (the SLA/calendar/heatmap panels fetch this). `days` is snapped to a
// small allowlist so callers can't cache-bust with 365 distinct heavy queries —
// the UI only ever uses the default 90.
const ALLOWED_DAYS = new Set([7, 30, 90, 365])

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const requested = Number.parseInt(url.searchParams.get("days") ?? "90", 10)
    const days = ALLOWED_DAYS.has(requested) ? requested : 90
    const data = await getReliabilityBreakdown(days)
    // The 90-day aggregate is slow-moving, so the expensive part stays cached
    // server-side (see getReliabilityBreakdown's TTL). The edge window is the
    // shared FLEET_TTL instead of double it: the fleet's *composition* changes
    // the moment the registry paroles or retires an endpoint, and an edge entry
    // outliving the page's own ISR window is what left the SLA and latency
    // panels rendering a 34-model fleet next to a 78-model table.
    return NextResponse.json(data, {
      headers: { "Cache-Control": FLEET_CACHE_CONTROL },
    })
  } catch (err) {
    api.error("GET /api/fleet/reliability failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
