import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { api } from "@/lib/telemetry/logger"
import { blockUnlessInternal } from "@/lib/api/guard"

export const runtime = "nodejs"
export const maxDuration = 10

export async function GET(req: Request) {
  const blocked = blockUnlessInternal(req)
  if (blocked) return blocked
  try {
    const now = new Date()
    const oneMinAgo = new Date(now.getTime() - 60_000)

    const [
      totalModels,
      activeModels,
      totalSamples,
      recentProbes,
      latestProbe,
      incidentCount,
    ] = await Promise.all([
      prisma.nIModel.count(),
      prisma.nIModel.count({ where: { isActive: true } }),
      prisma.modelSample.count(),
      prisma.modelSample.count({ where: { timestamp: { gte: oneMinAgo } } }),
      prisma.modelSample.findFirst({
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
      prisma.incident.count({ where: { severity: "critical" } }),
    ])

    return NextResponse.json({
      status: "ok",
      timestamp: now.toISOString(),
      database: "connected",
      lastProbeAt: latestProbe?.timestamp.toISOString() ?? null,
      stats: {
        totalModels,
        activeModels,
        totalSamples,
        recentProbesLastMin: recentProbes,
        activeCriticalIncidents: incidentCount,
      },
    })
  } catch (err) {
    api.error("GET /api/fleet/overview failed", { error: (err as Error).message })
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
