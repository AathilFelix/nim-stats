// Server-only adapter: turns live telemetry from the database into the
// `NIMModel` shape the dashboard/discover components already consume.
//
// The probe pipeline stores raw measurements (ttft, latency, throughput,
// success, congestion, state). The UI contract additionally expects derived
// analytics (session reliability, volatility, routing confidence, incidents,
// …) — those are computed by `enrichModel`, then the real sample-derived
// fields are layered back on top.
import { prisma } from "@/lib/db/prisma"
import { enrichModel } from "@/lib/operational-engine"
import type { NIMModel, ModelStatus } from "@/components/dashboard/mock-data"
import type {
  ReliabilityResponse,
  ModelReliability,
  DayUptime,
  HourBucket,
  SlaWindow,
} from "@/lib/reliability-types"

const RECENT_SAMPLES = 60

type SampleRow = {
  timestamp: Date
  ttftMs: number | null
  latencyMs: number
  throughput: number | null
  success: boolean
  timeout: boolean
  congestion: number | null
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function percentile(arr: number[], pct: number): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.min(Math.floor(sorted.length * pct), sorted.length - 1)]
}

function hhmm(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function relTime(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Build the core (real) NIMModel fields from raw samples + latest snapshot.
// `samples` arrive newest-first; chronological order is used for history series.
function toBaseModel(
  model: { id: string; name: string; provider: string },
  state: ModelStatus,
  congestion01: number,
  ttftMs: number,
  throughput: number,
  lastProbeAt: Date,
  samples: SampleRow[],
): NIMModel {
  const chrono = [...samples].reverse()
  const n = samples.length || 1
  const successRate = samples.filter((s) => s.success).length / n
  const timeoutRate = samples.filter((s) => s.timeout).length / n
  const ttfts = chrono.map((s) => s.ttftMs).filter((v): v is number => v != null)

  const reliability = Math.round(successRate * 100)
  const uptime = Math.round(successRate * 10000) / 100 // two decimals, e.g. 99.95

  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    status: state,
    uptime,
    ttft: Math.round(ttftMs),
    throughput: Math.round(throughput * 10) / 10,
    reliability,
    congestion: Math.round(congestion01 * 100),
    lastChecked: lastProbeAt,
    reliabilityHistory: chrono.map((s) => ({
      time: hhmm(s.timestamp),
      score: s.success ? Math.round((1 - (s.congestion ?? 0)) * 100) : 0,
    })),
    throughputHistory: chrono.map((s) => Math.round((s.throughput ?? 0) * 10) / 10),
    latencyHistory: chrono.map((s) => Math.round(s.latencyMs)),
    // Derived analytics below are placeholders; enrichModel fills real values.
    sessionReliability: { score: 0, state: "stable" },
    volatility: { measure: "stable", score: 0 },
    recovery: "stable",
    congestionTrend: "stable",
    routingConfidence: "moderate_confidence",
    timeoutRate: Math.round(timeoutRate * 1000) / 10, // percentage
    p95Latency: Math.round(percentile(ttfts, 0.95)),
    p99Latency: Math.round(percentile(ttfts, 0.99)),
    queuePressure: "low",
    incidents: [],
  }
}

/**
 * Live model fleet for the dashboard. Returns only chat-capable, active models
 * that have been probed at least once (so every row has a real state).
 */
export async function getDashboardModels(): Promise<NIMModel[]> {
  const rows = await prisma.nIModel.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      provider: true,
      latest: true,
      samples: {
        orderBy: { timestamp: "desc" },
        take: RECENT_SAMPLES,
        select: {
          timestamp: true,
          ttftMs: true,
          latencyMs: true,
          throughput: true,
          success: true,
          timeout: true,
          congestion: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  // Real incidents (state transitions recorded by the probe runner), grouped per model.
  const since = new Date(Date.now() - 24 * 3_600_000)
  const incidentRows = await prisma.incident.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, createdAt: true, severity: true, message: true, modelId: true },
  })
  const incidentsByModel = new Map<string, NIMModel["incidents"]>()
  for (const inc of incidentRows) {
    if (!inc.modelId) continue
    const list = incidentsByModel.get(inc.modelId) ?? []
    list.push({ id: inc.id, time: relTime(inc.createdAt), severity: inc.severity, message: inc.message, modelId: inc.modelId })
    incidentsByModel.set(inc.modelId, list)
  }

  const models: NIMModel[] = []

  for (const row of rows) {
    const latest = row.latest
    // Skip never-probed / indeterminate models — the UI status union is
    // healthy | busy | jammed only.
    if (!latest || latest.state === "unknown") continue

    const base = toBaseModel(
      { id: row.id, name: row.name, provider: row.provider },
      latest.state as ModelStatus,
      latest.congestion ?? 0,
      latest.ttftMs ?? avg(row.samples.map((s) => s.ttftMs ?? 0)),
      latest.throughput ?? 0,
      latest.lastProbeAt,
      row.samples,
    )

    // enrichModel computes session reliability, volatility, routing confidence,
    // queue pressure and status-derived incidents from the real base fields.
    const enriched = enrichModel(base) as unknown as NIMModel

    // enrichModel overwrites latencyHistory with a synthetic series and recomputes
    // timeoutRate / p95 / p99 — restore the real measured values.
    enriched.latencyHistory = base.latencyHistory
    enriched.throughputHistory = base.throughputHistory
    enriched.reliabilityHistory = base.reliabilityHistory
    enriched.timeoutRate = base.timeoutRate
    enriched.p95Latency = base.p95Latency
    enriched.p99Latency = base.p99Latency
    // Real incidents from the DB, not enrichModel's status-derived synthetic ones.
    enriched.incidents = incidentsByModel.get(row.id) ?? []

    models.push(enriched)
  }

  return models
}

export interface FleetTrendPoint {
  t: string // ISO timestamp of the bucket
  ttftMs: number | null
  throughput: number | null
  successRate: number | null // 0–100
}

/**
 * Fleet-wide time series for the trend chart: buckets all samples over the last
 * `hours` into `~bucketMinutes`-wide points (avg TTFT, avg throughput, success
 * rate). Grows denser as the collector runs.
 */
export async function getFleetTrend(hours = 12, bucketMinutes = 10): Promise<FleetTrendPoint[]> {
  const bucketSec = bucketMinutes * 60
  const rows = await prisma.$queryRaw<
    Array<{ bucket: Date; n: number; ok: number; avg_ttft: number | null; avg_tput: number | null }>
  >`
    SELECT
      to_timestamp(floor(extract(epoch from "timestamp") / ${bucketSec}) * ${bucketSec}) AS bucket,
      count(*)::int AS n,
      count(*) FILTER (WHERE success)::int AS ok,
      avg("ttftMs") FILTER (WHERE success)::float8 AS avg_ttft,
      avg(throughput) FILTER (WHERE success)::float8 AS avg_tput
    FROM "ModelSample"
    WHERE "timestamp" > now() - (${hours} || ' hours')::interval
    GROUP BY bucket
    ORDER BY bucket ASC
  `

  return rows.map((r) => ({
    t: r.bucket.toISOString(),
    ttftMs: r.avg_ttft != null ? Math.round(r.avg_ttft) : null,
    throughput: r.avg_tput != null ? Math.round(r.avg_tput * 10) / 10 : null,
    successRate: r.n > 0 ? Math.round((r.ok / r.n) * 1000) / 10 : null,
  }))
}

function pct(ok: number, total: number): number | null {
  return total > 0 ? Math.round((ok / total) * 10000) / 100 : null
}

/**
 * Per-model reliability breakdown that backs the uptime calendar (daily success
 * over `days`), the time-of-day latency heatmap (hour-of-day buckets over 30d)
 * and the SLA tracker (1d / 7d / 30d uptime windows). All UTC-bucketed. Sparse
 * by design until the collector has accumulated history.
 */
export async function getReliabilityBreakdown(days = 90): Promise<ReliabilityResponse> {
  const models = await prisma.nIModel.findMany({
    where: { isActive: true },
    select: { id: true, name: true, provider: true },
    orderBy: { name: "asc" },
  })

  type DayRow = { modelId: string; day: string; total: number; ok: number; avg_ttft: number | null }
  type HourRow = {
    modelId: string
    hour: number
    total: number
    ok: number
    avg_ttft: number | null
    avg_latency: number | null
  }
  type SlaRow = {
    modelId: string
    t1: number; o1: number
    t7: number; o7: number
    t30: number; o30: number
  }

  const [dayRows, hourRows, slaRows] = await Promise.all([
    prisma.$queryRaw<DayRow[]>`
      SELECT "modelId",
             to_char(("timestamp" AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') AS day,
             count(*)::int AS total,
             count(*) FILTER (WHERE success)::int AS ok,
             avg("ttftMs") FILTER (WHERE success)::float8 AS avg_ttft
      FROM "ModelSample"
      WHERE "timestamp" > now() - (${days} || ' days')::interval
      GROUP BY "modelId", day
    `,
    prisma.$queryRaw<HourRow[]>`
      SELECT "modelId",
             extract(hour FROM ("timestamp" AT TIME ZONE 'UTC'))::int AS hour,
             count(*)::int AS total,
             count(*) FILTER (WHERE success)::int AS ok,
             avg("ttftMs") FILTER (WHERE success)::float8 AS avg_ttft,
             avg("latencyMs") FILTER (WHERE success)::float8 AS avg_latency
      FROM "ModelSample"
      WHERE "timestamp" > now() - interval '30 days'
      GROUP BY "modelId", hour
    `,
    prisma.$queryRaw<SlaRow[]>`
      SELECT "modelId",
             count(*) FILTER (WHERE "timestamp" > now() - interval '1 day')::int AS t1,
             count(*) FILTER (WHERE "timestamp" > now() - interval '1 day' AND success)::int AS o1,
             count(*) FILTER (WHERE "timestamp" > now() - interval '7 days')::int AS t7,
             count(*) FILTER (WHERE "timestamp" > now() - interval '7 days' AND success)::int AS o7,
             count(*)::int AS t30,
             count(*) FILTER (WHERE success)::int AS o30
      FROM "ModelSample"
      WHERE "timestamp" > now() - interval '30 days'
      GROUP BY "modelId"
    `,
  ])

  const daysByModel = new Map<string, DayUptime[]>()
  for (const r of dayRows) {
    const list = daysByModel.get(r.modelId) ?? []
    list.push({ date: r.day, total: r.total, ok: r.ok, uptime: pct(r.ok, r.total) })
    daysByModel.set(r.modelId, list)
  }

  const hoursByModel = new Map<string, Map<number, HourBucket>>()
  for (const r of hourRows) {
    const map = hoursByModel.get(r.modelId) ?? new Map<number, HourBucket>()
    map.set(r.hour, {
      hour: r.hour,
      total: r.total,
      ok: r.ok,
      avgTtft: r.avg_ttft != null ? Math.round(r.avg_ttft) : null,
      avgLatency: r.avg_latency != null ? Math.round(r.avg_latency) : null,
      uptime: pct(r.ok, r.total),
    })
    hoursByModel.set(r.modelId, map)
  }

  const slaByModel = new Map<string, SlaRow>()
  for (const r of slaRows) slaByModel.set(r.modelId, r)

  const win = (total: number, ok: number): SlaWindow => ({ total, ok, uptime: pct(ok, total) })

  const result: ModelReliability[] = models.map((m) => {
    const dayList = (daysByModel.get(m.id) ?? []).sort((a, b) => a.date.localeCompare(b.date))
    const hourMap = hoursByModel.get(m.id)
    const hours: HourBucket[] = Array.from({ length: 24 }, (_, h) =>
      hourMap?.get(h) ?? { hour: h, total: 0, ok: 0, avgTtft: null, avgLatency: null, uptime: null },
    )
    const s = slaByModel.get(m.id)
    return {
      id: m.id,
      name: m.name,
      provider: m.provider,
      days: dayList,
      hours,
      sla: {
        d1: s ? win(s.t1, s.o1) : win(0, 0),
        d7: s ? win(s.t7, s.o7) : win(0, 0),
        d30: s ? win(s.t30, s.o30) : win(0, 0),
      },
    }
  })

  return { updatedAt: new Date().toISOString(), days, models: result }
}
