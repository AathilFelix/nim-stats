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

export async function syncModelRegistry(): Promise<{ added: number; updated: number; deactivated: number }> {
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

  logger.info("model-registry synced", { added, updated, deactivated: deactivated.count })
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
