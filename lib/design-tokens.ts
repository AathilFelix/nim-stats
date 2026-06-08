import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ------------------------------------------------------------------ */
/* Primitives: raw color values                                        */
/* ------------------------------------------------------------------ */

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

export const STATUS_TEXT: Record<StatusKey, string> = {
  healthy: 'text-emerald-400',
  busy: 'text-amber-400',
  jammed: 'text-red-400',
}

export const STATUS_BG: Record<StatusKey, string> = {
  healthy: 'bg-emerald-400',
  busy: 'bg-amber-400',
  jammed: 'bg-red-400',
}

export const STATUS_BG_SUBTLE: Record<StatusKey, string> = {
  healthy: 'bg-emerald-500/10',
  busy: 'bg-amber-500/10',
  jammed: 'bg-red-500/10',
}

export const STATUS_BORDER_SUBTLE: Record<StatusKey, string> = {
  healthy: 'border-emerald-500/20',
  busy: 'border-amber-500/20',
  jammed: 'border-red-500/20',
}

export type Threshold = 'good' | 'warn' | 'bad'

export function thresholdForCongestion(congestion: number): Threshold {
  if (congestion > 80) return 'bad'
  if (congestion > 50) return 'warn'
  return 'good'
}

export function thresholdForReliability(reliability: number): Threshold {
  if (reliability < 85) return 'bad'
  if (reliability < 95) return 'warn'
  return 'good'
}

export function thresholdForUptime(uptime: number): Threshold {
  if (uptime < 99.5) return 'bad'
  if (uptime < 99.9) return 'warn'
  return 'good'
}

export function thresholdColor(threshold: Threshold): string {
  switch (threshold) {
    case 'good': return COLORS.emerald
    case 'warn': return COLORS.amber
    case 'bad': return COLORS.red
  }
}

export function thresholdTextClass(threshold: Threshold): string {
  switch (threshold) {
    case 'good': return STATUS_TEXT.healthy
    case 'warn': return STATUS_TEXT.busy
    case 'bad': return STATUS_TEXT.jammed
  }
}

/* ------------------------------------------------------------------ */
/* Typography scale                                                    */
/* ------------------------------------------------------------------ */

export const TYPE_SCALE = {
  brandMark: {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
  },
  display: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  headline: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  metricValue: {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '-0.01em',
  },
  title: {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '0.7rem',
    fontWeight: 500,
    letterSpacing: '0.1em',
  },
  body: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  mono: {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '0.75rem',
    fontWeight: 400,
    letterSpacing: '-0.01em',
  },
  monoLabel: {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '0.65rem',
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  navItem: {
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: '0.65rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
  },
} as const

/* ------------------------------------------------------------------ */
/* Spacing scale                                                       */
/* ------------------------------------------------------------------ */

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const

/* ------------------------------------------------------------------ */
/* Radius                                                              */
/* ------------------------------------------------------------------ */

export const RADIUS = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.625rem',
  xl: '0.75rem',
} as const

/* ------------------------------------------------------------------ */
/* Surface levels                                                      */
/* ------------------------------------------------------------------ */

export const SURFACE = {
  base: 'bg-surface-base',
  card: 'bg-surface-card',
  elevated: 'bg-surface-elevated',
  recessed: 'bg-surface-recessed',
  borderBase: 'border-border-base',
  borderSubtle: 'border-border-subtle',
} as const

/* ------------------------------------------------------------------ */
/* Layout constants                                                    */
/* ------------------------------------------------------------------ */

export const LAYOUT = {
  sidebarWidth: '272px',
  navHeight: '48px',
  contentMaxWidth: '1440px',
  tableMinWidth: '1280px',
} as const
