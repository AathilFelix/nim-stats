import { env } from "@/lib/config/env"
import { prisma } from "@/lib/db/prisma"
import { logger } from "./logger"

export async function pruneStaleSamples(olderThanDays?: number): Promise<number> {
 const days = olderThanDays ?? env.RETENTION_DAYS
 const cutoff = new Date(Date.now() - days * 86_400_000)

 const result = await prisma.modelSample.deleteMany({
  where: { timestamp: { lt: cutoff } },
 })

 if (result.count > 0) {
  logger.info("pruned stale samples", { count: result.count, olderThanDays: days })
 }
 return result.count
}

export async function markInactiveModels(): Promise<number> {
 const threshold = new Date(Date.now() - 72 * 3_600_000)

 const result = await prisma.nIModel.updateMany({
  where: { isActive: true, updatedAt: { lt: threshold } },
  data: { isActive: false },
 })

 if (result.count > 0) {
  logger.info("marked models inactive", { count: result.count })
 }
 return result.count
}
