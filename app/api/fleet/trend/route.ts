import { NextResponse } from "next/server"
import { getFleetTrend } from "@/lib/dashboard-data"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 15

// Maps a UI range token to a query window and bucket width so each range stays
// readable (≈70–150 points): 12h→10m, 24h→20m, 7d→2h.
const RANGES: Record<string, { hours: number; bucketMinutes: number }> = {
  "12h": { hours: 12, bucketMinutes: 10 },
  "24h": { hours: 24, bucketMinutes: 20 },
  "7d": { hours: 168, bucketMinutes: 120 },
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const range = url.searchParams.get("range") ?? "12h"
    const cfg = RANGES[range] ?? RANGES["12h"]
    const data = await getFleetTrend(cfg.hours, cfg.bucketMinutes)
    return NextResponse.json({ range: RANGES[range] ? range : "12h", data })
  } catch (err) {
    api.error("GET /api/fleet/trend failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
