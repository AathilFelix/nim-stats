# Product

## Register

product

## Users

Developers, AI engineers, and open source enthusiasts who integrate or evaluate NVIDIA NIM models into their stack. They open NIM Stats during a workflow decision: which model to deploy, whether a degradation event is ongoing, or how current load will affect their call latency. These are technical users who read dashboards in a glance, who want the signal without parsing prose. They work across desktop and laptop, often in dark environments or paired terminals.

## Product Purpose

NIM Stats is an operational intelligence dashboard that monitors the health state of NVIDIA NIM-hosted AI models. It surfaces per-model status (healthy, busy, jammed), fleet-level aggregate health, throughput, congestion, time-to-first-token, and uptime reliability in a single scannable view. It exists so a developer can answer "which model should I call right now" in under five seconds, and diagnose degradation across the fleet without visiting five separate dashboards. Success: a user opens the page and immediately knows both the recommended model and the fleet health picture.

## Brand Personality

Precise, quiet, trustworthy. The interface should feel like a well-instrumented control room, not a marketing page. Three words: **calm, authoritative, technical**.

Voice is declarative and spare. Label with nouns and numbers. Avoid adjectives unless the data demands them. The UI earns trust by showing raw figures cleanly, not by claiming authority through copy.

## Anti-references

- Warm beige or parchment backgrounds, regardless of how "premium" they read. This is an infrastructure tool in dark mode.
- SaaS dashboard clichés: hero metric with a big number and soft gradient, how-it-works stepper, identical icon+title+body card grids.
- Component surfaces that look fine but feel wrong on close inspection: inconsistent borders, shadow-plus-border pairing on the same element, rounded radii above 16px on cards.
- Section kickers in tiny uppercase tracking-wide type above every heading (the 2023-era "01 / ABOUT" eyebrow).
- Gradient text, glassmorphism as decoration, or motion that doesn't convey state.
- Any interface that looks like it was designed for a non-technical executive audience. This tool is built for people who read logs for fun.

## Design Principles

1. **Signal over space.** Information density is a virtue when the user is technical. Compress what can be compressed; expand only what matters right now. The pick list and key metrics should be readable in a single visual pass.
2. **One recommendation at a time.** The primary readout is a single model suggestion with its evidence. Everything else supports that headline finding — it does not compete with it.
3. **State is color, not copy.** Healthy / busy / jammed communicate through hue first, label second. A user scanning a fleet grid should read status at a glance without parsing text.
4. **Calm under stress.** When the fleet is degraded, the interface should not amplify the alarm. Surfaces dim, indicators shift, numbers go red — the layout does not. Panic is not a product decision.
5. **Infrastructure-grade craft.** Every border, alignment, and type tier should feel intentional. If a developer fluent in tools like Linear or Datadog pauses at a component as "off", the design has failed.

## Accessibility & Inclusion

- WCAG AA minimum for text contrast on both light and dark themes.
- Status indicators must convey state without relying on color alone (include shape or label).
- Light/dark mode toggle with system preference detection as the default.
- Reduced motion respected on all transitions and reveals.
- Keyboard-navigable: all interactive controls reachable and operable without a pointer.
