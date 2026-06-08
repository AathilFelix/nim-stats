---
name: NIM Stats
description: Real-time operational intelligence for free NVIDIA NIM endpoints
colors:
  black: "#000000"
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
  glow-dot-emerald:
    backgroundColor: "{colors.emerald}"
  glow-dot-amber:
    backgroundColor: "{colors.amber}"
  glow-dot-red:
    backgroundColor: "{colors.red}"
---

# Design System: NIM Stats

## 1. Overview

**Creative North Star: "The Operations Console"**

A calm, premium command center for AI infrastructure. The interface is dense with operational signal but airy in its whitespace. Every element exists to help a developer scan, decide, and act in under five seconds. The darkness is not mood — it is functional. Black backgrounds eliminate visual noise so emerald state indicators, amber warnings, and red alerts carry maximum signal at minimum cognitive cost. The typography is clinical and precise: Geist Sans for hierarchy, Geist Mono for data. There is no decoration; data itself is the visual interest.

**Key Characteristics:**
- Signal-dense but visually calm
- Every pixel earns its place; no filler, no decoration
- State color vocabulary is the only color language: emerald, amber, red on near-black
- Translucent zinc surfaces create depth without shadows
- Monospace numerals for all metrics; spacing characters never collapse
- Motion is functional: transitions and pulsing status, never spectacle

## 2. Colors

A restrained two-tone system: near-black surfaces with a zinc mid-tone ramp, plus three semantic state colors. No decorative color exists.

**Canonical values live in globals.css as `oklch(...)` tokens. Hex equivalents below are for Stitch linter compatibility; prefer the oklch source for implementation.**

### Primary (State Signal)
- **Emerald** (`#10b981` / `oklch(0.72 0.19 154.6)`): Healthy state, primary success indicator, active throughput, recommended pick accent. Used where a system is operating normally.
- **Amber** (`#f59e0b` / `oklch(0.84 0.16 84.6)`): Busy state, degraded performance, elevated latency. Signals caution without alarm.
- **Red** (`#ef4444` / `oklch(0.637 0.237 25.3)`): Jammed or failed state, critical congestion, timeouts. Draws immediate attention when warranted.

### Neutral
- **Black** (`#000000`): Body background. Not a design choice — the page is a monitor, and monitors are black.
- **Zinc 950** (`#09090b`): Elevated surface behind translucent cards. Subtly lighter than body to create the first layer of depth.
- **Zinc 900** (`#18181b`): Primary card and container surface. The default "raised" background.
- **Zinc 800** (`#27272a`): Secondary surface, dividers, bar chart fills, progress tracks.
- **Zinc 700** (`#3f3f46`): Borders and low-contrast dividers.
- **Zinc 600** (`#52525b`): Muted secondary text, provider labels, metadata.
- **Zinc 500** (`#71717a`): Tertiary text, placeholder labels, axis text.
- **Zinc 400** (`#a1a1aa`): Body text in secondary contexts.
- **Zinc 300** (`#d4d4d8`): Primary body text on dark surfaces.
- **White** (`#ffffff`): Primary headings, highest-emphasis data, the hero title.

### Named Rules
**The Cold Neutral Rule.** All zinc values carry zero hue saturation (oklch chroma ≈ 0). There is no warm tint to any neutral. If a surface reads as warm, it is not on-brand.

**The Signal-Only Color Rule.** Emerald, amber, and red carry no decorative role. They appear only as operational state indicators (health, warning, failure). A green bar is always communicating throughput; it is never ornamental.

**The Small Text Rule.** Text at 11px or below must be zinc-400 or lighter against a dark surface to maintain 4.5:1 contrast. Zinc-500 at 10px falls below the threshold; use zinc-400 instead.

## 3. Typography

**Display Font:** Geist Sans (system-ui fallback)
**Body Font:** Geist Sans (system-ui fallback)
**Data/Mono Font:** Geist Mono (ui-monospace fallback)

**Character:** A single-family system with weight as the primary differentiator. Geist Sans carries everything — display headlines, section labels, body prose. Geist Mono is reserved for numeric data: throughput values, TTFT measurements, uptime percentages, timestamps. The pairing feels technical without being sterile.

### Hierarchy

- **Brand Mark** (600, 14px, 0.05em tracking): Logo/wordmark, sidebar upper context.
- **Display** (700, clamp(32px–48px), 1.1 line-height, -0.02em tracking): Primary page heading ("NVIDIA NIM / free endpoints"). Used once per page.
- **Headline** (700, 24px, 1.2 line-height, -0.01em tracking): Section titles within cards (e.g., the recommended model name).
- **Metric Value** (700, 24px, 1.0 line-height, -0.02em tracking): Large numerals in stat cards. Tabular-nums enforced; figures must not shift on update.
- **Title / Section Label** (500, 11–13px, 0.08em tracking, uppercase): Section eyebrows, column headers, card headers. All uppercase; applied sparingly.
- **Body** (400, 14px, 1.6 line-height): Prose descriptions, supporting context. Max 65ch when running inline.
- **Mono Data** (400, 11–12px, normal tracking): Throughput figures, TTFT, uptime percentages, timestamps. Tabular-nums always.

### Named Rules
**The Mono-for-Data Rule.** Every numeric metric uses Geist Mono. Not the headline value — every numeric datum in the interface. This is the most consistent signal in the system and must not drift.

**The Uppercase Sparingly Rule.** Uppercase tracking-widest labels appear on section headers and column headers only. Never on body copy, never on card text, never more than 2–3 per screen section. If every section header is uppercase-widest, the voice has become noise.

## 4. Elevation

This system is **shadowless by default**. Depth is conveyed through translucent layering and subtle border luminosity, not cast shadows.

The stack runs on a black base with increasing opacity toward the foreground:

1. **Body** (`background-color: #000000`): The base plane. Nothing sits below this.
2. **Grid overlay** (opacity 0.03): A 60px white grid on the body. Subtle enough to read as atmospheric texture, not structure lines.
3. **Radial glow** (top-center, emerald, 8% opacity): A single gradient wash from the top edge. The only colored atmospheric element.
4. **Surface layer** (`bg-zinc-900/40`, `border-zinc-800/40`): Elevated panels, insight cards, the data table wrapper. Translucent — the grid shows through minimally.
5. **Solid surface** (`bg-zinc-900/60` to `/80`): Components that need more definition against the translucent layer. Spotlight card at 80%.
6. **Recessed surface** (`bg-zinc-800/30`): Inside cards for nested metrics, progress tracks, chart areas.

Border strategy uses luminosity contrast, not color — zinc-800 borders on zinc-900 surfaces appear as a faint structural line, like a faint edge light. On hover, borders shift one step lighter (zinc-700) to signal interactivity.

Glow emission replaces shadow state: status indicators use `box-shadow: 0 0 8px <color>` on 2px dots. This is the system's only "shadow" concept — it is emission, not cast, and it is reserved for live status signals.

### Named Rules
**The No-Cast-Shadow Rule.** No element uses `box-shadow` for structural depth. Glow on status dots is emission, not shadow. Surfaces differentiate through opacity layering, not shadow weight.

**The Border Luminosity Rule.** Borders are always zinc-700/zinc-800 at sub-50% opacity. They serve as edge definition, not decoration. A 1px border at full zinc-700 is too harsh; use zinc-800 at 40% instead.

## 5. Components

### Cards / Containers
- **Shape:** Rounded corners (12px radius).
- **Background:** Zinc-900 at 40–80% opacity depending on hierarchy. The body scrolls over the black base; cards float above it.
- **Border:** 1px solid zinc-800 at 40–60% opacity. On hover for interactive cards: border shifts to 50% zinc-700, background lightens one step.
- **Shadow:** None. Depth is the opacity differential, not shadow.
- **Padding:** 16–24px for standard cards; 12px for dense data cards and table wrappers.
- **Backdrop blur:** `backdrop-blur-sm` on translucent cards for a depth cue against the grid.

### Status Pill
- **Shape:** Fully rounded capsule (9999px radius).
- **Style:** Tinted background at 10% state color opacity, 1px border at 20% state color opacity, 12px horizontal padding, 5px vertical.
- **Dot:** 6px circle with full state color, wrapped in a 6–8px glow (`box-shadow` match to the dot color).
- **Text:** 12px, medium weight, state color at 40–60% opacity. Label reads as "healthy", "busy", or "jammed".
- **Variants:** Healthy (emerald), Busy (amber), Jammed (red with pulse animation).

### Metric Card / Insight Card
- **Shape:** 12px radius. Same surface treatment as the parent card but smaller footprint.
- **Background:** zinc-900 at 40–60% opacity, matching parent card's surface level or one step lighter.
- **Border:** zinc-800 at 40% — faint, structural.
- **Internal layout:** Label (11px, uppercase-widest, zinc-600) above a large value (24px, bold, white or zinc-200). Mono font for any numeric value.
- **Hover:** Border shifts to zinc-700/50, background lightens slightly, text shifts one step toward white. Transition 300ms ease-out.
- **Separator:** A single horizontal gradient element (transparent → state-color at 20% → transparent) at the bottom of some insight cards. Never a full border; always a line, always tinted.

### Buttons (shadcn/ui)
- **Shape:** 8px radius (rounded-lg). Consistent across all sizes and variants.
- **Primary variant:** Primary background (light mode: near-black; dark mode: zinc-100), white text. The only filled button variant in the operational surface.
- **Outline / Ghost variants:** Detached stroke or no stroke, used in secondary contexts.
- **Focus ring:** 3px ring at ring color (zinc-500 at 50% opacity). Mandatory for keyboard accessibility.
- **Motion:** translateY(-1px) on active. No color shift on hover for primary.

### Data Table
- **Container:** Rounded-2xl, zinc-900/60 background, zinc-800/60 border, overflow-x-auto for horizontal scroll on narrow viewports.
- **Header row:** 12px padding vertically, border-b on zinc-800/60. No hover state on headers — they are not interactive.
- **Body rows:** 16px vertical padding, border-bottom on zinc-800/40. Alternating states via conditional hover: red-500/5 for jammed, emerald-500/3 for healthy.
- **Cell text:** 14px, zinc-200 for model name, zinc-300 for metric values, zinc-600 for providers and metadata. Tabular-nums on all numeric cells.
- **Column headers:** 11px, uppercase, tracking-widest, zinc-500, medium weight. Never full-sentence labels; abbreviated or single-word headers.

### Progress / Bar Indicators
- **Track:** 6px height, zinc-800, full-rounded (9999px radius).
- **Fill:** Colored per state threshold. Emerges from the left. Transition duration 500–700ms for smooth update without animation theater.
- **Threshold logic:** Green ≥99.9%, amber ≥99.5%, red below. For congestion: green ≤50%, amber ≤80%, red above.

### Sparkline (SVG)
- **Dimensions:** 120×28px standard, 120×40px variant.
- **Line:** 1.5px stroke, state color, slight opacity (0.9). Rounded caps and joins.
- **Area fill:** Gradient from state color at 30% opacity (top) to 0% (bottom), overall at 60% opacity.
- **Endpoint dot:** 2.5px radius circle at the last data point, 80% opacity.
- **Trend indicator:** ▲ (8px, emerald) or ▼ (8px, red) at top-right corner.

### Best Model Spotlight (Signature Component)
- **Frame:** A 1px gradient border created via an inset pseudo-element: `linear-gradient(135deg, emerald at 20%, emerald at 5%, emerald at 20%)` on an inset wrapper. Inner background is zinc-900 at 80% with backdrop-blur-sm.
- **Label:** 10px, emerald-400 at 70% opacity, uppercase, 0.2em tracking, semibold. "Best Right Now."
- **Metric grid:** 5 columns on sm/5-to-1 ratio on xs. Each metric is a zinc-800/30 tile with zinc-800/50 border, 12px radius, 12px padding.
- **Uptime bars:** 48 thin bars, each 2px wide, height proportional to reliability score, color by threshold, opacity reflecting value. Rendered as divs with inline styles.

### Congestion Bar
- **Track:** 64px wide, 6px height, zinc-800, full-rounded.
- **Fill:** Inline background-color based on congestion threshold. Width set via style attribute. Transition 300ms.

### Status Dot (Generic)
- **Size:** 8–10px diameter circle.
- **Glow:** `box-shadow: 0 0 8px <color>` — the emission treatment. This is not a shadow; it is a glow that communicates liveness.
- **Pulse animation:** Only on jammed state. Soft opacity oscillation (100% → 50% → 100%), 2s duration. Never bouncy.

## 6. Do's and Don'ts

### Do:
- **Do** use emerald/amber/red exclusively as operational state signals — health, latency, congestion, reliability. No decorative use.
- **Do** use Geist Mono for every numeric value: metrics, percentages, timestamps, axis labels. Tabular-nums always.
- **Do** keep card surfaces at zinc-900 opacity, never solid color. The translucency is the system's depth language.
- **Do** use uppercase tracking-widest (0.08em) only on column headers and section labels. Never on body text, card labels, or more than twice per visible section.
- **Do** use 12px border-radius on cards and containers. This is the system radius; deviations must be intentional and documented.
- **Do** use glow (box-shadow emission on small dots) for liveness indicators. This is the system's only shadow-like effect.
- **Do** transition state changes at 300–700ms with ease-out curves. Hover on 300ms; data bar fills on 500–700ms.
- **Do** pair color state with context text — "jammed" label alongside red dot, not just a red dot. Color is never the sole signal.
- **Do** use Tabular-nums on all monospace numeric data so figures align horizontally during updates.

### Don't:
- **Don't** use warm tinted neutrals (oklchroma toward yellow/orange) on any neutral token. The Cold Neutral Rule is absolute.
- **Don't** use emerald, amber, or red as decorative accents — no gradient headers, no colored borders without state meaning, no colored section dividers as ornament.
- **Don't** use `border-radius` above 16px on cards, tables, or containers. A 24px+ radius on a data card is off-brand.
- **Don't** use font-weight below 400 for body text. The lightest weight in the system is 400 (regular).
- **Don't** animate CSS layout properties (width, height, margin) — only opacity, transform, and background-color if needed.
- **Don't** use distributed animation sequences (staggered reveals on every section). Motion is state-response only.
- **Don't** use the hero-metric template (big number, small label, supporting stats, gradient accent). This is a dashboard, not a SaaS landing page.
- **Don't** use side-stripe colored borders (left or right border as accent). Rewrite with background tint or full border if emphasis is needed.
- **Don't** use gradient text (`background-clip: text`). Emphasis via weight and size only.
- **Don't** use generic AI startup visuals: cream backgrounds, soft rounded cards, illustration spot-illustrations, cyberpunk glow, neon accents, scan-line effects, or particle backgrounds.
- **Don't** use marketing-voice copy anywhere on the operational surface. No "supercharge," "empower," "streamline," or "transform" in labels, titles, or empty states.
- **Don't** use display fonts in UI labels, table headers, or buttons. Geist Sans carries everything — the weight contrast creates hierarchy, not font swapping.
- **Don't** use border-left or border-right greater than 1px as a colored accent on any element.
