# Production (free tier)

How this runs in production for **$0/month**, and the optimizations that make it fit.

## Stack

| Layer | Service | Free-tier limit | What we use |
|---|---|---|---|
| Frontend + SSR + API routes | **Vercel Hobby** | 100 GB bandwidth, serverless functions | the Next.js app |
| Database | **Neon Postgres** | 0.5 GB storage, ~191 compute-hrs/mo, autosuspend | `ModelSample`, `NIModel`, `Incident` |
| Worker / probing | **GitHub Actions** (public repo) | **unlimited** Linux minutes | `scripts/probe-once.ts` on a schedule |
| Redis | — | — | **not used** (rate limiter is in-process) |

### Why GitHub Actions and not Vercel for the worker

The collector must run on a schedule, forever. Vercel Hobby has **no always-on process**, and its Cron runs **at most once per day** — it cannot probe every 5 minutes. GitHub Actions on a **public** repo gives unlimited minutes and a 5-minute-minimum scheduler, so the probe cycle lives there as a one-shot job (`probe-once.ts`), while the long-running `worker.ts` stays for local dev only.

## The numbers

**Database growth** (the binding constraint — Neon free = 0.5 GB). The live fleet is **~50 models**; a `ModelSample` row ≈ ~200 B incl. indexes.

| Probe interval | Rows/day (50 models) | Rows at 30-day retention | On-disk |
|---|---|---|---|
| 1 min (old) | ~72,000 | ~2.2 M | ~430 MB — **overflows** once index bloat is counted |
| **5 min (prod)** | ~14,400 | ~430 K | **~86 MB** ✅ |

So at the real fleet size, 1-minute probing would essentially fill the free tier — 5-minute probing leaves **~6× headroom** under the 0.5 GB cap while still capturing 288 samples/day/model (plenty for sparklines, SLA windows, and anomaly baselines). The daily `--maintenance` run prunes anything past `RETENTION_DAYS`, so the table is bounded, not ever-growing.

**Probe rate** stays under NVIDIA NIM's free 40 req/min via `PROBE_MAX_RPM=30`; a full 50-model cycle finishes in ~110 s (measured), well inside the 5-min window and the workflow's `timeout-minutes: 5`.

**Neon compute** — the dashboard/status/API read paths are wrapped in the Next Data Cache (`unstable_cache`, 30–120 s TTL), so concurrent traffic collapses to ~1 DB query per window instead of one-per-request. Combined with Neon's autosuspend, idle compute stays near zero.

## Optimizations applied

1. **One-shot collector** — `scripts/probe-once.ts`: runs one sync(if needed)/probe/maintenance cycle and exits. This is what makes a serverless host viable.
2. **Two scheduled workflows** — `.github/workflows/probe.yml` (every 5 min) and `maintenance.yml` (daily sync + prune).
3. **5-minute interval** — matches GitHub's scheduler floor and keeps storage at ~60 MB.
4. **Server-side data caching** — five read functions in `lib/dashboard-data.ts` cached with time-based revalidation tuned to each surface's refresh cadence.
5. **Pooled DB connection** — production `DATABASE_URL` uses Neon's `-pooler` endpoint so Vercel functions don't exhaust connections.
6. **Dropped Upstash** — it was referenced in env but never imported; removing it is one less service to provision.

## Deploy steps

1. **Neon**: create a project + database `nimstats`, run the Prisma migrations (`npx prisma migrate deploy`). Copy the **pooled** connection string.
2. **Vercel**: import the repo, set env `DATABASE_URL` (pooled), `NIM_API_KEY`, `NIM_API_URL`. Deploy.
3. **GitHub** (public repo): add repo **secrets** `DATABASE_URL` (pooled), `NIM_API_KEY`, `NIM_API_URL`. The `probe` and `maintenance` workflows then run automatically; trigger `probe` once manually from the Actions tab to seed data.

> Scheduled Actions only run on the **default branch** and can be delayed/dropped under GitHub load — treat "every 5 min" as best-effort. The UI degrades to slightly-older data, never breaks.
