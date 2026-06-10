# Product

## Register

product

## Users

Public reference / discovery layer. Developers, researchers, and hobbyists evaluating free NVIDIA NIM endpoints for inference workloads. They arrive with a model family in mind (Llama, Mistral, Gemma, Phi, Qwen, DeepSeek) and need to answer one question fast: which endpoint is healthy right now, and what will it cost me in latency and throughput if I switch? Secondary audience: ML platform / ops teams who want fleet reliability at a glance. Context is often exploratory — not their own account view, not an alert triage console — so the surface must be scannable without authentication or prior knowledge.

## Product Purpose

NIM Stats is a public operational dashboard for free NVIDIA NIM API endpoints. It surfaces real-time (or near-real-time) reliability metrics — throughput, latency, uptime, congestion — across available model endpoints so users can pick a working model without trial-and-error. Success looks like: a user lands, reads the fleet state in under five seconds, and knows which endpoint to call. The product exists to reduce the friction of "which NIM endpoint works right now" for the open-model community.

## Brand Personality

Precise, calm, authoritative. The interface reads as ground truth — nothing theatrical, nothing apologetic. Copy is clipped and specific; the visual system defers to the data. Urgency is carried by status color and pulse, not by motion or alarm styling. The voice assumes a technical audience and does not explain what a latency number means.

## Anti-references

- **Vercel / Linear pastel minimalism** — muted lilac, soft cream, gentle elevation, engineered-trust feel. Wrong register for ops urgency.
- **Apple / Stripe soft elegance** — mega-rounded cards, blurred glass, gradient CTAs, whitespace as a luxury good. Any surface that could be shot for a case study at a 45-degree angle.
- **Grafana / Datadog imitation** — familiar server-room chrome, 2008-styled panels, green/amber/red on black as a crutch rather than a system.
- **Slack-green / disco-era cyber** — neon grid, synthwave, matrix vibes. Playful ops is hostile ops.
- **Marketing-surface reflexes** — hero metrics, shimmer, motion for its own sake, gradient text, eyebrow labels on every section.

## Design Principles

- **Data first, chrome second.** Every pixel competes with the metrics for attention. If it doesn't carry operational signal, it gets quieter.
- **Status is color + pulse, not icon + label.** Healthy / warn / critical must be readable at a glance without reading text. Redundancy (color + shape + text) for color-blind safety.
- **Scan, don't read.** Users arrive with a question and leave. Hierarchy and spacing serve five-second comprehension, not long-form engagement.
- **Precision over personality.** The brand's authority comes from correctness and restraint, not from voice or whimsy. No aphorisms, no marketing cadence.
- **Dark by physical scene, not by default.** Ops surfaces run in dim environments under sustained attention. The dark theme is the ambient-light choice, not the "tools look cool dark" choice.

## Accessibility & Inclusion

WCAG 2.2 AA baseline. Body text >= 4.5:1 against its surface; large text >= 3:1. Status is never color-only — paired with shape (LED dot), position, and text label. `prefers-reduced-motion` honored (current `globals.css` already collapses animations). Deuteranopia-safe palette preferred: avoid pure red/green as the sole signal channel; pair with amber/blue or with text. Screen-reader-friendly tables with proper headers and row scope.
