# Production (free tier)

How this runs in production for **$0/month**, and the optimizations that make it fit.

## Stack

| Layer | Service | Free-tier limit | What we use |
|---|---|---|---|
| Frontend + SSR + API routes | **Cloudflare Workers Free** (via [vinext](https://github.com/cloudflare/vinext)) | 100k requests/day, 10 ms CPU/request, 3 MB bundle | the Next.js app, route `nimstats.aathil.com/*` |
| Edge data + page cache | **Workers KV** + Workers Cache | 1,000 KV writes/day | `unstable_cache` entries (KV), rendered pages (Cache API) |
| DB connection pooling | **Hyperdrive** | included on Free | pools the Worker's connections to Supabase |
| Database | **Supabase Postgres** | 500 MB storage; pauses after 7 days idle | `ModelSample`, `NIModel`, `Incident` |
| Worker / probing | **GitHub Actions** (public repo) | **unlimited** Linux minutes | `scripts/probe-once.ts` on a schedule |
| Redis | — | — | **not used** (rate limiter is in-process) |

### Why GitHub Actions for the worker

The collector must run on a schedule, forever, and a full cycle takes ~80 s of mostly waiting on NIM. The web host is request-bound (Cloudflare Workers today, Vercel Hobby before it, whose Cron ran **at most once per day**), so it cannot probe on a tight interval. GitHub Actions on a **public** repo gives unlimited minutes, so the probe cycle lives there as a one-shot job (`probe-once.ts`), while the long-running `worker.ts` stays for local dev only.

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
6. **Right DB connection per consumer** — the web Worker reaches Supabase through **Hyperdrive**, pointed at the **session** pooler (port 5432) with an origin limit of **5**. Hyperdrive does its own pooling, the transaction pooler (6543) behind it timed out under load, and a higher limit starves Supabase's session slots. Each request opens its own short-lived client (`lib/db/prisma.workers.ts`), since a Worker can't reuse another request's socket. The collector + migrations use the **direct/session** endpoint (port 5432).
7. **Locked-down internal APIs** — non-browser routes (`anomalies`, `quota`, `overview`, `models`, `providers`) require `INTERNAL_API_TOKEN`; only `trend`, `reliability`, and a minimal `health` are public.
8. **Dropped Upstash** — it was referenced in env but never imported; one less service to provision.

## Deploy steps

1. **Supabase**: create a project. From *Project Settings → Database*, copy **both** connection strings — the **pooled** (Transaction, port 6543) and the **direct** (port 5432). Run migrations against the **direct** URL:
   `DATABASE_URL="<direct>" npx prisma migrate deploy`.
2. **Cloudflare Worker (web)**: everything lives in `cloudflare.config.ts` (bindings, the production route) and builds with `vite build`; `next build` still works but is no longer deployed.
   - Create the Hyperdrive config against the Supabase **session** pooler (5432), origin connection limit 5, and put its id in `HYPERDRIVE_ID`. Create the KV namespace bound as `VINEXT_KV_CACHE`.
   - `wrangler secret put INTERNAL_API_TOKEN --name nim-stats` (`openssl rand -hex 32`); it must equal the GitHub secret of the same name.
   - Deploys run on **Workers Builds** for every push to `main` (build `npm test`, deploy `npm run deploy:vinext`). By hand: `CLOUDFLARE_ACCOUNT_ID=<id> npm run deploy:vinext`.
   - `cf deploy` replaces the Worker's routes with the ones declared in `cloudflare.config.ts`, so add or change routes there, never only in the dashboard.
3. **GitHub** (public repo): add repo **secrets** `DATABASE_URL` = **direct** (the worker runs transactions), `NIM_API_KEY`, `NIM_API_URL`. Trigger `probe` once from the Actions tab to seed data.
   **Cloudflare cron Worker**: `cd cloudflare/cron-worker && wrangler deploy`, then `wrangler secret put GH_DISPATCH_TOKEN` with a PAT that can dispatch workflows. This is what actually drives the 10-min cadence.
4. **(Optional)** WAF/rate-limit rules on `/api/*` in the `aathil.com` zone. The internal routes enforce `INTERNAL_API_TOKEN` in code regardless.

**Rollback to Vercel** (while the Vercel project still exists): delete the `nimstats.aathil.com/*` route under *Workers & Pages → nim-stats → Domains & Routes*. The proxied `nimstats` CNAME to Vercel sits underneath, so traffic moves back within seconds.

> Scheduled Actions only run on the **default branch** and can be delayed/dropped under GitHub load — which is why the Cloudflare Worker drives the real cadence and GitHub's `schedule:` is only an hourly fallback. Treat "every 10 min" as best-effort either way; the UI degrades to slightly-older data, never breaks.
