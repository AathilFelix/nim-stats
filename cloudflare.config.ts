import { bindings, defineConfig, defineWorker, triggers } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

// Hyperdrive config in front of Supabase (session pooler, port 5432). Created with
// `cf hyperdrive create` / `wrangler hyperdrive create`; the id is not a secret.
const HYPERDRIVE_ID = "92e970b8774f43fe8414eed3f8a70b1a";

// KV namespace for Worker Previews (`npm run deploy:preview`), so a branch's
// page data and cache entries never land in production's namespace. Production
// leaves its id out and `cf` resolves it by name (nim-stats-vinext-kv-cache);
// a preview that did the same would resolve to that very namespace.
const PREVIEW_KV_ID = "adf60c3630df4d01bca04f3219b9612e";

// Miniflare's local Hyperdrive rejects a connection string without a password,
// and a local Postgres on trust auth (as in .env.example) has none. Trust auth
// ignores whatever is sent, so a placeholder keeps `npm run dev` working.
function devConnectionString(url: string | undefined): string | undefined {
  if (!url) return url;
  const parsed = new URL(url);
  if (!parsed.password) parsed.password = "local";
  return parsed.toString();
}

// Evaluated once per build: `isPreview` is true for `cf previews deploy`.
export default defineConfig(({ isPreview }) => ({
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
    // Production is the zone route. Declared here because every deploy,
    // including Workers Builds, replaces the Worker's routes with this list.
    // Previews must not claim it.
    triggers: isPreview ? [] : [triggers.fetch({ pattern: "nimstats.aathil.com/*", zone: "aathil.com" })],
    // No *.workers.dev copy of the site.
    workersDev: false,
    // Previews are served on <branch>-nim-stats.<subdomain>.workers.dev, which
    // Cloudflare marks `X-Robots-Tag: noindex`. Worker-level, so production
    // declares it too: a production deploy without it would turn previews off.
    previewUrls: true,
    observability: { enabled: true },
    env: {
      ...cache.env,
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: isPreview ? bindings.kv({ id: PREVIEW_KV_ID }) : bindings.kv(),
      // Previews read the production database through the same Hyperdrive.
      // Every query path they can reach is a read.
      HYPERDRIVE: bindings.hyperdrive({
        id: HYPERDRIVE_ID,
        // `vite dev` talks to the database in .env instead of Hyperdrive.
        dev: { connectionString: devConnectionString(process.env.DATABASE_URL) },
      }),
      // Locks the internal API routes and /api/internal/revalidate. Must equal
      // the INTERNAL_API_TOKEN GitHub secret the collector sends. Previews do
      // not inherit production secrets; without their own, lib/api/guard.ts
      // keeps those routes closed.
      INTERNAL_API_TOKEN: bindings.secret(),
    },
  }),
}));
