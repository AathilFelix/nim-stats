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

// Pin the session timezone to UTC, but only for LOCAL connections.
//
// Why it matters: a non-UTC server/session timezone (e.g. a local Postgres.app on
// Asia/Kolkata) makes the pg adapter store `timestamptz` values offset by the
// local zone. Prisma↔Prisma round-trips cancel out and look fine, but every raw
// SQL time-window query (now() - interval '1 hour', date/hour bucketing) then
// compares against shifted timestamps — silently emptying the anomaly/quota/trend
// "recent" windows.
//
// Why local-only: managed prod Postgres (Supabase, Neon) already defaults to UTC,
// so the fix is redundant there — and worse, the `-c timezone=UTC` startup
// parameter can be rejected by transaction-mode poolers (Supabase's Supavisor,
// PgBouncer), which would break the serverless app's connection. So we apply it
// only when connecting to localhost, where it's both needed and safe.
const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString)
// Managed Postgres (Supabase pooler, etc.) terminates TLS with a cert chain Node
// doesn't trust by default, so node-postgres throws "self-signed certificate in
// certificate chain". We relax chain verification for remote DBs via the `ssl`
// option — but node-postgres lets a `sslmode=...` in the URL override that, so we
// strip `sslmode` here and let the explicit `ssl` config win. (The CLI migration
// path keeps `sslmode=require` in DATABASE_URL; only the runtime adapter strips
// it.) Swap to a pinned CA (`ssl: { ca }`) if you want full verification later.
function stripSslmode(url: string): string {
  const q = url.indexOf("?")
  if (q === -1) return url
  const params = new URLSearchParams(url.slice(q + 1))
  params.delete("sslmode")
  const rest = params.toString()
  return rest ? `${url.slice(0, q)}?${rest}` : url.slice(0, q)
}

const adapter = new PrismaPg(
  isLocalDb
    ? { connectionString, options: "-c timezone=UTC" }
    : { connectionString: stripSslmode(connectionString), ssl: { rejectUnauthorized: false } },
)

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
  })

if (process.env.NODE_ENV !== "production") { global.__prisma = prisma }
