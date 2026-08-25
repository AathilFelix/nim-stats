import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

// Unit tests only — the agent-readiness surfaces (Accept negotiation, the
// Markdown representations, llms.txt, the sitemap, the JSON-LD graph) are all
// pure functions and data, so they need no browser or database.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
