// Env must be loaded before this module's imports evaluate (they construct the
// Prisma adapter from DATABASE_URL). The `prisma.config.ts` seed command runs
// this with `tsx --env-file=.env`, so dotenv is not imported here.
import { syncModelRegistry } from "@/lib/telemetry/model-registry"

async function main() {
 console.log("[seed] starting model registry sync...")
 try {
  const result = await syncModelRegistry()
  console.log("[seed] sync complete:", result)
 } catch (err) {
  console.error("[seed] failed:", err)
  process.exitCode = 1
 }
}

main()
