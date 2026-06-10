import type { AggregateResult } from "./types"
import { prisma } from "@/lib/db/prisma"

export async function aggregateModel(
  modelId: string,
  window: "5m" | "1h" | "24h",
): Promise<AggregateResult> {
  const now = new Date()
  const windowMs = window === "5m" ? 300_000 : window === "1h" ? 3_600_000 : 86_400_000
  const since = new Date(now.getTime() - windowMs)

  const samples = await prisma.modelSample.findMany({
    where: { modelId, timestamp: { gte: since } },
    select: {
      ttftMs: true, latencyMs: true, throughput: true,
      success: true, errorCode: true, timeout: true,
    },
    orderBy: { timestamp: "desc" },
  })

  if (!samples.length) {
    return {
      count: 0, avgTtftMs: null, avgLatencyMs: null, avgThroughput: null,
      avgCongestion: null, successRate: null, errorRate: null, timeoutRate: null,
      p50TtftMs: null, p95TtftMs: null, p99TtftMs: null, minTtftMs: null, maxTtftMs: null,
    }
  }

  const count = samples.length
  const ttfts = samples.map((s) => s.ttftMs).filter((v): v is number => v != null)
  const latencies = samples.map((s) => s.latencyMs).filter((v): v is number => v != null)
  const throughputs = samples.map((s) => s.throughput).filter((v): v is number => v != null)
  const errors = samples.filter((s) => !s.success).length
  const timeouts = samples.filter((s) => s.timeout).length

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  const p = (arr: number[], pct: number) => {
    if (!arr.length) return null
    const sorted = [...arr].sort((a, b) => a - b)
    return sorted[Math.min(Math.floor(sorted.length * pct), sorted.length - 1)]
  }

  return {
    count,
    avgTtftMs: ttfts.length ? avg(ttfts) : null,
    avgLatencyMs: latencies.length ? avg(latencies) : null,
    avgThroughput: throughputs.length ? avg(throughputs) : null,
    avgCongestion: null,
    successRate: (count - errors) / count,
    errorRate: errors / count,
    timeoutRate: timeouts / count,
    p50TtftMs: p(ttfts, 0.5), p95TtftMs: p(ttfts, 0.95), p99TtftMs: p(ttfts, 0.99),
    minTtftMs: ttfts.length ? Math.min(...ttfts) : null,
    maxTtftMs: ttfts.length ? Math.max(...ttfts) : null,
  }
}

export async function getFleetOverview() {
  const now = new Date()
  const oneMinAgo = new Date(now.getTime() - 60_000)

  const [
    totalModels, activeModels, totalSamples,
    recentProbes, latestProbe, incidentCount, activeByState,
  ] = await Promise.all([
    prisma.nIModel.count(),
    prisma.nIModel.count({ where: { isActive: true } }),
    prisma.modelSample.count(),
    prisma.modelSample.count({ where: { timestamp: { gte: oneMinAgo } } }),
    prisma.modelSample.findFirst({ orderBy: { timestamp: "desc" }, select: { timestamp: true } }),
    prisma.incident.count({ where: { severity: "critical" } }),
    prisma.modelSampleLatest.groupBy({ by: ["state"], _count: { _all: true } }),
  ])

  const stateMap = new Map(activeByState.map((s: { state: string; _count: { _all: number } }) => [s.state, s._count._all]))

  return {
    status: "ok",
    timestamp: now.toISOString(),
    database: "connected",
    lastProbeAt: latestProbe?.timestamp.toISOString() ?? null,
    stats: {
      totalModels, activeModels, totalSamples,
      recentProbesLastMin: recentProbes,
      activeCriticalIncidents: incidentCount,
      activeByState: {
        healthy: stateMap.get("healthy") ?? 0,
        busy: stateMap.get("busy") ?? 0,
        jammed: stateMap.get("jammed") ?? 0,
        unknown: stateMap.get("unknown") ?? 0,
      },
    },
  }
}

export type { WindowSize } from "./types"

export async function getProviderStats() {
  const models = await prisma.nIModel.findMany({
    where: { isActive: true },
    include: { latest: true },
  })

  const providerMap = new Map<string, { total: number; healthy: number; busy: number; jammed: number; unknown: number }>()

  for (const model of models) {
    const provider = model.provider
    const existing = providerMap.get(provider) ?? { total: 0, healthy: 0, busy: 0, jammed: 0, unknown: 0 }
    existing.total++
    const state = model.latest?.state ?? "unknown"
    if (state === "healthy") existing.healthy++
    else if (state === "busy") existing.busy++
    else if (state === "jammed") existing.jammed++
    else existing.unknown++
    providerMap.set(provider, existing)
  }

  return Array.from(providerMap.entries()).map(([name, stats]) => ({
    name,
    ...stats,
  }))
}
