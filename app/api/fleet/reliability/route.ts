import { NextResponse } from "next/server"
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
    // Slow-moving (90-day window); cache hard at the edge. See trend route notes.
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=600" },
    })
  } catch (err) {
    api.error("GET /api/fleet/reliability failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
