import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * One SVG coordinate pair at 0.1px precision. Sparklines are tens of pixels
 * wide, so further digits are invisible — but they are random, which makes
 * them incompressible. At full float precision (`15.429046563192905`) they were
 * the largest part of /discover's HTML, and every ISR regeneration pays for
 * those bytes (billed per 8 KB, compressed) in each page entry.
 */
export function svgPoint(x: number, y: number): string {
  return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`
}
