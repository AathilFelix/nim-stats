import { NextResponse } from "next/server"
import { invalidParameter, readOnlyMethodHandler, serverError } from "@/lib/api/errors"
import { DEFAULT_RELIABILITY_DAYS, RELIABILITY_DAY_VALUES } from "@/lib/api/params"
import { FLEET_CACHE_CONTROL } from "@/lib/config/cadence"
import { getReliabilityBreakdown } from "@/lib/dashboard-data"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 15

// Public (the SLA/calendar/heatmap panels fetch this). The accepted `days`
// values live in lib/api/params.ts, shared with the OpenAPI document.
const ALLOWED_DAYS = new Set<number>(RELIABILITY_DAY_VALUES)

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const raw = url.searchParams.get("days")
    const days = raw === null ? DEFAULT_RELIABILITY_DAYS : Number.parseInt(raw, 10)
    // Same reasoning as `range` on /api/fleet/trend: silently snapping an
    // unsupported window to 90 days hands the caller a different answer than
    // the one they asked for, with no way to tell.
    if (!ALLOWED_DAYS.has(days)) return invalidParameter("days", raw ?? "", RELIABILITY_DAY_VALUES)
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
    return serverError("Reading the reliability breakdown")
  }
}

// Read-only endpoint: every other method answers with a structured 405 rather
// than Next's default empty-bodied one.
export const POST = readOnlyMethodHandler
export const PUT = readOnlyMethodHandler
export const PATCH = readOnlyMethodHandler
export const DELETE = readOnlyMethodHandler
