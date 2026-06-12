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

// Pin every connection's session timezone to UTC. Without this, a non-UTC
// server/session timezone (e.g. Asia/Kolkata) makes the pg adapter store
// `timestamptz` values offset by the local zone: Prisma↔Prisma round-trips
// cancel out and look fine, but every raw SQL time-window query (now() - interval
// '1 hour', date/hour bucketing) compares against shifted timestamps — silently
// emptying the anomaly/quota/trend "recent" windows. `-c timezone=UTC` is sent as
// a startup parameter on each pooled connection, so reads and writes agree on UTC.
const adapter = new PrismaPg({ connectionString, options: "-c timezone=UTC" })

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") { global.__prisma = prisma }
