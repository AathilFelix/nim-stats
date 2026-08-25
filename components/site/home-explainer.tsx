import { InlineProse } from "@/components/site/inline-prose";
import { HOME_EXPLAINER } from "@/lib/content/pages";

/**
 * Server-rendered prose beneath the fleet. Everything above it is live numbers;
 * this is the part a crawler, a reader with JavaScript off, or an agent reading
 * raw HTML can actually understand the page from.
 */
export function HomeExplainer() {
  return (
    <section aria-labelledby="about-this-dashboard">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="about-this-dashboard" className="section-label">
          About this dashboard
        </h2>
        <p className="metric-xs text-text-tertiary">Measured, not reported</p>
      </div>
      <div className="grid gap-5 rounded-lg border border-border-base bg-surface-card px-5 py-5 lg:grid-cols-2">
        {HOME_EXPLAINER.map((section) => (
          <div key={section.heading} className="space-y-3">
            <h3 className="label-sm text-text-tertiary">{section.heading}</h3>
            {section.body.map((paragraph, i) => (
              <p key={i} className="max-w-[68ch] body-sm leading-relaxed text-text-secondary">
                <InlineProse text={paragraph} />
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
