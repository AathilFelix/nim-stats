---
name: nim-stats
description: Real-time operational intelligence dashboard for NVIDIA NIM AI model analytics, serving developers and AI engineers with infrastructure-grade UX
colors:
  emerald: "#10b981"
  amber: "#f59e0b"
  red: "#ef4444"
  zinc-950: "#09090b"
  zinc-900: "#18181b"
  zinc-800: "#27272a"
  zinc-700: "#3f3f46"
  zinc-600: "#52525b"
  zinc-500: "#71717a"
  zinc-400: "#a1a1aa"
  zinc-300: "#d4d4d8"
  zinc-200: "#e4e4e7"
  white: "#ffffff"
typography:
  brand-mark:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 500
    letterSpacing: "0.08em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "normal"
  metric-value:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xs: "4px"
components:
  status-pill:
    rounded: "{rounded.full}"
    textColor: "{colors.zinc-300}"
  metric-card:
    backgroundColor: "{colors.zinc-900}"
    textColor: "{colors.zinc-300}"
    rounded: "{rounded.md}"
  insight-card:
    backgroundColor: "{colors.zinc-900}"
    textColor: "{colors.zinc-300}"
    rounded: "{rounded.md}"
  data-table:
    backgroundColor: "{colors.zinc-900}"
    textColor: "{colors.zinc-300}"
    rounded: "{rounded.md}"
---

# Design System: NIM Stats

## 1. Overview

**Creative North Star: "The Operations Console"**

A calm, premium command center for AI infrastructure monitoring. The interface is dense with operational signal but airy in its spacing. Every element exists to help a developer scan, decide, and act in under five seconds.

Darkness is functional, not mood. Black backgrounds eliminate visual noise so emerald state indicators, amber warnings, and red alerts carry maximum signal at minimum cognitive cost. Typography is clinical and precise: Geist Sans for hierarchy, Geist Mono for data.

**Key Characteristics:**
- Signal-dense but visually calm
- Every pixel earns its place; no filler, no decoration
- State color vocabulary is the only color language: emerald, amber, red on near-black
- Translucent zinc surfaces create depth without shadows
- Monospace numerals for all metrics; spacing characters never collapse
- Motion is functional: transitions and pulsing status, never spectacle

## 2. Colors

A restrained two-tone system: near-black surfaces with a zinc mid-tone ramp, plus three semantic state colors. No decorative color exists.

### Primary (State Signal)

- **Emerald** (#10b981 / oklch(0.72 0.19 154.6)) — Healthy state, primary success indicator, active throughput, recommended pick accent
- **Amber** (#f59e0b / oklch(0.84 0.16 84.6)) — Busy state, degraded performance, elevated latency
- **Red** (#ef4444 / oklch(0.637 0.237 25.3)) — Jammed or failed state, critical congestion, timeouts

### Neutral

- **Black** (#000000) — Body background. Not a design choice — the page is a monitor, and monitors are black.
- **Zinc 950** (#09090b) — Elevated surface behind translucent cards. Subtly lighter than body to create the first layer of depth.
- **Zinc 900** (#18181b) — Primary card and container surface. The default raised background.
- **Zinc 800** (#27272a) — Secondary surface, dividers, bar chart fills, progress tracks.
- **Zinc 700** (#3f3f46) — Borders and low-contrast dividers.
- **Zinc 600** (#52525b) — Muted secondary text, provider labels, metadata.
- **Zinc 500** (#71717a) — Tertiary text, placeholder labels, axis text.
- **Zinc 400** (#a1a1aa) — Body text in secondary contexts.
- **Zinc 300** (#d4d4d8) — Primary body text on dark surfaces.
- **White** (#ffffff) — Primary headings, highest-emphasis data, the hero title.

### Named Rules

**The Cold Neutral Rule.** All zinc values carry zero hue saturation. There is no warm tint to any neutral. If a surface reads as warm, it is not on-brand.

**The Signal-Only Color Rule.** Emerald, amber, and red carry no decorative role. They appear only as operational state indicators. A green bar is always communicating throughput; it is never ornamental.

**The Small Text Rule.** Text at 11px or below must be zinc-400 or lighter against a dark surface to maintain 4.5:1 contrast.

## 3. Typography

**Display Font:** Geist Sans (system-ui fallback)
**Body Font:** Geist Sans (system-ui fallback)
**Data/Mono Font:** Geist Mono (ui-monospace fallback)

A single-family system with weight as the primary differentiator. Geist Sans carries everything — display headlines, section labels, body prose. Geist Mono is reserved for numeric data.

### Hierarchy

- **Brand Mark** — 600 weight, 14px, 0.05em tracking
- **Display** — 700 weight, clamp(32px–48px), 1.1 line-height, -0.02em tracking. Primary page heading. Used once per page.
- **Headline** — 700 weight, 24px, 1.2 line-height, -0.01em tracking. Section titles within cards.
- **Metric Value** — 700 weight, 24px, 1.0 line-height, -0.02em tracking. Large numerals in stat cards. Tabular-nums enforced.
- **Title / Section Label** — 500 weight, 11–13px, 0.08em tracking, uppercase. Section eyebrows, column headers, card headers.
- **Body** — 400 weight, 14px, 1.6 line-height. Prose descriptions, supporting context. Max 65ch when running inline.
- **Mono Data** — 400 weight, 11–12px, normal tracking. Throughput figures, TTFT, uptime, timestamps. Tabular-nums always.

### Named Rules

**The Mono-for-Data Rule.** Every numeric metric uses Geist Mono. Not just the headline value — every numeric datum in the interface.

**The Uppercase Sparingly Rule.** Uppercase tracking-widest labels appear on section headers and column headers only. Never on body copy, never more than 2–3 per screen section.

## 4. Elevation

Shadowless by default. Depth is conveyed through translucent layering and subtle border luminosity, not cast shadows.

1. **Body** (background-color: #000000) — The base plane. Nothing sits below this.
2. **Grid overlay** (opacity 0.03) — A 60px white grid on the body. Atmospheric texture.
3. **Radial glow** (top-center, emerald, 8% opacity) — A single gradient wash from the top edge. The only colored atmospheric element.
4. **Surface layer** (bg-zinc-900/40, border-zinc-800/40) — Elevated panels, insight cards, the data table wrapper.
5. **Solid surface** (bg-zinc-900/60 to /80) — Components that need more definition against the translucent layer.
6. **Recessed surface** (bg-zinc-800/30) — Inside cards for nested metrics, progress tracks, chart areas.

Border strategy uses luminosity contrast, not color. On hover, borders shift one step lighter to signal interactivity. Glow emission replaces shadow state: status indicators use box-shadow 0 0 8px on small dots. Reserved for live status signals only.

### Named Rules

**The No-Cast-Shadow Rule.** No element uses box-shadow for structural depth. Glow on status dots is emission, not shadow.

**The Border Luminosity Rule.** Borders are always zinc-800 at 40–60% opacity. They serve as edge definition, not decoration.

## 5. Components

### Cards / Containers

- Shape: 12px border-radius
- Background: Zinc-900 at 40–80% opacity depending on hierarchy
- Border: 1px solid zinc-800 at 40–60% opacity
- Hover: Border shifts to zinc-700/50, background lightens one step
- Backdrop blur: backdrop-blur-sm on translucent cards for depth cue against the grid

### Status Pill

- Shape: Fully rounded capsule (9999px radius)
- Style: Tinted background at 10% state color opacity, 1px border at 20% state color opacity, 12px horizontal padding, 5px vertical
- Dot: 6px circle with full state color, wrapped in a 6–8px glow
- Text: 12px, medium weight, state color at 40–60% opacity

### Metric Card / Insight Card

- Shape: 12px radius
- Background: Zinc-900 at 40–60% opacity
- Border: Zinc-800 at 40%
- Layout: Label (11px, uppercase-widest, zinc-600) above large value (24px, bold, white or zinc-200)
- Mono font for numeric values

### Data Table

- Container: Rounded-2xl, zinc-900/60 background, zinc-800/60 border
- Header row: 12px vertical padding, border-b on zinc-800/60
- Body rows: 16px vertical padding, border-bottom on zinc-800/40
- Cell text: 14px, zinc-200 for model name, zinc-300 for metric values, zinc-600 for metadata
- Tabular-nums on all numeric cells

### Progress / Bar Indicators

- Track: 6px height, zinc-800, full-rounded (9999px radius)
- Fill: Colored per state threshold. Emerges from the left. Transition 500–700ms.

### Sparkline (SVG)

- Dimensions: 120×28px standard
- Line: 1.5px stroke, state color, slight opacity
- Area fill: Gradient from state color at 30% opacity to 0% at 60% opacity overall
- Endpoint dot: 2.5px radius circle at last data point, 80% opacity

### Best Model Spotlight (Signature Component)

- Frame: 1px gradient border via inset pseudo-element on wrapper. Inner background: zinc-900/80 with backdrop-blur-sm
- Label: 10px, emerald-400 at 70% opacity, uppercase, 0.2em tracking, semibold
- Metric grid: 5 columns on sm, single column on xs
- Each metric: zinc-800/30 tile with zinc-800/50 border, 12px radius

## 6. Do's and Don'ts

### Do

- Use emerald/amber/red exclusively as operational state signals
- Use Geist Mono for every numeric value; tabular-nums always
- Keep card surfaces at zinc-900 opacity, never solid color
- Use uppercase tracking-widest only on column headers and section labels
- Use 12px border-radius on cards and containers
- Use glow (box-shadow emission on small dots) for liveness indicators
- Transition state changes at 300–700ms with ease-out curves
- Pair color state with context text — "jammed" label alongside red dot

### Don't

- Use warm tinted neutrals (oklch chroma toward yellow/orange)
- Use emerald, amber, or red as decorative accents
- Use border-radius above 16px on cards, tables, or containers
- Use font-weight below 400 for body text
- Animate CSS layout properties (width, height, margin)
- Use distributed animation sequences (staggered reveals on every section)
- Use the hero-metric template
- Use side-stripe colored borders (left or right border as accent)
- Use gradient text (background-clip: text)
- Use generic AI startup visuals: cream backgrounds, soft rounded cards, scan-line effects, particle backgrounds
- Use marketing-voice copy anywhere on the operational surface
- Use display fonts in UI labels, table headers, or buttons
