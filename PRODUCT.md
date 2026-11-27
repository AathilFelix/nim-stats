# Product

## Register

product

## Users

Public reference / discovery layer. Developers, researchers, and hobbyists evaluating free NVIDIA NIM endpoints for inference workloads. They arrive with a model family in mind (Llama, Mistral, Gemma, Phi, Qwen, DeepSeek) and need to answer one question fast: which endpoint is healthy right now, and what will it cost me in latency and throughput if I switch? Secondary audience: ML platform / ops teams who want fleet reliability at a glance. Context is often exploratory — not their own account view, not an alert triage console — so the surface must be scannable without authentication or prior knowledge.

## Product Purpose

NIM Stats is a public operational dashboard for free NVIDIA NIM API endpoints. It surfaces real-time (or near-real-time) reliability metrics — throughput, latency, uptime, congestion — across available model endpoints so users can pick a working model without trial-and-error. Success looks like: a user lands, reads the fleet state in under five seconds, and knows which endpoint to call. The product exists to reduce the friction of "which NIM endpoint works right now" for the open-model community.

## Brand Personality

Precise, calm, authoritative. The interface reads as ground truth — nothing theatrical, nothing apologetic. Copy is clipped and specific; the visual system defers to the data. Urgency is carried by status color, shape and wording, not by motion or alarm styling. The voice assumes a technical audience and does not explain what a latency number means.

## Anti-references

- **Vercel / Linear pastel minimalism** — muted lilac, soft cream, gentle elevation, engineered-trust feel. Wrong register for ops urgency.
- **Apple / Stripe soft elegance** — mega-rounded cards, blurred glass, gradient CTAs, whitespace as a luxury good. Any surface that could be shot for a case study at a 45-degree angle.
- **Grafana / Datadog chrome** — dense server-room panels with stacked widgets, 2008-styled gauges, green/amber/red on black as a crutch rather than a system. (Flat hairline panels on a near-monochrome ground with status colour confined to state are the chosen system, see DESIGN.md; the anti-reference is the widget-wall look.)
- **Slack-green / disco-era cyber** — neon grid, synthwave, matrix vibes. Playful ops is hostile ops.
- **Marketing-surface reflexes** — shimmer, motion for its own sake, gradient text, eyebrow labels on every section. A single large verdict and large card figures are part of the chosen system; what stays out is a decorative wall of oversized metrics.

## Design Principles

- **Data first, chrome second.** Every pixel competes with the metrics for attention. If it doesn't carry operational signal, it gets quieter.
- **Status is color + shape + word.** Healthy / warn / critical must be readable at a glance, and never by color alone: each state has its own shape (circle, diamond, triangle) and a plain word beside it. No pulse.
- **Scan, don't read.** Users arrive with a question and leave. Hierarchy and spacing serve five-second comprehension, not long-form engagement.
- **Precision over personality.** The brand's authority comes from correctness and restraint, not from voice or whimsy. No aphorisms, no marketing cadence.
- **Dark by default, light fully supported.** Ops surfaces often run in dim environments under sustained attention, so dark is the default ambient-light choice. Light is a first-class theme with its own tokens, switched from the nav.

## Accessibility & Inclusion

WCAG 2.2 AA baseline. Body text >= 4.5:1 against its surface; large text >= 3:1. Status is never color-only — paired with shape (circle, diamond, triangle), position, and text label. `prefers-reduced-motion` honored (current `globals.css` already collapses animations). Deuteranopia-safe palette preferred: avoid pure red/green as the sole signal channel; pair with amber/blue or with text. Screen-reader-friendly tables with proper headers and row scope.
