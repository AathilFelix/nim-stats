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

/** ISR window for the server-rendered pages. Matches the cache layer beneath it. */
export const PAGE_REVALIDATE = FLEET_TTL

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
