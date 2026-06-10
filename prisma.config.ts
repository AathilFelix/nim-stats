import "dotenv/config"
import path from "path"
import { fileURLToPath } from "url"
import { defineConfig, env } from "prisma/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
