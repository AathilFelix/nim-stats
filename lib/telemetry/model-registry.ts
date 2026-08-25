import { Provider } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { fetchModels } from "@/lib/config/nim"
import { logger } from "./logger"

const providerMap: Record<string, Provider> = {
 meta: Provider.Meta,
 llama: Provider.Meta,
 "nvidia": Provider.NVIDIA,
 nv: Provider.NVIDIA,
 "google": Provider.Google,
 gemini: Provider.Google,
 "microsoft": Provider.Microsoft,
 phi: Provider.Microsoft,
 "alibaba": Provider.Alibaba,
 qwen: Provider.Alibaba,
 mistral: Provider.Mistral,
 "deepseek": Provider.DeepSeek,
}

function inferProvider(modelId: string | undefined): Provider {
 if (!modelId) return Provider.Other
 const lower = modelId.toLowerCase()
 for (const [key, provider] of Object.entries(providerMap)) {
  if (lower.includes(key)) return provider
 }
 return Provider.Other
}

// Families that do NOT serve /v1/chat/completions: embeddings, rerankers,
// retrievers/parsers, pure-vision encoders, CLIP, reward models, NER, video.
// The /v1/models endpoint exposes no capability field, so we filter by name
// and let probe-time 4xx detection retire any stragglers (see probe-runner).
const NON_CHAT_PATTERNS = [
 "embed", "rerank", "retriever", "nvclip", "clip", "bge-", "deplot",
 "fuyu", "kosmos", "neva", "vila", "synthetic-video", "gliner", "reward", "parse",
]

export function isChatCapable(modelId: string | undefined): boolean {
 if (!modelId) return false
 const lower = modelId.toLowerCase()
 return !NON_CHAT_PATTERNS.some((p) => lower.includes(p))
}

// Retirement must never be a one-way door. A retired model is not probed, so it
// can never earn the successful sample that `resurrect` looks for — and once its
// old samples age past RETENTION_DAYS, even a model retired by a transient 4xx
// is sealed out of the fleet for good. Parole reopens that door: each sync,
// a bounded batch of retired-but-still-catalogued models is reactivated for
// re-verification. A genuinely non-chat endpoint 4xxs its way back out within
// RETIRE_STRIKES probes (~30 min), which also refreshes its last-sample time and
// so puts it back on cooldown; a model that works keeps a success on record and
// stays. Cost is bounded: at most PAROLE_BATCH extra endpoints per sync, each
// for a few probe cycles.
const PAROLE_COOLDOWN_MS = 14 * 86_400_000
const PAROLE_BATCH = 10

/**
 * Reactivate retired models that are still listed in the catalog and haven't
 * been re-verified within the cooldown. Oldest evidence first, so models that
 * were never probed at all (added while writes were failing) go first.
 * Pass `all` to parole the whole backlog in one go — for a manual catch-up run.
 */
async function paroleRetiredModels(catalogIds: string[], all = false): Promise<number> {
 const retired = await prisma.nIModel.findMany({
  where: { isActive: false, id: { in: catalogIds } },
  select: { id: true },
 })
 if (!retired.length) return 0

 const retiredIds = retired.map((r) => r.id)
 // `groupBy` compiles to a real SQL GROUP BY: one row per model instead of
 // streaming back every sample just to find each model's newest timestamp.
 const lastSeen = await prisma.modelSample.groupBy({
  by: ["modelId"],
  where: { modelId: { in: retiredIds } },
  _max: { timestamp: true },
 })
 const lastByModel = new Map(lastSeen.map((r) => [r.modelId, r._max.timestamp?.getTime() ?? 0]))

 const cutoff = Date.now() - PAROLE_COOLDOWN_MS
 const eligible = retiredIds
  .filter((id) => (lastByModel.get(id) ?? 0) < cutoff)
  .sort((a, b) => (lastByModel.get(a) ?? 0) - (lastByModel.get(b) ?? 0))
 const batch = all ? eligible : eligible.slice(0, PAROLE_BATCH)
 if (!batch.length) return 0

 const { count } = await prisma.nIModel.updateMany({
  where: { id: { in: batch } },
  data: { isActive: true },
 })
 logger.info("paroled retired models for re-verification", { count, backlog: eligible.length, models: batch })
 return count
}

export async function syncModelRegistry(
 { paroleAll = false }: { paroleAll?: boolean } = {},
): Promise<{ added: number; updated: number; deactivated: number }> {
 try {
  const { data } = await fetchModels()
  if (!data?.length) return { added: 0, updated: 0, deactivated: 0 }

  let added = 0
  let updated = 0
  const seenIds = new Set<string>()

  for (const m of data) {
   if (!m.id) continue
   if (!isChatCapable(m.id)) continue // non-chat models are skipped, then retired by the sweep below
   seenIds.add(m.id)
   const provider = inferProvider(m.owned_by)
   const slug = m.id.split("/").pop()?.toLowerCase().replace(/[^a-z0-9-]/g, "-") || m.id.toLowerCase()
   const name = m.id.split("/").pop() || m.id

   const existing = await prisma.nIModel.findUnique({ where: { id: m.id } })
   if (existing) {
    // Preserve isActive on update — a model retired by probe-time chat detection
    // must not be resurrected by the next sync (avoids active↔retired flapping).
    await prisma.nIModel.update({
     where: { id: m.id },
     data: { name, slug, provider, raw: m as any, updatedAt: new Date() },
    })
    updated++
   } else {
    await prisma.nIModel.create({
     data: { id: m.id, name, slug, provider, isActive: true, raw: m as any },
    })
    added++
   }
  }

  const deactivated = await prisma.nIModel.updateMany({
   where: { isActive: true, NOT: { id: { in: Array.from(seenIds) } } },
   data: { isActive: false },
  })

  // Resurrect wrongly-retired models: still listed in the catalog AND proven
  // chat-capable (>=1 successful probe on record). A genuine non-chat endpoint
  // never succeeds, so it is never resurrected — no active<->retired flapping.
  // This backfills models that a transient 4xx retired before the strike-count
  // guard existed (the erosion behind prod's 26 vs dev's 47 endpoints).
  const seen = Array.from(seenIds)
  // `groupBy` rather than `findMany({ distinct })`: Prisma resolves `distinct`
  // in its query engine, so that form streams back every successful sample row
  // (pg_stat_statements measured ~90k rows per call) just to derive ~34 ids.
  // `groupBy` compiles to a real SQL GROUP BY and returns one row per model.
  const proven = await prisma.modelSample.groupBy({
   by: ["modelId"],
   where: { success: true, modelId: { in: seen } },
  })
  const provenIds = proven.map((p) => p.modelId)
  const resurrected = await prisma.nIModel.updateMany({
   where: { isActive: false, id: { in: provenIds } },
   data: { isActive: true },
  })

  // Everything still retired after the proven-success pass gets a periodic
  // re-check, so a transient 4xx (or a retirement whose evidence has since been
  // pruned) can't keep a working endpoint off the dashboard forever.
  const paroled = await paroleRetiredModels(seen, paroleAll)

  logger.info("model-registry synced", { added, updated, deactivated: deactivated.count, resurrected: resurrected.count, paroled })
  return { added, updated, deactivated: deactivated.count }
 } catch (err) {
  logger.error("model-registry sync failed", { error: (err as Error).message })
  throw err
 }
}

export async function getActiveModels(): Promise<Array<{ id: string; name: string; slug: string; provider: Provider }>> {
 return prisma.nIModel.findMany({
  where: { isActive: true },
  select: { id: true, name: true, slug: true, provider: true },
  orderBy: { updatedAt: "desc" },
 })
}
