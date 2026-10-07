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

const getPrisma = cacheForRequest(() => {
  const client = new PrismaClient({
    // Hyperdrive advises a small per-request pool; it does the real pooling.
    adapter: new PrismaPg({ connectionString: connectionString(), max: 5 }),
    log: ["error", "warn"],
  })
  // Close this request's connections once the response is sent. Left open, they
  // outlive the request and keep holding Hyperdrive's few origin connections
  // until every one is taken and later requests time out waiting for a slot.
  after(() => client.$disconnect())
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
