import { NextResponse } from "next/server"
import { invalidParameter, readOnlyMethodHandler, serverError } from "@/lib/api/errors"
import { DEFAULT_TREND_RANGE, TREND_RANGES, TREND_RANGE_VALUES } from "@/lib/api/params"
import { FLEET_CACHE_CONTROL } from "@/lib/config/cadence"
import { getFleetTrend } from "@/lib/dashboard-data"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 15

// Range tokens map to a window and bucket width so each stays readable
// (≈70–150 points): 12h→10m, 24h→20m, 7d→2h. Defined in lib/api/params.ts,
// which the OpenAPI document reads from too.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const range = url.searchParams.get("range") ?? DEFAULT_TREND_RANGE
    const cfg = TREND_RANGES[range as keyof typeof TREND_RANGES]
    // An unrecognised range used to be coerced to 12h and answered 200, so a
    // caller with a typo got real-looking data for a window they never asked
    // for. The OpenAPI document declares this as an enum; say so instead.
    if (!cfg) return invalidParameter("range", range, TREND_RANGE_VALUES)
    const data = await getFleetTrend(cfg.hours, cfg.bucketMinutes)
    // Let Vercel's CDN serve repeat hits from the edge (s-maxage) so concurrent
    // viewers collapse into ~one function call per 5-min window — matching the
    // cache TTL beneath it and the 10-min probe cadence that produces new rows.
    // `max-age=0` keeps the browser revalidating; `stale-while-revalidate` hides
    // refresh latency.
    return NextResponse.json(
      { range, data },
      { headers: { "Cache-Control": FLEET_CACHE_CONTROL } },
    )
  } catch (err) {
    api.error("GET /api/fleet/trend failed", { error: (err as Error).message })
    return serverError("Reading the fleet trend series")
  }
}

// Read-only endpoint: every other method answers with a structured 405 rather
// than Next's default empty-bodied one.
export const POST = readOnlyMethodHandler
export const PUT = readOnlyMethodHandler
export const PATCH = readOnlyMethodHandler
export const DELETE = readOnlyMethodHandler
