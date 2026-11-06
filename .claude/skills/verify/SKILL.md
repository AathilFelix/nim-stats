---
name: verify
description: How to run the NIM Stats collector and site locally to verify telemetry/state/dashboard changes at runtime.
---

# Verifying NIM Stats changes

Surface: the **collector** (`scripts/probe-once.ts`, writes samples/state/incidents to Postgres) and the **site** (`npm run dev`, reads that data).

## Setup
- Postgres is **Postgres.app 16** (`/Applications/Postgres.app/Contents/Versions/16/bin`), not Docker. It may not be running: `pg_isready`, else open Postgres.app (`pg_ctl` against `~/Library/Application Support/Postgres/var-16`).
- The user's dev DB `nimstats` holds real dev data. **Don't write to it**: `createdb -h localhost nimstats_verify`, point `DATABASE_URL` at it (take the credentials from `/Users/aathilfelix/dev/nim_stats/.env`, swap `/nimstats?` for `/nimstats_verify?`), then `npx prisma migrate deploy`. `dropdb` when done.
- `NIM_API_KEY` is in the same `.env`. **Unset `REVALIDATE_URL` and `INTERNAL_API_TOKEN`** so the collector never pokes production.
- node `pg` against localhost must NOT use `ssl` (a forced-SSL client fails with an empty error).

## Drive it
1. Collector: first run `npx tsx scripts/probe-once.ts --sync` (probes the whole ~65 model catalog, ~2 min at 30 rpm), then 2 more runs without `--sync`. Retirement needs 3 consecutive not-callable (404/410) strikes, so 3 cycles are the minimum to see the active set settle (~22 callable of ~65 listed).
2. Inspect: group `ModelSampleLatest.state`, `Incident` by severity/type, and failed `ModelSample` rows by `errorCode`/`errorMessage`/`timeout`.
3. Site: `npm run dev` (port 3000), then check `/` and `/status` (the listed -> callable -> healthy funnel, state counts, incident text) at desktop and 375px.
4. Stop the dev server and drop the verify DB.

## Gotchas
- Not every model answers: ~43 of ~65 return 404 ("Function ... not found for account") and ~8 of the callable ones hang past 15s. That is the real NVIDIA state, not a bug.
- With a non-UTC Postgres server timezone, "x ago" labels show negative values (timestamps read ~5.5h in the future in IST). Local artifact, not seen in prod.
- Don't run `npm test`/`tsc` as verification; they are CI's job.
