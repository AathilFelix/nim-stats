# Production (free tier)

How this runs in production for **$0/month**, and the optimizations that make it fit.

## Stack

| Layer | Service | Free-tier limit | What we use |
|---|---|---|---|
| Frontend + SSR + API routes | **Vercel Hobby** | 100 GB bandwidth, serverless functions | the Next.js app |
| Database | **Supabase Postgres** | 500 MB storage; pauses after 7 days idle | `ModelSample`, `NIModel`, `Incident` |
| Worker / probing | **GitHub Actions** (public repo) | **unlimited** Linux minutes | `scripts/probe-once.ts` on a schedule |
| Redis | — | — | **not used** (rate limiter is in-process) |

### Why GitHub Actions and not Vercel for the worker

The collector must run on a schedule, forever. Vercel Hobby has **no always-on process**, and its Cron runs **at most once per day** — it cannot probe on a tight interval. GitHub Actions on a **public** repo gives unlimited minutes, so the probe cycle lives there as a one-shot job (`probe-once.ts`), while the long-running `worker.ts` stays for local dev only.

The cadence is **driven by the Cloudflare cron Worker** (`cloudflare/cron-worker`), which dispatches `probe.yml` every **10 minutes** — GitHub's own `schedule:` proved too unreliable to depend on and is kept only as an hourly fallback.

## The numbers

**Database growth.** The live fleet is **~34 active models**; a `ModelSample` row ≈ ~200 B incl. indexes.

| Probe interval | Rows/day | Rows at 30-day retention | On-disk |
|---|---|---|---|
| 1 min (old) | ~49,000 | ~1.5 M | ~290 MB — most of the free tier |
| **10 min (prod)** | ~4,900 | ~150 K | **~30 MB** ✅ |

The daily `--maintenance` run prunes anything past `RETENTION_DAYS`, so the table is bounded, not ever-growing. Storage has never been the binding constraint — **egress is**.

**Egress is the real limit.** Supabase free allows 5 GB/month and returns 402 across *every* service once you cross it. Writes are negligible (~1 MB/day); reads are what matter, and they are governed entirely by refresh cadence. Every cache miss on the dashboard pulls ~2k sample rows. At the original 30 s TTL a single tab left open drove ~2,880 misses/day ≈ **575 MB/day**, which overran the 5 GB cap roughly threefold in a month.

All TTLs are therefore anchored to the probe interval in `lib/config/cadence.ts` (`FLEET_TTL` = 300 s, half the 10-min probe). Refreshing faster than the collector writes cannot surface new data — it only re-runs the same query against the same rows. **If you change the probe cron, change `PROBE_INTERVAL_S` with it**, and keep the literal `revalidate` in the three page files in sync (Next only statically analyses route segment config, so it can't import the constant).

**Probe rate** stays under NVIDIA NIM's free 40 req/min via `PROBE_MAX_RPM=30`; a full cycle finishes in ~80 s (measured), well inside the 10-min window and the workflow's `timeout-minutes: 5`.

**Keeping Supabase awake** — the free tier pauses a project after **7 days with no activity**. The probe runs every 10 minutes, so the DB is never idle and never pauses. (If you ever stop the worker for a week, re-open the Supabase dashboard to wake it.)

## Optimizations applied

1. **One-shot collector** — `scripts/probe-once.ts`: runs one sync(if needed)/probe/maintenance cycle and exits. This is what makes a serverless host viable.
2. **Two workflows, Cloudflare-driven** — `probe.yml` (dispatched every 10 min by the cron Worker) and `maintenance.yml` (daily sync + prune).
3. **10-minute interval** — keeps storage around ~30 MB and the probe well under NIM's rate cap.
4. **Cadence anchored to the collector** — one source of truth in `lib/config/cadence.ts` drives the server cache TTLs, ISR windows, CDN `s-maxage`, and the client pollers. This is the single biggest lever on egress; see *The numbers* above.
5. **Loud failures** — `probe-once.ts` exits non-zero if the probe cycle throws *or* records zero successes across a non-empty fleet, so a systemic outage turns the Actions run red instead of reporting success.
6. **Right DB connection per consumer** — the Vercel app uses the Supabase **pooled** endpoint (port 6543) so serverless functions don't exhaust connections; the worker + migrations use the **direct** endpoint (port 5432), which the transaction pooler can't serve.
7. **Locked-down internal APIs** — non-browser routes (`anomalies`, `quota`, `overview`, `models`, `providers`) require `INTERNAL_API_TOKEN`; only `trend`, `reliability`, and a minimal `health` are public.
8. **Dropped Upstash** — it was referenced in env but never imported; one less service to provision.

## Deploy steps

1. **Supabase**: create a project. From *Project Settings → Database*, copy **both** connection strings — the **pooled** (Transaction, port 6543) and the **direct** (port 5432). Run migrations against the **direct** URL:
   `DATABASE_URL="<direct>" npx prisma migrate deploy`.
2. **Vercel**: import the repo. Env: `DATABASE_URL` = **pooled**, `NIM_API_KEY`, `NIM_API_URL`, `INTERNAL_API_TOKEN` (`openssl rand -hex 32`). Deploy.
3. **GitHub** (public repo): add repo **secrets** `DATABASE_URL` = **direct** (the worker runs transactions), `NIM_API_KEY`, `NIM_API_URL`. Trigger `probe` once from the Actions tab to seed data.
   **Cloudflare cron Worker**: `cd cloudflare/cron-worker && wrangler deploy`, then `wrangler secret put GH_DISPATCH_TOKEN` with a PAT that can dispatch workflows. This is what actually drives the 10-min cadence.
4. **(Optional) Cloudflare** in front of Vercel: add WAF/rate-limit rules on `/api/*`. Note this only protects the proxied domain — the raw `*.vercel.app` origin stays reachable, which is exactly why the internal routes also enforce `INTERNAL_API_TOKEN` in code.

> Scheduled Actions only run on the **default branch** and can be delayed/dropped under GitHub load — which is why the Cloudflare Worker drives the real cadence and GitHub's `schedule:` is only an hourly fallback. Treat "every 10 min" as best-effort either way; the UI degrades to slightly-older data, never breaks.
