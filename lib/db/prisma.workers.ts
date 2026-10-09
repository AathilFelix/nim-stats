import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { env } from "cloudflare:workers"
import { cacheForRequest } from "vinext/cache"
import { after } from "next/server"

// Cloudflare Workers build of lib/db/prisma.ts. vite.config.ts swaps this in
// for every import of that module, so the Next.js build (Vercel), the GitHub
// Actions collector and local `next dev` never see it.
//
// Why a separate module: a Worker cannot reuse a socket opened by another
// request ("Cannot perform I/O on behalf of a different request"), so the Node
// build's module-scope client — whose pg pool keeps connections alive between
// requests — would fail on the second request. Here the client is created once
// per request instead. That stays cheap because Hyperdrive keeps the real pool
// to Supabase warm at the edge; each request only opens a short hop to it.
//
// Hyperdrive also terminates TLS to Supabase itself, so the Node build's
// sslmode/`rejectUnauthorized` workaround doesn't apply here.

type HyperdriveEnv = { HYPERDRIVE?: { connectionString: string } }

function connectionString(): string {
  // `vite dev` without a Hyperdrive dev connection string falls back to .env.
  const url = (env as HyperdriveEnv).HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL
  if (!url) throw new Error("No database: bind HYPERDRIVE or set DATABASE_URL.")
  return url
}

// vinext marks the body of an `unstable_cache()` function with this
// AsyncLocalStorage and makes `after()` throw inside it. The first query of a
// request often runs there (lib/dashboard-data.ts), so the disconnect is
// registered from outside that scope; it belongs to the request, not the cache.
type ScopeStorage = { exit<R>(fn: () => R): R }
const UNSTABLE_CACHE_SCOPE = Symbol.for("vinext.unstableCache.als")

const getPrisma = cacheForRequest(() => {
  const client = new PrismaClient({
    // Hyperdrive advises a small per-request pool; it does the real pooling.
    adapter: new PrismaPg({ connectionString: connectionString(), max: 5 }),
    log: ["error", "warn"],
  })
  // Close this request's connections once the response is sent. Left open, they
  // outlive the request and keep holding Hyperdrive's few origin connections
  // until every one is taken and later requests time out waiting for a slot.
  const closeAfterResponse = () => after(() => client.$disconnect())
  // Read per call: vinext installs the storage when next/cache first loads.
  const unstableCacheScope = (globalThis as Record<symbol, ScopeStorage | undefined>)[
    UNSTABLE_CACHE_SCOPE
  ]
  try {
    if (unstableCacheScope) unstableCacheScope.exit(closeAfterResponse)
    else closeAfterResponse()
  } catch (err) {
    // Never fail the query over cleanup: the runtime drops the sockets when the
    // request ends anyway, just later than an explicit disconnect would.
    console.warn("prisma: could not schedule disconnect", (err as Error).message)
  }
  return client
})

// Same export as the Node module, so no call site changes. Every property read
// resolves against this request's client; methods are bound to it, since
// `$queryRaw` and `$transaction` rely on `this`.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, client)
    return typeof value === "function" ? value.bind(client) : value
  },
})
