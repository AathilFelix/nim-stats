import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { aggregateModel, type WindowSize } from "@/lib/telemetry/aggregation"
import { api } from "@/lib/telemetry/logger"

export const runtime = "nodejs"
export const maxDuration = 10

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(_req.url)
    const window = (url.searchParams.get("window") as WindowSize | null) ?? "1h"

    const model = await prisma.nIModel.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        provider: true,
        isActive: true,
        raw: true,
        createdAt: true,
        updatedAt: true,
        latest: true,
        samples: {
          orderBy: { timestamp: "desc" },
          take: Number.parseInt(url.searchParams.get("limit") ?? "60", 10),
          select: {
            timestamp: true,
            ttftMs: true,
            latencyMs: true,
            throughput: true,
            success: true,
            errorCode: true,
            timeout: true,
            congestion: true,
            operationalState: true,
          },
        },
      },
    })

    if (!model) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    const [agg5m, agg1h, agg24h] = await Promise.all([
      aggregateModel(id, "5m"),
      aggregateModel(id, "1h"),
      aggregateModel(id, "24h"),
    ])

    return NextResponse.json({
      data: {
        id: model.id,
        name: model.name,
        slug: model.slug,
        provider: model.provider,
        state: model.latest?.state ?? "unknown",
        lastProbeAt: model.latest?.lastProbeAt.toISOString() ?? null,
        aggregation: {
          "5m": agg5m,
          "1h": agg1h,
          "24h": agg24h,
        },
        samples: model.samples.map((s) => ({
          timestamp: s.timestamp.toISOString(),
          ttftMs: s.ttftMs,
          latencyMs: s.latencyMs,
          throughput: s.throughput,
          success: s.success,
          errorCode: s.errorCode,
          timeout: s.timeout,
          congestion: s.congestion,
          operationalState: s.operationalState,
        })),
      },
    })
  } catch (err) {
    api.error("GET /api/models/[id] failed", { error: (err as Error).message })
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
