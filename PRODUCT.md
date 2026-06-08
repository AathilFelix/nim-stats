# Product

## Register

product

## Users

AI developers, power users, and open-source AI practitioners who rely on free NVIDIA NIM API endpoints for coding agents (Claude Code, Cline, Roo, Continue) and LLM tooling. They check NIM Stats to decide which model to hit right now: is it healthy or jammed, fast or congested, reliable enough for a long coding session. They're technical but not design-focused — they want to scan, decide, and move on without friction. Their context is a working session: a problem in front of them, a model call about to fire, and a need for confidence about what's on the other end.

## Product Purpose

NIM Stats is a real-time operational intelligence layer over free NVIDIA NIM endpoints. It surfaces throughput, latency, uptime, and congestion across Llama, Mistral, Gemma, Phi, Qwen, DeepSeek, and other models — refreshed every 30 seconds. The purpose is not to inform or explain; it is to help a developer make a fast, correct routing decision before they send a request. Success looks like: open the page, read the signal in under five seconds, pick the right endpoint, and get back to work.

## Brand Personality

Operational, Premium, Precise. The interface should feel alive but controlled — like a well-run infrastructure control room. Trustworthy and realtime. Calm under pressure. Intelligence-grade: data is presented with surgical clarity, not spectacle. The brand is communicated entirely through the product experience — no tagline-required marketing wrapper. Reference points: Linear's polish, Vercel's density, Cloudflare Radar's data authority.

## Anti-references

- Cyberpunk or neon-drenched dashboards
- Noisy, cluttered monitoring UIs with gratuitous decoration
- Generic AI startup aesthetics (gradient hero feathers, soft rounded cards, cream backgrounds, illustration spot-illustrations)
- Decorative "futuristic" UI — scan lines, glow effects, particle backgrounds, holographic framing
- Marketing-voice copy anywhere on the operational surface
- SaaS hero-metric templates (big number, small label, gradient accent)

## Design Principles

1. **The product IS the brand.** No marketing wrapper needed. The dashboard's clarity, responsiveness, and polish communicate quality more than any badge or testimonial.
2. **Signal above all.** Layout, color, and motion exist to make the operational signal legible in under five seconds. If a visual choice doesn't serve scan-ability, remove it.
3. **Calm confidence.** The interface should feel like a calm operator, not a hype machine. Data breathes; whitespace is intentional; nothing is shouting.
4. **Precision over decoration.** Every pixel earns its place. Tight alignment, intentional spacing, no filler content. Craft shows in restraint, not density.
5. **Alive but quiet.** Realtime updates should feel organic — subtle pulse, smooth transitions — never jarring or theatrical. The page is monitoring something real; acknowledge that with gentle motion, not spectacle.

## Accessibility & Inclusion

- WCAG 2.1 AA minimum: all text-on-background combinations must meet 4.5:1 contrast (3:1 for large text)
- Full `prefers-reduced-motion` support: all animations collapse to instant transitions or crossfades
- Keyboard-navigable: status indicators, sortable controls, and interactive elements must be reachable without a pointer
- Semantic HTML: proper heading hierarchy, landmark roles, ARIA labels on data-dense tables and charts
- Color not the sole signal: status indicators pair color with shape/text, not just hue
