// One-shot probe job — the production data collector for free hosting.
//
// Unlike `worker.ts` (an always-on node-cron daemon for local dev), this script
// runs ONE cycle and exits. That's what a serverless/cron host can drive:
// GitHub Actions invokes it on a schedule (every 5 min on a public repo =
// unlimited free minutes), since Vercel Hobby has no always-on process and its
// cron fires at most once per day.
//
// Steps (probe is always run; sync/maintenance are opt-in via flags):
//   --sync         re-discover NIM endpoints before probing
//   --maintenance  prune stale samples + retire dead models after probing
// With no flags it just probes. If the registry is empty (cold start) it syncs
// first regardless, so the very first run self-bootstraps.
//
// Env must be loaded before imports evaluate (they build the Prisma adapter from
// DATABASE_URL): run via `tsx --env-file=.env scripts/probe-once.ts` locally, or
// rely on real env vars in CI (see .github/workflows/probe.yml).
import { assertEnv } from "@/lib/config/env"
import {
  runProbeCycle,
  syncModelRegistry,
  getActiveModels,
  pruneStaleSamples,
  markInactiveModels,
} from "@/lib/telemetry/jobs"
import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/telemetry/logger"

async function step(label: string, fn: () => Promise<unknown>): Promise<void> {
  const start = Date.now()
  try {
    await fn()
    logger.info(`${label} done`, { durationMs: Date.now() - start })
  } catch (err) {
    // Surface the failure but keep going — a flaky sync shouldn't skip the probe.
    logger.error(`${label} failed`, { error: (err as Error).message, durationMs: Date.now() - start })
  }
}

async function main(): Promise<void> {
  assertEnv()

  const wantSync = process.argv.includes("--sync")
  const wantMaintenance = process.argv.includes("--maintenance")

  // Cold-start guard: if nothing has ever been discovered, sync no matter what
  // so the first scheduled run produces data instead of probing an empty fleet.
  const active = await getActiveModels()
  const mustSync = wantSync || active.length === 0

  logger.info("probe-once starting", { sync: mustSync, maintenance: wantMaintenance, activeModels: active.length })

  if (mustSync) await step("registry sync", () => syncModelRegistry())
  await step("probe cycle", () => runProbeCycle())
  if (wantMaintenance) {
    await step("prune stale samples", () => pruneStaleSamples())
    await step("mark inactive models", () => markInactiveModels())
  }

  await prisma.$disconnect()
  logger.info("probe-once complete")
  // pg keeps the event loop alive via its pool; exit explicitly so CI doesn't hang.
  process.exit(0)
}

main().catch(async (err) => {
  logger.error("probe-once crashed", { error: (err as Error).message })
  try { await prisma.$disconnect() } catch { /* already down */ }
  process.exit(1)
})
