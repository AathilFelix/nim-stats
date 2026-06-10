type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
 ts: string
 level: string
 scope: string
 message: string
 meta?: Record<string, unknown>
}

function stamp(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
 const entry: LogEntry = { ts: new Date().toISOString(), level: level.toUpperCase(), scope, message, ...(meta ? { meta } : {}) }
 console.log(JSON.stringify(entry))
}

function makeScoped(scope: string) {
 return {
  debug: (s: string, m?: Record<string, unknown>) => stamp("debug", scope, s, m),
  info: (s: string, m?: Record<string, unknown>) => stamp("info", scope, s, m),
  warn: (s: string, m?: Record<string, unknown>) => stamp("warn", scope, s, m),
  error: (s: string, m?: Record<string, unknown>) => stamp("error", scope, s, m),
 }
}

export const logger = makeScoped("telemetry")
export const api = makeScoped("api")
export const probe = makeScoped("probe")
