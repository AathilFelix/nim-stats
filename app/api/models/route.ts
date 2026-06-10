import { OperationalState } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const maxDuration = 10

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const provider = url.searchParams.get("provider")
    const state = url.searchParams.get("state") // healthy | busy | jammed | unknown

    const where: Record<string, unknown> = { isActive: true }
    if (provider) where.provider = provider
    if (state) {
      const includes = await prisma.modelSampleLatest.findMany({
        where: { state: state as OperationalState },
        select: { modelId: true },
      })
      where.id = { in: includes.map((l) => l.modelId) }
    }

    const models = await prisma.nIModel.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        latest: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    })

    return NextResponse.json({
      data: models.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        provider: m.provider,
        state: m.latest?.state ?? "unknown",
        ttftMs: m.latest?.ttftMs ?? null,
        latencyMs: m.latest?.latencyMs ?? null,
        throughput: m.latest?.throughput ?? null,
        congestion: m.latest?.congestion ?? null,
        errorRate: m.latest?.errorRate ?? null,
        lastProbeAt: m.latest?.lastProbeAt.toISOString() ?? null,
        updatedAt: m.updatedAt.toISOString(),
      })),
    })
  } catch (err) {
    logger.error("GET /api/models failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
