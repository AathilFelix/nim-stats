// Background worker: the data-collection engine behind the dashboard.
//
// Wires node-cron to the existing telemetry jobs:
//   - model-registry sync  (discover/retire NIM endpoints)
//   - probe cycle          (measure each active endpoint, classify, persist)
//   - maintenance          (prune stale samples, deactivate dead models)
//
// Env must be loaded before this module's imports evaluate (they build the
// Prisma adapter from DATABASE_URL), so run via: `tsx --env-file=.env scripts/worker.ts`
// (the `worker` npm script does this).
import cron from "node-cron"
import { env, assertEnv } from "@/lib/config/env"
import {
  runProbeCycle,
  syncModelRegistry,
  pruneStaleSamples,
  markInactiveModels,
} from "@/lib/telemetry/jobs"
import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/telemetry/logger"

function assertCron(name: string, expr: string): void {
  if (!cron.validate(expr)) throw new Error(`Invalid cron expression for ${name}: "${expr}"`)
}

// Never let a job crash the worker — log and keep the schedule alive.
async function safe(label: string, fn: () => Promise<unknown>): Promise<void> {
  const start = Date.now()
  try {
    await fn()
    logger.info(`${label} done`, { durationMs: Date.now() - start })
  } catch (err) {
    logger.error(`${label} failed`, { error: (err as Error).message, durationMs: Date.now() - start })
  }
}

async function main(): Promise<void> {
  assertEnv()
  assertCron("PROBE_WORKER_CRON", env.PROBE_WORKER_CRON)
  assertCron("MODEL_REGISTRY_SYNC_CRON", env.MODEL_REGISTRY_SYNC_CRON)
  assertCron("MAINTENANCE_CRON", env.MAINTENANCE_CRON)

  logger.info("worker starting", {
    probeCron: env.PROBE_WORKER_CRON,
    syncCron: env.MODEL_REGISTRY_SYNC_CRON,
    maintenanceCron: env.MAINTENANCE_CRON,
    maxRpm: env.PROBE_MAX_RPM,
    concurrency: env.PROBE_CONCURRENCY,
  })

  // Warm start: make sure the registry is populated before the first probe.
  await safe("initial registry sync", () => syncModelRegistry())
  await safe("initial probe cycle", () => runProbeCycle())

  const tasks = [
    cron.schedule(
      env.PROBE_WORKER_CRON,
      () => safe("probe cycle", () => runProbeCycle()),
      { name: "probe", noOverlap: true },
    ),
    cron.schedule(
      env.MODEL_REGISTRY_SYNC_CRON,
      () => safe("registry sync", () => syncModelRegistry()),
      { name: "registry-sync", noOverlap: true },
    ),
    cron.schedule(
      env.MAINTENANCE_CRON,
      () =>
        safe("maintenance", async () => {
          await pruneStaleSamples()
          await markInactiveModels()
        }),
      { name: "maintenance", noOverlap: true },
    ),
  ]

  logger.info("worker ready", { scheduledTasks: tasks.length })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info("worker shutting down", { signal })
    for (const task of tasks) await task.stop()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on("SIGINT", () => void shutdown("SIGINT"))
  process.on("SIGTERM", () => void shutdown("SIGTERM"))
}

main().catch((err) => {
  logger.error("worker crashed", { error: (err as Error).message })
  process.exit(1)
})
