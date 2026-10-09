import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

// Hyperdrive config in front of Supabase (session pooler, port 5432). Created with
// `cf hyperdrive create` / `wrangler hyperdrive create`; the id is not a secret.
const HYPERDRIVE_ID = "92e970b8774f43fe8414eed3f8a70b1a";

export default defineConfig({
  // Same account as cloudflare/cron-worker.
  accountId: "37d032e8c907210ad7543b5eeba23445",
  worker: defineWorker({
    ...cache,
    name: "nim-stats",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-07",
    // pg sockets, node:crypto (lib/api/guard.ts), and process.env populated
    // from the bindings below.
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    // No *.workers.dev copy of the site: staging runs on the nimstatsbeta.aathil.com
    // Custom Domain (attached through the API, so not declared here), where a
    // zone rule can mark it noindex. The production domain is added at cutover.
    workersDev: false,
    observability: { enabled: true },
    env: {
      ...cache.env,
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv(),
      HYPERDRIVE: bindings.hyperdrive({
        id: HYPERDRIVE_ID,
        // `vite dev` talks to the database in .env instead of Hyperdrive.
        dev: { connectionString: process.env.DATABASE_URL },
      }),
      // Locks the internal API routes and /api/internal/revalidate. Must equal
      // the INTERNAL_API_TOKEN GitHub secret the collector sends.
      INTERNAL_API_TOKEN: bindings.secret(),
    },
  }),
});
