// Accepted values for the public API's query parameters.
//
// Shared by the route handlers that validate them and by the OpenAPI document
// that advertises them, so the spec cannot drift from what the server enforces.
// A test pins the two together.

/** `range` on GET /api/fleet/trend — window and bucket width per token. */
export const TREND_RANGES = {
  "12h": { hours: 12, bucketMinutes: 10 },
  "24h": { hours: 24, bucketMinutes: 20 },
  "7d": { hours: 168, bucketMinutes: 120 },
} as const

export type TrendRange = keyof typeof TREND_RANGES

export const TREND_RANGE_VALUES = Object.keys(TREND_RANGES) as TrendRange[]

export const DEFAULT_TREND_RANGE: TrendRange = "12h"

/**
 * `days` on GET /api/fleet/reliability. A small allowlist rather than a free
 * integer so callers can't cache-bust with 365 distinct heavy queries.
 */
export const RELIABILITY_DAY_VALUES = [7, 30, 90, 365] as const

export const DEFAULT_RELIABILITY_DAYS = 90
