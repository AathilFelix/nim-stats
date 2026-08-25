// Server-only: turns the live dashboard data into the flat shape the Markdown
// builders consume. Kept apart from site-markdown.ts so the builders stay pure
// and unit-testable without a database.

import { computeFleetState, findBestModel } from "@/lib/operational-engine"
import { getDashboardModels } from "@/lib/dashboard-data"
import type { FleetSnapshot, MarkdownModel } from "@/lib/markdown/site-markdown"

export async function getFleetSnapshot(): Promise<FleetSnapshot> {
  const models = await getDashboardModels()

  if (models.length === 0) {
    return { models: [], recommended: null, lastProbeAt: null, fleetState: "unknown" }
  }

  const lastProbe = models.reduce<Date | null>((latest, m) => {
    const d = m.lastChecked instanceof Date ? m.lastChecked : new Date(m.lastChecked)
    return !latest || d > latest ? d : latest
  }, null)

  const enriched = models as unknown as Array<Record<string, unknown>>
  const { state } = computeFleetState(enriched)

  // Same engine the dashboard renders, so the Markdown and the HTML never
  // recommend different endpoints. An empty object means nothing qualified.
  const best = findBestModel(enriched)
  const recommended = Object.keys(best.model).length > 0
    ? { model: toMarkdownModel(best.model as unknown as (typeof models)[number]), reasons: best.reasons }
    : null

  return {
    fleetState: state,
    lastProbeAt: lastProbe ? lastProbe.toISOString() : null,
    recommended,
    models: models.map(toMarkdownModel),
  }
}

function toMarkdownModel(m: {
  id: string
  name: string
  provider: string
  status: string
  uptime: number
  ttft: number
  throughput: number
  reliability: number
  congestion: number
}): MarkdownModel {
  return {
    id: m.id,
    name: m.name,
    provider: m.provider,
    status: m.status,
    uptime: m.uptime,
    ttft: m.ttft,
    throughput: m.throughput,
    reliability: m.reliability,
    congestion: m.congestion,
  }
}
