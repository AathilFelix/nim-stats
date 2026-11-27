# DESIGN.md — NIM Stats

Mode: Operate. A user lands, reads the fleet state in five seconds, picks an endpoint, leaves.
Source of truth for values: `app/globals.css`. This file explains them; keep the two in sync.

The system is a near-monochrome neutral ladder with a single emerald primary, Geist at weights 400 and 500, and Geist Mono for code and table numerals. Panels are flat 1px-hairline cards with radius 12 and no shadow. Status colour is for status only and is always paired with a shape and a word. Dark is the default; light is a full second theme, not an afterthought.

Theme mechanism: `<html class="dark" data-theme="dark">` (dark) or `class="light" data-theme="light"` (light), set before first paint by `components/theme/theme-script.tsx` and persisted under `nim-stats-theme`. In CSS, light values live on `:root`, dark values on `.dark, [data-theme="dark"]`.

## Fonts

- **Sans: Geist**, weights 400 and 500 only, via `next/font/google` (`Geist`, latin, `display: swap`, `--ff-sans`). Fallback `'Helvetica Neue', Helvetica, Arial, sans-serif`. Never 600 or above.
- **Mono: Geist Mono**, weights 400 and 500 (400 is what ships in use), via `next/font/google` (`Geist_Mono`, latin, `display: swap`, `--ff-mono`). Fallback `ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', monospace` (`--font-mono`). Used for code, ids, model names and table numerals.
- Numerals are tabular everywhere (`font-variant-numeric: tabular-nums` on `body`).
- Sentence case for every UI label. No uppercase, no letter-spaced eyebrows.

## Color

Two text levels (ink, muted) and a short hairline ladder. Emerald is never body text and never the only signal.

| Token | Light | Dark | Use |
|---|---|---|---|
| `surface-base` / `--background` | `#ffffff` | `#1c1c1c` | page, nav |
| `surface-card` | `#ffffff` | `#1c1c1c` | panels, inputs |
| `surface-recessed` / `surface-elevated` | `#fafafa` | `#202020` | table header, row hover, wells, inputs on cards |
| `surface-overlay` | `#ffffff` | `#202020` | menus, drawer, tooltip, popover |
| `border-base` | `#dfdfdf` | `#3a3a3a` | panel outline, inputs, nav rule |
| `border-subtle` | `#ededed` | `rgba(255,255,255,.08)` | dividers inside a panel, grid lines |
| `border-strong` | `#c7c7c7` | `#3a3a3a` | outline buttons, segmented track (dark has one hairline step) |
| `text-primary` | `#171717` | `#ffffff` | titles, values, links |
| `text-muted` | `#707070` | `#9a9a9a` | labels, captions, axis ticks, placeholders |
| `text-secondary/tertiary/quaternary` | = `text-muted` | = `text-muted` | compat aliases; collapse to two levels in S2/S3 |
| `text-disabled` | `#b2b2b2` | `#3a3a3a` | disabled only |
| `primary` | `#3ecf8e` | `#3ecf8e` | the one filled CTA, input focus border, selection |
| `primary-deep` | `#24b47e` | `#24b47e` | primary hover / pressed |
| `primary-foreground` | `#171717` | `#171717` | text on emerald (near-black, never white) |
| `accent-soft` | `rgba(62,207,142,.12)` | `rgba(62,207,142,.12)` | quiet emerald wash (top-rank badge) |
| `accent-2` / `status-info` | `#6b01c2` | `#a36cd8` | the rare second accent; informational status |
| `chip` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.08)` | pill / tag fill, outline-button hover |
| `ring` | `#171717` | `#ffffff` | focus outline |

Contrast: `text-primary` 17.9 / 17.0 on base; `text-muted` 4.95 / 6.06 on base (4.74 / 5.79 on recessed); primary-foreground on `#3ecf8e` 8.98.

### Status

Status colours colour shapes and fills. The word beside the shape is set in ink or muted, so the colour is never the only channel and never carries body text on its own.

| State | Word | Shape | Light | Dark |
|---|---|---|---|---|
| healthy | Answering | circle | `#16a34a` | `#34d399` |
| busy / warn | Busy | diamond | `#b66c00` | `#f59e0b` |
| jammed / critical | Not responding | triangle | `#dc2626` | `#f87171` |
| neutral / unmeasured | — | ring | `#707070` | `#9a9a9a` |
| info | — | filled circle | `#6b01c2` | `#a36cd8` |

Tokens: `status-healthy`, `status-warn`, `status-critical`, `status-neutral`, `status-info`; `destructive` is the danger colour. No glow, no pulse. Shapes are 12px in running UI, 8px in dense rows (`.status-led`).

### Featured card ("Call this now")

The one polarity-flipped surface; it is the only element on the page that inverts.

| Token | Light | Dark |
|---|---|---|
| `feat-bg` (also its border) | `#1c1c1c` | `#3ecf8e` |
| `feat-text` | `#ffffff` | `#171717` |
| `feat-mute` | `#9a9a9a` | `rgba(23,23,23,.72)` |
| `feat-code` (id well) | `#202020` | `#1c1c1c` |
| `feat-line` (id well border) | `rgba(255,255,255,.14)` | transparent |
| `feat-btn-bg` | `#3ecf8e` | `#ffffff` |
| `feat-btn-text` | `#171717` | `#1c1c1c` |
| `feat-btn-hover` | `#24b47e` | `#ededed` |

The id well is always a dark code surface with white text, in both themes.

### Selected (inverse) control

`sel-bg` / `sel-text` / `sel-mute`: light `#1c1c1c` / `#ffffff` / `#9a9a9a`, dark `#ffffff` / `#1c1c1c` / `#707070`. Used for the active segment, the active filter button and the active tab underline.

### Chart colours

- The home chart (`Fleet performance`) is a single-series column chart. A segmented control picks the series: Reply rate (0 to 100%), First token (ms) or Throughput (tok/s); the range comes from the section bar (12h, 24h, 7d). Columns are `text-muted`, the latest column is `primary`, 4px gap, 2px radius on the top end only. Reply rate is the fleet success rate, not a state split.
- Grid lines `border-subtle`, axis labels 12px `text-muted`, no axis lines. Hover wash is `text-primary` at 8%.
- Reserved palette tokens `chart-1..5`: light `#24b47e #644fc1 #b66c00 #dc2626 #9a9a9a`, dark `#3ecf8e #a36cd8 #f59e0b #f87171 #707070`.
- Charts plot measured values only; no interpolation. Labels in HTML at 12px or larger.
- The state colours (`status-healthy/warn/critical`) colour shapes and the distribution bar, never a chart series.

### Heat ramps (calendar, latency heatmap)

Two single-hue ramps so the scale reads the same for any colour vision. They live in `globals.css` as `--h-1 … --h-5` on `.heat-up` and `.heat-lat`; a cell is `<span class="heat" data-lv="…">`. The thresholds that pick `data-lv` are in `components/dashboard/heat-scale.ts`.

| Ramp | Class | Meaning | Steps |
|---|---|---|---|
| Uptime | `.heat-up` | stronger = more uptime | `1` 95 to 97%, `2` 97 to 99%, `3` 99 to 99.9%, `4` 99.9% or more: `primary-deep` at 30 / 52 / 76 / 100% on the card (light), `primary` at 38 / 60 / 80 / 100% (dark) |
| Latency | `.heat-lat` | stronger = slower first token | `1` under 250 ms, `2` 250 to 500, `3` 500 to 800, `4` 800 to 1,500, `5` over 1,500: `text-primary` at 12 / 26 / 44 / 66 / 90% on the card |

- `data-lv="0"` is no data: transparent with a 1px `border-base` inset ring. Cells with data have no ring.
- `data-lv="bad"` (uptime under 95%) is a 135° hatch: 2px `status-critical` lines on 2px gaps with a 1px `status-critical` ring. Pattern, not a hue, marks the worst days.
- Adjacent steps differ by an OKLab lightness of 0.06 or more in both themes. Every ramp ships a labelled legend (swatch plus range, including "No data").
- `.score-cell` (discover reliability matrix): faint `primary` tints at 10 / 20 / 32% (`data-lv` 2 / 3 / 4) with ink text, hatch for `bad` (under 90), `surface-recessed` for none. Ink text never sits on the strong ramp.

## Typography

Geist 400/500 and Geist Mono, tight tracking on display tiers. Classes in `globals.css`.

| Role | Class | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display (page verdict) | `heading-xl`, `metric-hero` | 36 / 1.15 (28 / 1.2 below 768) | 500 | -0.72px (-0.42px) | the one h1 per page |
| Card value | `metric-xl` | 28 / 1.2 | 500 | -0.42px | metric card figure, featured-card figure |
| Compact heading | `heading-lg`, `metric-lg` | 22 / 1.2 | 500 | 0 | sub-heading, medium figure |
| Section heading | `heading-md`, `section-label`, `metric-md` | 18 / 1.4 | 500 | 0 | panel title (h2) |
| Lead | `body-lg` | 18 / 1.55 | 400 | 0 | verdict sentence |
| Body | `body-md` | 16 / 1.5 | 400 | 0 | default |
| Button, nav, tab | `nav-item` | 14 / 1 | 500 | 0 | |
| Caption | `body-sm`, `label-sm` | 13 / 1.45 | 400 | 0 | labels, helper, legend, header cells |
| Micro | `body-xs`, `label-xs` | 12 / 1.45 | 400 | 0 | pills, axis ticks, units |
| Code | `code`, `metric-sm` | 14 / 1.5 mono | 400 | 0 | endpoint ids, table numerals |
| Mono micro | `metric-xs`, `.kbd` | 12 / 1.45 mono | 400 | 0 | key hints |

Minimum text size is 12px. Display steps 36 → 28 below 768px.

- **Tabular numerals.** Every figure uses `font-variant-numeric: tabular-nums` (the `metric-*` classes, `.metric-value`, `.data-text`, `.cell-metric`). Geist's default digits are proportional (28px, 500: 8.71px spread between the widest and narrowest digit); tabular they are equal at 17.14px. Table columns are Geist Mono, 8.40px per digit at 14px, so the k-th digit from the right lines up within 0.02px across rows.
- **Display tracking stays -0.72px at 36px (-0.02em).** Checked against Geist at full resolution: the h1 and the 8/17/7 figures keep clear counters and no touching pairs, and nothing needed a change. Revisit if a display tier above 40px is added, where tighter tracking is more likely to pay.
- **The mono is a webfont now.** The system stack varied by platform (Menlo on macOS, Consolas on Windows, Liberation Mono or DejaVu elsewhere, each with its own advance width), so ids and table columns changed width per device. Geist Mono is self-hosted by next/font, so the advance is the same everywhere. The system stack remains only as the fallback while the face loads.
- **`ch` measures.** Geist's `0` is about 5% wider than Inter's at the same size (8.62px against 8.2px at 13px), so a `ch` measure is about 5% wider in pixels. Body-sm prose pages use `max-w-[64ch]` (was 68ch) to keep the same physical measure (about 552px); the lead keeps 56ch.

## Spacing

Base 8px with 2/4/12 sub-steps. Tokens `--space-xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · huge 64` (Tailwind's 4px scale covers the same values).

- Page gutter 24px (16px below 768). Gap between panels 16px (12px mobile). Page bottom padding 64px.
- Panel inner gutter **24px, 16px below 768** (`.panel-pad`, `.hdiv`). One gutter for every panel.
- Panel header (`.hdiv`): min-height 68px (60 mobile), 16px 24px, soft hairline below.
- Container max width 1328px (1280 of content plus 24px gutters), centred.

## Radii

`xs 4` key hints, distribution-bar ends, small tags · `sm 6` buttons, inputs, code blocks, segments · `md 8` compact cards, segmented track · `lg 12` panels and cards · `xl 16` modals, drawers · `full` pills, mini bars. Buttons are never pill-shaped. Tailwind `rounded-xs/sm/md/lg/xl` map to these.

## Borders and elevation

Flat. Every panel is a 1px `border-base` hairline on `surface-card`; no shadow on page panels (level 0). Dividers inside panels use `border-subtle`.

| Level | Token | Value (light / dark) | Use |
|---|---|---|---|
| 0 | none | hairline only | panels, cards, table |
| 1 | `--shadow-sm` | `0 1px 3px rgba(0,0,0,.06)` / `0 1px 2px rgba(0,0,0,.4)` | rarely: sticky bars |
| 3 | `--shadow-float` | `0 8px 24px rgba(0,0,0,.12)` / `0 8px 24px rgba(0,0,0,.5)` + 1px under-shadow | menus, drawer, tooltip |

No gradients, no blur, no glow.

## Components

All specs below exist as CSS in `globals.css` where a class is named.

- **Button, primary** (`.btn .btn-primary`): bg `primary`, text `primary-foreground`, 14/500, padding 8px 16px, min-height 36, radius 6, hover/pressed `primary-deep`. One filled emerald button per viewport.
- **Button, outline** (`.btn .btn-outline`): bg `btn-bg` (`#fff` / `#202020`), text ink, 1px `btn-line` (`#c7c7c7` / `#3a3a3a`), hover `chip`. `aria-pressed="true"` = inverse (`sel-bg`/`sel-text`). Icon variant `.btn-icon` is 36px square.
- **Button, featured** (`.btn-feat`): `feat-btn-*` tokens; only inside the featured card.
- **Segmented control** (`.seg`, children `<button aria-pressed>`): 2px padded track, 1px `btn-line` border, radius 8; segments 30px tall, 12px side padding, 14/500 muted, radius 6; active = `sel-bg`/`sel-text`, carried between segments by one thumb (see Motion). Columns are equal width.
- **Tabs** (section nav): 49px bar (48px of tabs plus the 1px hairline), 14/500, 12px side padding, muted; active = ink with a 2px ink underline. Bar is sticky with a hairline below; anchored targets carry `scroll-margin-top` of at least the bar height. Scrolls horizontally inside itself on mobile.
- **Card / panel** (`.panel`, `.ops-card`): `surface-card`, 1px `border-base`, radius 12, no shadow. Metric card: 24px pad, label 13 muted, figure 28/500 with 13 muted unit, delta row.
- **Featured card** (`.panel-featured`): see the token table. Layout: title 18/500, id in `.code-block` with the copy button on its right, two 28/500 figures with 13px captions, 13px footnote in `feat-mute`.
- **Pill tag** (`.pill`): `chip` fill, ink 12/400, padding 2px 8px, full radius. A status pill (table) is the same with a 13px label, 2px 12px 2px 8px padding, and the state shape before the word.
- **Code block** (`.code-block`): `feat-code` fill, white text, `.code` 14 mono, radius 6, padding 12px 12px 12px 16px, id wraps anywhere.
- **Text input** (`.field`): `surface-card` fill, 1px `border-base`, radius 6, padding 8px 12px, 16px text, placeholder `text-muted`; focus swaps the border to `primary` and adds a 3px `primary-glow` ring. An inline `kbd` hint (mono 12, hairline, radius 4) sits at the right.
- **Data table** (`.dtable`, inside the caller's own `overflow-x-auto`): header cells (`thead th`) on `surface-recessed`, 13px muted, left-aligned, `.r` for numeric columns, 1px `border-base` under the header. Body rows 56px (72 below 768, where secondary columns fold under the name; `.dtable--sm` is 64 there), `border-subtle` between rows, hover `surface-recessed` on every cell. The name is a row header: `<th scope="row" class="nm">` in mono 14 ink. Numerals are `td.num` (mono 14 ink) with a `.u` unit (12px sans muted, stacked under the number below 768). `.stick` makes a column sticky (opaque card fill). First and last cells carry the panel gutter (24px, 16px mobile). Header cells wrap below 768.
- **In-cell bar** (`.mbar`): inline flex, a 64x4px `border-subtle` track (`<i style="--w:…%">`) with a `text-muted` fill, then the value; the track hides below 768.
- **Status pill** (`.stc`): `chip` fill, ink 13/400 word, 2px 12px 2px 8px, full radius, with the 12px state shape first. The same shape plus an ink word appears wherever a state is shown in text form (SLA verdicts, `/status`, advanced columns); the colour is on the shape only.
- **Count on a button** (`.btn .n`): 400 weight, `text-muted` (`sel-mute` when `aria-pressed`).
- **Quiet button** (`.btn-quiet`): 14/500 muted text, min-height 36, padding 0 10px, radius 6, hover and `aria-expanded` = ink on `chip`; disabled is 50% opacity. Icon-only below 640 (label `sr-only`, 36px square).
- **Menu / popover** (`.menu`, `.menu-item`): `surface-overlay`, 1px `border-base`, radius 8, `--shadow-float`; items 36px, 14/400 ink, hover `chip`. Closes on outside press, Escape (focus returns to the trigger) and Tab-out. Export is a plain popover of buttons, not an ARIA menu.
- **Select** (`ui/select`): the outline-button look (`btn-bg`, 1px `btn-line`, radius 6, 14/500 ink, 36px; 32px for `size="sm"`), chevron muted; the open list is a `.menu`-style surface with 36px items. Focus is the global ink outline: never add `outline-none` to a focusable control.
- **Scrim** (`--scrim`): light `rgba(23,23,23,.4)`, dark `rgba(0,0,0,.6)`; the drawer backdrop. No blur.
- **Footer link** (`.foot-link`): muted, ink and underlined (3px offset) on hover.
- **Distribution bar** (`.fleet-bar`): 12px tall, radius 4, 2px gaps, healthy / busy / jammed fills, legend below with the count in ink and the word in muted.
- **Nav**: 68px bar, hairline below, 16px 24px. Brand mark = three state glyphs (circle, diamond, triangle) plus the name at 18/500. Links 14/500 muted, active ink. Theme toggle = outline icon button. Below 768 the links collapse behind a menu button.
- **Link**: ink, persistent underline with 3px offset.
- **Focus**: 2px solid ink outline, 2px offset, on everything focusable.

## Layout

12-column grid, 16px gap, inside the 1328px container.

1. Verdict (8 cols) beside the featured "Call this now" card (4 cols).
2. Four metric cards (3 cols each).
3. "Fleet performance" chart (8 cols) beside a short "Biggest changes" list (4).
4. Endpoints panel, full width.
5. Reliability: SLA compliance (6) beside the uptime calendar (6), then latency by hour, full width.
6. "About this dashboard" explainer panel, full width, then the one-line footer.

Breakpoints: below 1100px verdict, featured card, chart and changes go full width and metric cards go 2-up; below 768px the nav collapses, gutters drop to 16, tabs and range controls stack, secondary table columns fold under the model name. No page-level horizontal scroll at 375px.

## Endpoints panel

One `.panel`: header (`Endpoints`, quiet Share / Save / Export), then a toolbar, the table and a footer line.

- Toolbar row 1: state filters as `.btn .btn-outline` with a count (All, Answering, Busy, Not responding; `aria-pressed`, All = none selected, the states multi-select) and the search `.field` with the `/` hint. Row 2: Sort select, Provider select, Watchlist toggle, All metrics toggle (md and up). Saved presets sit in a third row only when some exist.
- Default view: sort "Best first" (answering first, then the quickest first token with unmeasured last, then throughput), all states, **12 rows**. The footer says how many are hidden and offers Show all / Show fewer; Export covers the whole filtered list, not the 12.
- Compact columns: pin, Model, Provider, Status, First token, Throughput (with `.mbar`), Up 24 h, Checked. Below 768 Provider, Status, Up and Checked drop; the provider and state fold under the name and the pin moves into that line. "All metrics" adds congestion, session reliability, volatility, timeout, P95, P99, recovery, queue, routing and a trend sparkline; the table then scrolls inside its panel with the first columns sticky.
- Unmeasured numbers (first token, throughput, P95, P99) render "—", never 0.
- URL state (replaceState, no refetch): `q` search, `p` provider, `s` comma-separated states, `fav=1` watchlist only, `sort` (omitted when "best"). Older `sort=status` links still resolve.
- Loading: a skeleton panel with the same header and a body of the loaded height (891px; 1218px below 768); height 962px / 1281px loaded with the current data.

### Detail drawer

`role="dialog" aria-modal`, right-anchored, `max-w` 540px, full width below 768, `surface-overlay`, `--shadow-float`, left radius 16 from 768, scrim behind. Opening moves focus to Close; Tab and Shift+Tab stay inside; Escape or the scrim closes; focus returns to the opener; the page behind does not scroll. The body is a labelled, focusable scroll region. Contents: state pill and provider, the name in mono 18, pin and close as outline icon buttons; eight vitals (`rounded-md` wells on `surface-recessed`), four operational tags, SLA tiles with shape plus word, the 90-day calendar, first token by hour, recent incidents with state shapes. No status colour on text.

## Reliability panels

Section `#reliability`, a 12-column grid with the same 16px gap. Each async panel has one fixed height per breakpoint for loading, loaded, error and empty (R10a): chrome that can wrap (headers, stat rows, legends) is rendered identically in every state, and only the note inside the fixed box changes.

- **SLA compliance** (6 cols from 1100): header with target select and 24h / 7d / 30d segments, a stat row (Meeting SLA, Breaching, Allowed downtime; shapes on the first two), then a **420px** labelled scroll region holding the `.dtable--sm` table (sticky header; Downtime hides below 640, Error budget below 768). Verdicts: Pass (circle), At risk (diamond), Breach (triangle), No data (ring).
- **Uptime calendar** (6 cols from 1100): header with a model select; body is the figure, one note line (loading and error text goes here), a 13-week grid of fixed cells (14px, 26px from 640, 4px gap, month labels above, Mon / Wed / Fri at the left) and a legend. Loading and error draw the same grid of empty cells.
- **Latency by hour** (full width): axis row, a **560px** labelled scroll region (24 cells per endpoint, name column 96px, 192px from 768), legend. Fewer endpoints leave empty space rather than shrinking the box.
- Measured panel heights with the current data (SLA / calendar / latency): 375px 652 / 418 / 768; 640 to 1099px 569 / 456 / 738; from 1100px 569 / 569 / 738.

## Motion

Reference: interior.dev (its timing and the principles behind it, none of its code or copy). Register: Operate. Twelve moments, every one at or below 360ms, entered once, no blur, no bounce, no idle loop except the refresh spinner. No animation library: CSS transitions and keyframes, the Web Animations API for one snapshot fade, and small client hooks.

**What may animate:** `transform`, `opacity`, `clip-path` and colour only. Never width, height, margin, padding, top or left. A box never changes size because something moved.

### Tokens (`globals.css`, `:root`, under `/* Motion */`)

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | every enter, reveal and draw |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | every exit |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | colour hovers |
| `--ease-snap` | `linear()` sampled critically damped spring (stiffness 520, damping 34, mass 0.45); `--ease-out` where `linear()` is unsupported | thumb and underline travel |
| `--dur-press` / `--dur-fast` | 120ms | `:active` translate; exits; hover-out |
| `--dur` | 150ms | colour and background hovers |
| `--dur-pop` | 160ms | menu enter, label swaps, new rows |
| `--dur-slow` | 200ms | fades, scrim in, drawer out |
| `--dur-enter` | 280ms | thumb, underline, value roll |
| `--dur-reveal` | 360ms | first-load panels, chart bars, drawer in |
| `--dur-spin` | 850ms | refresh spinner (linear) |
| `--stagger` | 45ms | panel step, capped at 4 steps |
| `--stagger-bar` | 6ms | per chart column; the run is clamped to 240ms (`--bar-step` is set per chart) |

Under `prefers-reduced-motion: reduce`, `--dur-enter`, `--dur-reveal`, `--stagger` and `--stagger-bar` are 0ms.

### Moments

| | Where | What happens |
|---|---|---|
| M1 | `.reveal` on the home panels (page.tsx, `BestModelNow`, the metric cards) | Opacity 0 to 1 and translateY 6px to 0, 360ms ease-out, delay `min(i, 4) * 45ms`: featured card 45ms, metric cards 90ms, chart and changes 135ms, endpoints, reliability and the explainer 180ms. The verdict panel is not animated (it is the LCP). `animation-fill-mode: backwards`, never forwards: a held transform would make the panel the containing block of the fixed drawer. A CSS animation does not replay when `router.refresh()` reconciles the same node. `.animate-stagger` (list rows on /discover) uses the same keyframe, delays capped at 4 steps (180ms). `RevealSection` (the /discover sections) is the same `.reveal` on server markup with `step` 1 to 4, so content is visible without JavaScript. |
| M2 | `<Tick>` (`components/ui/tick.tsx`): verdict word and shape, fleet counts, legend counts, the four metric cards, the featured card figures and id, table first token, throughput, uptime and status pill | When a rendered value differs from the previous render of the same cell: a colour-neutral wash (`--chip`) in 150ms, held to 900ms, out 160ms, once. `roll` also moves the new value in from the side it moved (higher from below, lower from above, 0.5em, 280ms ease-out); `wash` is the wash alone (table numerals); `fade` is a 160ms opacity fade (states). Never on first paint (the previous value is seeded at mount). At most 6 changed cells flash per refresh, by design: a commit that changes more (typically after a tab returns from the background, or when most table numerals move on a new probe) flashes nothing and the values just swap, because a screen of simultaneous flashes is noise. The ticking "updated ... ago" text is never animated. |
| M3 | `fleet-trend-chart.tsx`, `.fleet-bar` | Each bar sweeps up from the baseline with `clip-path` (corners never stretch), 360ms ease-out, staggered across columns with the whole run clamped to 240ms. On mount it waits for the panel reveal (135ms). On a range or metric change the old plot fades out in 120ms (an inert snapshot of the last drawn DOM) and the new bars sweep in after 120ms; the axis labels fade in on the same clock. A remote range still loading keeps the old plot at 40% instead of a spinner; with nothing plotted yet it shows a static "Loading". Hover wash in 0ms, out 120ms. The distribution bar's segments scale from the left (`scaleX`, 360ms, 90ms delay); their widths never animate. |
| M4 | `components/ui/seg.tsx` (range, metric and SLA window segments) | One thumb carried by `translateX` (280ms `--ease-snap`); the pressed label's colour crosses 40ms after the thumb leaves. Columns are equal so the thumb never changes size; where a narrow screen forces unequal columns the thumb is dropped and the pressed button paints its own background (150ms colour). Retargets from where it is. |
| M5 | `section-bar.tsx` | One 2px underline carried to the active tab with `translateX` and `scaleX` (280ms `--ease-snap`). A tab click locks the destination until the smooth scroll goes quiet (140ms) or a wheel, touch or key press interrupts, so the underline does not flip through every section. |
| M6 | `CopyId` in `best-model-now.tsx`, Share in `model-explorer.tsx` | Idle, copied and failed labels sit in one grid cell, so the button is as wide as the widest and never resizes. The outgoing label fades and scales to 0.92 in 120ms ease-in; the incoming one in 160ms ease-out; the check mark draws left to right with a 260ms `clip-path` wipe (not stroke-dashoffset). Reverts after 2000ms; a second click restarts the clock. `role="status"` announces once. |
| M7 | `model-detail-drawer.tsx` | The panel slides in on `transform` (360ms ease-out) with the scrim on `opacity` (200ms); it leaves in 200ms and 150ms ease-in and stays mounted until it is gone (230ms), then focus returns to the opener. Both are transitions, so reopening mid-exit retargets. The panel travels 32px past its own width so its shadow clears the edge. `html { scrollbar-gutter: stable }` stops the page shifting when body scroll locks. |
| M8 | `.btn`, `.btn-quiet`, `.seg > button`, `.press` (pin star, select trigger, refresh) | `:active` translateY(1px) in 120ms ease-out. Colour hovers 150ms `--ease-standard`. Table row hover is asymmetric: in 60ms, out 180ms. The refresh icon spins at 850ms linear only while refreshing. |
| M9 | `ui/select.tsx`, `.menu` | Select: enter 160ms ease-out (opacity, scale 0.94, 6px travel from the trigger edge); exit 120ms ease-in at scale 0.97. Radix keeps the node until the exit ends. The export and save popovers enter the same way and leave instantly. The select chevron turns in 200ms. (`ui/tooltip.tsx` is not imported anywhere and is untouched.) |
| M10 | `ModelExplorerSkeleton`, explorer content, chart loading | Skeleton rows paint only after 120ms (`.skel`), static, no shimmer. The loaded explorer fades its content in over 200ms inside a panel whose chrome does not move. The chart's spinner is gone. |
| M11 | `theme-provider.tsx`, `theme-toggle.tsx` | The colour change is one cut: `.theme-switching` suppresses every transition for two frames. The sun and moon glyphs are stacked and cross-fade with a 45 degree turn (200ms ease-out). |
| M12 | `model-table.tsx` | Rows whose id was not in the previous render fade in over 160ms (no travel); rows that leave just go; first paint and order-only changes do nothing. The table body keeps the height of the page-size rows (`.dtable-reserve`: 44px header plus 12 rows of 56px, 58px plus 72px below 768) so the footer line does not jump while filtering. |

### Reduced motion

`prefers-reduced-motion: reduce` drops the trip and keeps the destination. Reveals, bar draws, wipes, the roll and the wash, the drawer travel, the thumb and underline, label scaling, glyph turns, overlay pops and the spinner are all off: values, labels, bars, the drawer, the thumb and the underline land in their final state. Colour changes stay (they are not motion). `<Tick>`, the chart snapshot and the drawer unmount read the media query themselves; a global backstop in `globals.css` sets every remaining animation and transition to 0.01ms.

## Deviations from the published system

The design language is a published open-source-database product system. These are the places the app departs from it, each on purpose.

1. **Geist and Geist Mono replace the proprietary sans and mono.** The system's own substitute is Inter 400/500; Geist was chosen from a measured comparison (same component heights as the Inter control at 1440 and 375, tabular digits, a self-hosted mono). Display tracking is applied as listed.
2. **Panel padding is 24px, 16px on mobile**, not 32px. The page is a dense dashboard, not a marketing grid.
3. **Mono 14 for table numerals and ids.** The system reserves mono for code; here every endpoint id and table figure is mono so columns align.
4. **Card figures are sans 28/500 with tabular numerals**, not mono.
5. **Light featured card is ink `#1c1c1c`; dark featured card is emerald**, following the dark preview's polarity flip. The copy button flips too (emerald on ink, white on emerald).
6. **Light outline buttons keep the 1px `#c7c7c7` outline** (the prose spec) rather than the preview's borderless fill. In dark they get a 1px `#3a3a3a` border the preview omits, so the control reads on the same-colour surface.
7. **Inverse "selected" state** (`sel-*`) for segments and filters is not in the published system; it extends the ink-on-white / white-on-ink pairing it already uses.
8. **Soft divider `border-subtle`** inside panels: `#ededed` (the system's cool hairline) in light, `rgba(255,255,255,.08)` in dark, where the dark preview has only one hairline step (`#3a3a3a`).
9. **Focus is a 2px ink outline**, not specified by the system; input focus uses the emerald border and a 22% emerald ring so the green stays reserved for action and focus-on-input.
10. **Status colours** are the preview's success / warning / danger pairs, used on shapes and fills (healthy circle, busy diamond, not-responding triangle). Light-theme healthy (3.3:1) and busy (4.1:1) are below text contrast, so they never colour body text on their own.
11. **`status-info` is the second accent** (`#6b01c2` / `#a36cd8`), the only use of that colour as a system token.
12. **Links and `text-accent` are ink**, never emerald (green on white fails 3:1).
13. **Container is 1328px** (1280 of content) with 24px gutters; the system says roughly 1280.
14. **Status pill label is 13px** (caption) rather than micro 12, for legibility next to a 12px shape.
15. **Table rows 56px / 72px mobile, header on `surface-recessed`**, which the system does not specify.
16. **Shadows are not used on page panels**; level 3 only on floating surfaces.

## Do and don't

- Do keep emerald scarce: one filled green button per viewport, the featured card in dark, input focus, selection, the rank-one highlight.
- Do pair every status colour with its shape and its word.
- Do say each fact once above the fold; unmeasured values render "—", never 0.
- Don't use weight 600+, uppercase labels, gradients, glass, glow or pulse.
- Don't use white text on emerald, or emerald as text.
- Don't introduce purple, yellow or pink as system colours; they belong to chart points only.
- Don't use pill-shaped buttons.
