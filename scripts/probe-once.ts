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
//   --parole-all   with --sync: re-verify the ENTIRE retired backlog in one run
//                  instead of the usual bounded batch (manual catch-up only)
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
  fleetChanged,
} from "@/lib/telemetry/jobs"
import { prisma } from "@/lib/db/prisma"
import { logger } from "@/lib/telemetry/logger"

/**
 * Run one pipeline stage.
 *
 * `fatal: false` (the default) logs and continues — a flaky registry sync
 * shouldn't skip the probe. `fatal: true` rethrows so the process exits non-zero
 * and the Actions run goes red.
 *
 * Note that `fatal` alone is not sufficient to catch a systemic outage:
 * `runProbeCycle` swallows every per-model error so one bad endpoint can't abort
 * the sweep, so a dead database surfaces as "all models failed" rather than a
 * throw. The zero-success guard in `main` is what actually catches that case.
 * Both used to be logged and then reported as success, which is how a restricted
 * database went unnoticed across weeks of green runs.
 */
async function step<T>(
  label: string,
  fn: () => Promise<T>,
  { fatal = false }: { fatal?: boolean } = {},
): Promise<T | undefined> {
  const start = Date.now()
  try {
    const result = await fn()
    logger.info(`${label} done`, { durationMs: Date.now() - start })
    return result
  } catch (err) {
    logger.error(`${label} failed`, { error: (err as Error).message, durationMs: Date.now() - start })
    if (fatal) throw err
    return undefined
  }
}

/**
 * Tell the site that new data has landed.
 *
 * The site's pages and cached queries refresh on demand rather than on a timer
 * (see app/api/internal/revalidate), so this runs after every probe cycle — the
 * one moment the data actually changes. It also keeps the model table and the
 * SLA / latency panels agreeing on fleet size after a sync changes the fleet.
 *
 * Best-effort: without REVALIDATE_URL or INTERNAL_API_TOKEN this is skipped and
 * the site falls back to its 20-minute safety-net TTL. A failure here must never
 * fail the collector — the samples are already written by then.
 */
async function revalidateSiteCaches(): Promise<void> {
  const base = process.env.REVALIDATE_URL
  const token = process.env.INTERNAL_API_TOKEN
  if (!base || !token) {
    logger.info("skipping cache revalidation", {
      reason: !base ? "REVALIDATE_URL not set" : "INTERNAL_API_TOKEN not set",
    })
    return
  }
  const res = await fetch(`${base.replace(/\/$/, "")}/api/internal/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
  // The guard answers 404 (not 401) when the token is wrong, so surface the
  // status rather than assuming the route is missing.
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

async function main(): Promise<void> {
  assertEnv()

  const wantSync = process.argv.includes("--sync")
  const wantMaintenance = process.argv.includes("--maintenance")
  // Catch-up switch: parole every retired-but-still-catalogued endpoint at once
  // rather than PAROLE_BATCH per sync. Drains a large backlog in a single cycle;
  // dead endpoints retire themselves again within RETIRE_STRIKES probes.
  const paroleAll = process.argv.includes("--parole-all")

  // Cold-start guard: if nothing has ever been discovered, sync no matter what
  // so the first scheduled run produces data instead of probing an empty fleet.
  const active = await getActiveModels()
  const mustSync = wantSync || active.length === 0

  logger.info("probe-once starting", { sync: mustSync, maintenance: wantMaintenance, paroleAll, activeModels: active.length })

  const sync = mustSync
    ? await step("registry sync", () => syncModelRegistry({ paroleAll }))
    : undefined

  // Fatal: the probe cycle is the whole point of this job.
  const cycle = await step("probe cycle", () => runProbeCycle(), { fatal: true })

  // `runProbeCycle` catches every per-model error to keep one bad endpoint from
  // aborting the sweep, so a systemic failure (dead database, bad credentials,
  // exhausted quota) surfaces as "every model failed" rather than a throw. A
  // cycle that probed a non-empty fleet and recorded nothing is therefore the
  // only reliable signal that something is broken beneath us — fail on it.
  //
  // A total upstream outage trips this too, which is intended: either way this
  // run collected no data and a green check would be a lie.
  if (cycle && cycle.models > 0 && cycle.succeeded === 0) {
    throw new Error(
      `probe cycle recorded 0 successes across ${cycle.models} models — ` +
        `treating as a systemic failure (database, credentials, or a full upstream outage)`,
    )
  }

  if (wantMaintenance) {
    await step("prune stale samples", () => pruneStaleSamples())
    await step("mark inactive models", () => markInactiveModels())
  }

  // Last, so every write above (samples, prune, a changed fleet) is visible to
  // the regeneration this triggers.
  if (sync && fleetChanged(sync)) logger.info("fleet composition changed", { ...sync })
  await step("revalidate site caches", () => revalidateSiteCaches())

  await prisma.$disconnect()
  logger.info("probe-once complete")
  // pg keeps the event loop alive via its pool; exit explicitly so CI doesn't hang.
  process.exit(0)
}

main().catch(async (err) => {
  logger.error("probe-once crashed", { error: (err as Error).message })
  try { await prisma.$disconnect() } catch { /* already down */ }
  // Every failure path lands here — including `getActiveModels()`, which throws
  // outright if Postgres is unreachable. Exit non-zero so the Actions run goes
  // red; the ERROR log above is the record of what broke.
  process.exit(1)
})
