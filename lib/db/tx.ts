import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export async function prismaTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = prisma.$transaction(fn)
    return result as unknown as T
  } finally {
    if (process.env.NODE_ENV === "development") {
      const elapsed = Date.now() - start
      if (elapsed > 200) console.warn(`[db-tx] slow transaction: ${elapsed} ms`)
    }
  }
}
