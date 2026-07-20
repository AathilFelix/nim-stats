import "dotenv/config"
import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "prisma/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `prisma generate` (postinstall / build) needs a datasource URL to be present
// but never connects, so fall back to a placeholder when DATABASE_URL is unset.
// This keeps builds that lack the secret — e.g. Vercel preview deployments —
// from failing at generate time. Commands that actually connect (migrate, seed,
// db push) still require the real DATABASE_URL and error clearly without it.
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder"

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
  datasource: {
    url: DATABASE_URL,
  },
})
