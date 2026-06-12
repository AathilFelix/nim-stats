import { NextResponse } from "next/server"
import { getReliabilityBreakdown } from "@/lib/dashboard-data"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 15

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const days = Math.min(365, Math.max(1, Number.parseInt(url.searchParams.get("days") ?? "90", 10) || 90))
    const data = await getReliabilityBreakdown(days)
    return NextResponse.json(data)
  } catch (err) {
    api.error("GET /api/fleet/reliability failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
