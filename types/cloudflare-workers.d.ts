// Minimal typing for the Workers runtime module. Only lib/db/prisma.workers.ts
// imports it, and only the Cloudflare (vinext) build bundles that file, but
// `next build` type-checks every .ts file in the repo.
declare module "cloudflare:workers" {
  export const env: Record<string, unknown>
}
