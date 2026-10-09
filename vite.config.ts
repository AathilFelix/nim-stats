import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { workersCacheCdnAdapter } from "@vinext/cloudflare/cache/workers-cache-cdn-adapter";

export default defineConfig({
  resolve: {
    alias: [
      // Workers can't share a pg connection across requests: swap in the
      // per-request, Hyperdrive-backed client. See lib/db/prisma.workers.ts.
      {
        find: /^@\/lib\/db\/prisma$/,
        replacement: fileURLToPath(new URL("./lib/db/prisma.workers.ts", import.meta.url)),
      },
      // Prisma lists the `node` export condition ahead of `workerd`, so the
      // Workers build would get the Node entry, which compiles its query engine
      // from inlined base64 at runtime — something Workers forbid ("Wasm code
      // generation disallowed by embedder"). The edge entry imports the .wasm
      // file as a module instead.
      {
        find: /^@prisma\/client$/,
        replacement: fileURLToPath(new URL("./node_modules/.prisma/client/edge.js", import.meta.url)),
      },
    ],
  },
  plugins: [
    vinext({
      // Pages: Workers Cache at the edge, purged by tag on revalidateTag().
      // unstable_cache entries: KV.
      cache: { data: kvDataAdapter(), cdn: workersCacheCdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
