export const COLORS = {
  black: '#000000',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  zinc: {
    950: '#09090b',
    900: '#18181b',
    800: '#27272a',
    700: '#3f3f46',
    600: '#52525b',
    500: '#71717a',
    400: '#a1a1aa',
    300: '#d4d4d8',
  },
} as const

export type StatusKey = 'healthy' | 'busy' | 'jammed'

export const STATUS_HEX: Record<StatusKey, string> = {
  healthy: COLORS.emerald,
  busy: COLORS.amber,
  jammed: COLORS.red,
}

export const STATUS_GLOW_BASE = '0 0 8px'

export function statusGlow(status: StatusKey): string {
  return `${STATUS_GLOW_BASE} ${STATUS_HEX[status]}`
}

export function statusColor(status: StatusKey): string {
  return STATUS_HEX[status]
}
