export const env = {
  NIM_API_URL: process.env.NIM_API_URL ?? "https://integrate.api.nvidia.com",
  DATABASE_URL: process.env.DATABASE_URL!,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  // Shared secret that locks down internal API routes (anomalies, quota,
  // overview, models, providers). Unset = open (local dev); set in prod.
  INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN,
  PROBE_INTERVAL_MS: Number.parseInt(process.env.PROBE_INTERVAL_MS ?? "30000", 10),
  SYNC_INTERVAL_MS: Number.parseInt(process.env.SYNC_INTERVAL_MS ?? "21600000", 10),
  MODEL_REGISTRY_SYNC_CRON: process.env.MODEL_REGISTRY_SYNC_CRON ?? "0 */6 * * *",
  PROBE_WORKER_CRON: process.env.PROBE_WORKER_CRON ?? "* * * * *",
  MAINTENANCE_CRON: process.env.MAINTENANCE_CRON ?? "0 3 * * *",
  PROBE_CONCURRENCY: Number.parseInt(process.env.PROBE_CONCURRENCY ?? "6", 10),
  // Outbound probe rate cap. NVIDIA NIM free tier allows 40 req/min; keep a safety
  // margin so a probe burst (and the occasional registry sync) never trips the limit.
  PROBE_MAX_RPM: Number.parseInt(process.env.PROBE_MAX_RPM ?? "30", 10),
  RETENTION_DAYS: Number.parseInt(process.env.RETENTION_DAYS ?? "30", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
}

export function assertEnv() {
  const missing: string[] = []
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL")
  if (!process.env.NIM_API_KEY) missing.push("NIM_API_KEY")
  if (missing.length)
    throw new Error(`Missing required env vars: ${missing.join(", ")}`)
}
