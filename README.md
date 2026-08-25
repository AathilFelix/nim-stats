<div align="center">

# NIM Stats

**Live reliability dashboard for free NVIDIA NIM API endpoints.**

Probes every available endpoint continuously and surfaces throughput, latency, uptime, and congestion — so you can pick a model that actually works right now, without trial and error.

[**Live → nimstats.aathil.com**](https://nimstats.aathil.com)

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-Prisma_7-4169E1?logo=postgresql&logoColor=white)
![Cost](https://img.shields.io/badge/runs_on-%240%2Fmonth-2ea44f)

</div>

---

NIM Stats is a public operational dashboard for the free [NVIDIA NIM](https://build.nvidia.com) chat-completion endpoints (Llama, Mistral, Gemma, Phi, Qwen, DeepSeek, and more). A background worker streams a small probe against each endpoint on a schedule, measures real time-to-first-token and decode throughput, classifies the result, and persists it. The dashboard reads that telemetry and renders fleet health that's scannable in about five seconds — no login, no setup.

## Features

- **Real-time fleet status** — every endpoint classified `healthy` / `busy` / `jammed` from live probes, with color + shape + text (color-blind safe).
- **Deep reliability metrics** — TTFT, throughput, uptime, congestion, p95/p99 latency, timeout rate, session reliability, volatility, routing confidence, and queue pressure.
- **Trends & history** — fleet performance chart (12h / 24h / 7d), per-model uptime calendar, time-of-day latency heatmap, and SLA windows (1d / 7d / 30d).
- **Incident feed** — state transitions (degradation, congestion, recovery) recorded as the worker observes them.
- **Explore the fleet** — search, provider/status filters, favorites/watchlist, saved filter presets, shareable URL state, and CSV export.
- **Public status page** at [`/status`](https://nimstats.aathil.com/status) — a read-only, at-a-glance health summary.
- **Anomaly & quota detection** — TTFT spikes and reliability drops vs. a 7-day baseline, plus rate-limit proximity, exposed via internal APIs.

## How it works

The collector is decoupled from the web app: it writes telemetry to Postgres, and the dashboard server-renders straight from the database.

```mermaid
flowchart LR
    A["Worker<br/>(GitHub Actions, every 5 min)"] -->|streamed probe| B["NVIDIA NIM API"]
    A -->|write samples + incidents| C[("Postgres<br/>(Supabase)")]
    D["Next.js app<br/>(Vercel)"] -->|read + cache| C
    E["Browser"] -->|SSR dashboard| D
```

- **Worker** (`scripts/probe-once.ts`) discovers active endpoints, probes each one (rate-capped under NIM's 40 req/min limit), classifies the operational state, and stores a `ModelSample`. A daily pass prunes old samples and retires dead endpoints.
- **Database** holds raw samples, the latest snapshot per model, and incidents. Derived analytics are computed at read time.
- **Web app** renders Server Components directly from the database, wrapped in a short-lived data cache so concurrent traffic collapses to roughly one query per window.

> [!NOTE]
> The dashboard only shows data once the worker has run at least once. Locally that means running `npm run worker`; in production, GitHub Actions handles it on a schedule.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Styling | Tailwind CSS v4, shadcn/ui + Radix |
| Charts | Recharts |
| Data | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) |
| Collector | Node + `node-cron` (local) / a one-shot script (CI) |

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local or hosted)
- A free NVIDIA NIM API key from [build.nvidia.com](https://build.nvidia.com) (`nvapi-…`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then set NIM_API_KEY and DATABASE_URL in .env

# 3. Create the schema
npx prisma migrate deploy

# 4. Start the collector (terminal 1) — required for data
npm run worker

# 5. Start the dashboard (terminal 2)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data appears within a minute of the worker's first cycle.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on `localhost:3000` |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run worker` | Run the always-on collector (local dev) |
| `npm run probe:once` | Run a single probe cycle and exit (used by CI) |
| `npm run lint` | Lint with `eslint-config-next` |
| `npm test` | Run the unit tests (Vitest) |

## Configuration

Set in `.env` (see [`.env.example`](.env.example) for the full list):

| Variable | Required | Description |
|---|---|---|
| `NIM_API_KEY` | yes | NVIDIA NIM API key (`nvapi-…`) |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NIM_API_URL` | no | Defaults to `https://integrate.api.nvidia.com` |
| `INTERNAL_API_TOKEN` | prod | Locks down non-browser API routes; sent as `Authorization: Bearer <token>` |
| `PROBE_MAX_RPM` | no | Outbound probe rate cap (default `30`; NIM allows 40) |
| `RETENTION_DAYS` | no | Prune samples older than this (default `30`) |

## API

Public, read-only, no auth. Full reference at [`/api`](https://nimstats.aathil.com/api); OpenAPI 3.1 spec at [`/openapi.json`](https://nimstats.aathil.com/openapi.json).

| Operation | Route | Description |
|---|---|---|
| `getFleetTrend` | `GET /api/fleet/trend?range=12h\|24h\|7d` | Fleet-wide time series |
| `getFleetReliability` | `GET /api/fleet/reliability?days=7\|30\|90\|365` | Per-model uptime / heatmap / SLA breakdown |
| `getHealth` | `GET /api/health` | Liveness + last probe time |

Every non-2xx response has the same JSON shape, so branch on `error.code` rather than parsing prose:

```json
{ "error": { "code": "invalid_parameter", "message": "…", "hint": "…", "docs": "https://nimstats.aathil.com/api" } }
```

Codes: `not_found`, `method_not_allowed`, `invalid_parameter`, `service_unavailable`, `server_error`.

Internal (require `INTERNAL_API_TOKEN` in production): `/api/fleet/anomalies`, `/api/fleet/quota`, `/api/fleet/overview`, `/api/models`, `/api/models/[id]`, `/api/providers`. These are deliberately absent from the OpenAPI document — they answer 404 without a token.

## For AI agents

Every public page has two representations at the same URL. Browsers get HTML; a
client that sends `Accept: text/markdown` gets clean Markdown of the same
content, and responses carry `Vary: Accept` so caches keep the two apart.
Appending `.md` to a path (`/discover.md`) forces Markdown without a header, and
a request that accepts neither representation gets a `406`. Negotiation lives in
[`proxy.ts`](proxy.ts); the Markdown is rendered by
[`app/api/markdown`](app/api/markdown) from the same data the dashboard uses, so
the two can never disagree.

| File | Purpose |
|---|---|
| [`/llms.txt`](https://nimstats.aathil.com/llms.txt) | What the site covers and when an agent should reach for it |
| [`/openapi.json`](https://nimstats.aathil.com/openapi.json) | OpenAPI 3.1 spec for the public API — load it as a function-calling manifest |
| [`/api`](https://nimstats.aathil.com/api) | Human-readable API reference, rendered from that spec |
| [`/agent-instructions.md`](https://nimstats.aathil.com/agent-instructions.md) | Task-by-task guidance, request examples, and how to cite |
| [`/sitemap.xml`](https://nimstats.aathil.com/sitemap.xml) | Every indexable URL with `lastmod` |
| [`/robots.txt`](https://nimstats.aathil.com/robots.txt) | Crawl policy plus Content Signals — search and live AI grounding yes, model training no |
| [`/.well-known/api-catalog`](https://nimstats.aathil.com/.well-known/api-catalog) | RFC 9727 linkset: the spec, the docs, and the health endpoint, from one registered entry point |
| [`/.well-known/ai-catalog.json`](https://nimstats.aathil.com/.well-known/ai-catalog.json) | ARD capability manifest — one entry per surface, with the questions it answers |

Every response also carries an [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288)
`Link` header pointing at the same set, so an agent finds them without probing
paths (`rel="api-catalog"`, `service-desc`, `service-doc`, `status`,
`describedby`, `help`), plus `rel="alternate"` for the page's own Markdown twin.
In a browser that supports [WebMCP](https://webmachinelearning.github.io/webmcp/),
the page registers read-only tools over those same surfaces
([`components/agent/webmcp.tsx`](components/agent/webmcp.tsx)).

```bash
curl -s -H "Accept: text/markdown" https://nimstats.aathil.com/
```

Verify negotiation after a deploy:

```bash
curl -sI -H "Accept: text/markdown" https://nimstats.aathil.com/ | grep -iE "content-type|vary"
```

Verify agent discovery after a deploy:

```bash
curl -sI https://nimstats.aathil.com/ | grep -i "^link"
```

## Deployment

NIM Stats is designed to run on entirely free tiers — **Vercel** (web), **Supabase** (Postgres), and **GitHub Actions** (the worker, on a public repo). See [`PRODUCTION.md`](PRODUCTION.md) for the architecture, the data-volume math, and step-by-step deploy instructions.

> [!IMPORTANT]
> The worker runs as a scheduled GitHub Actions job (Vercel has no always-on process). Use Supabase's **pooled** connection for the app and the **direct/session** connection for the worker and migrations.

---

<div align="center">
<sub>Not affiliated with NVIDIA. Status reflects independent probing of public endpoints.</sub>
</div>
