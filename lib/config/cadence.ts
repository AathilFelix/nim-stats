// Refresh cadence — shared by the server cache layer, ISR, and the client
// pollers. Kept in its own module (no Prisma import) so client components can
// read it without dragging the database layer into the browser bundle.
//
// Everything here is anchored to how often the collector actually writes.
// `cloudflare/cron-worker` dispatches probe.yml every 10 minutes, so new rows
// appear at most once per 600s. Any refresh faster than that re-runs the same
// query against the same rows: it costs a full result set in egress and returns
// data the user already has.

// Probe interval — must match the every-10-minutes cron trigger in
// cloudflare/cron-worker/wrangler.jsonc.
export const PROBE_INTERVAL_S = 600

/**
 * Server-cache TTL for fleet reads. Half the probe interval, so fresh samples
 * surface within ~5 min of landing while capping database hits at ~288/day per
 * cached function instead of the ~2,880/day the previous 30s TTL allowed.
 */
export const FLEET_TTL = PROBE_INTERVAL_S / 2

/**
 * How many probe cycles pass between site refreshes.
 *
 * The collector probes every cycle, but only asks the site to refresh (POST
 * /api/internal/revalidate) on every Nth one — or immediately when the fleet's
 * composition changed, so the model table never lists a model that is gone.
 * Each refresh regenerates /, /discover and /status: a few hundred KB of HTML,
 * RSC and per-segment prefetch entries, all billed as ISR writes, plus an ISR
 * read per region as the CDN refills. At 1 that ran 144×/day and was most of
 * the project's ISR usage; 2 halves it, at the cost of figures up to ~20 min old.
 */
export const SITE_REFRESH_CYCLES = 2

/** Seconds between site refreshes in normal operation. */
export const SITE_REFRESH_S = PROBE_INTERVAL_S * SITE_REFRESH_CYCLES

/**
 * Safety-net TTL for the ISR pages and the server data cache.
 *
 * Those layers are refreshed ON DEMAND (see SITE_REFRESH_CYCLES), and only when
 * someone visits. This timer only matters if that hook stops arriving, so it
 * sits one probe interval past the on-demand cadence: long enough never to fire
 * in normal operation (every regeneration restarts the clock), short enough to
 * bound staleness if the collector stops calling.
 *
 * The page files repeat this as a literal `revalidate = 1800` — keep in sync.
 */
export const PAGE_FALLBACK_REVALIDATE = SITE_REFRESH_S + PROBE_INTERVAL_S

/**
 * Server-cache TTL for the reliability rollup (/api/fleet/reliability).
 *
 * Its buckets are days and hours over 1–90 days, so one probe cycle barely moves
 * them, yet at ~90 KB it was the largest durable-cache entry and was rewritten
 * every cycle. It follows the "fleet-composition" tag instead of "fleet": the
 * collector invalidates it when models join or leave, and this TTL covers the
 * slow drift of the numbers in between.
 */
export const RELIABILITY_REVALIDATE = 3600

/** Client poll/auto-refresh interval, in ms. Same cadence, expressed for setInterval. */
export const CLIENT_REFRESH_MS = FLEET_TTL * 1000

/**
 * `Cache-Control` for the public fleet JSON routes.
 *
 * These are hand-set CDN headers, NOT the Next.js route cache — `revalidateTag`
 * cannot purge them, so whatever sits here is a hard floor on how stale a panel
 * can be. Anchor it to FLEET_TTL (and the page ISR window) so a client polling
 * at CLIENT_REFRESH_MS is never held behind a longer edge entry: reliability
 * used to run s-maxage=600 on top of a 600s server cache, stacking into ~20
 * minutes of lag on a fleet that had already changed.
 *
 * `stale-while-revalidate` is 2x so a miss is served instantly from the edge
 * while the origin recomputes in the background.
 */
export const FLEET_CACHE_CONTROL =
  `public, max-age=0, s-maxage=${FLEET_TTL}, stale-while-revalidate=${FLEET_TTL * 2}`

/**
 * `Cache-Control` for /api/fleet/reliability.
 *
 * Its server cache only turns over hourly (RELIABILITY_REVALIDATE), so a 5-min
 * edge window just meant twelve regional misses an hour, each reading the
 * ~90 KB entry back out of billed durable storage for an unchanged answer. One
 * site-refresh interval instead: the panels can trail a composition change by
 * at most that long, the same staleness the pages around them accept.
 */
export const RELIABILITY_CACHE_CONTROL =
  `public, max-age=0, s-maxage=${SITE_REFRESH_S}, stale-while-revalidate=${SITE_REFRESH_S}`
