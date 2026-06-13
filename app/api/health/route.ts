import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const maxDuration = 10

// Public liveness check — intentionally minimal (no fleet counts) so it's safe
// to expose to uptime monitors. Detailed stats live behind /api/fleet/overview.
export async function GET() {
  try {
    const latestProbe = await prisma.modelSample.findFirst({
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    })
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
        lastProbeAt: latestProbe?.timestamp.toISOString() ?? null,
      },
      // Short edge cache so a chatty uptime monitor can't hammer a function on
      // every ping, while still re-checking the DB every ~15s.
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=15, stale-while-revalidate=30" } },
    )
  } catch (err) {
    api.error("GET /api/health failed", { error: (err as Error).message })
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 })
  }
}
