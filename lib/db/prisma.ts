import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

declare global {
  var __prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. The Next.js app loads it from .env automatically; " +
    "standalone scripts must preload it (e.g. `tsx --env-file=.env <script>`). " +
    "Without it, pg silently connects to the wrong database.",
  )
}

const adapter = new PrismaPg({ connectionString })

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") { global.__prisma = prisma }
