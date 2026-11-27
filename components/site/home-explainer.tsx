import { InlineProse } from "@/components/site/inline-prose";
import { HOME_EXPLAINER } from "@/lib/content/pages";

/**
 * Server-rendered prose beneath the fleet. Everything above it is live numbers;
 * this is the part a crawler, a reader with JavaScript off, or an agent reading
 * raw HTML can actually understand the page from. It sits in the same panel
 * grammar as the sections above and inherits their container.
 */
export function HomeExplainer() {
  return (
    <section aria-labelledby="about-this-dashboard" className="panel">
      <div className="hdiv">
        <h2 id="about-this-dashboard" className="heading-md">
          About this dashboard
        </h2>
        <p className="body-sm text-text-muted">Measured, not reported</p>
      </div>
      <div className="panel-pad grid gap-x-12 gap-y-8 lg:grid-cols-2">
        {HOME_EXPLAINER.map((section) => (
          <div key={section.heading} className="space-y-3">
            <h3 className="text-base font-medium text-text-primary">{section.heading}</h3>
            {section.body.map((paragraph, i) => (
              <p key={i} className="max-w-[68ch] body-md text-text-muted">
                <InlineProse text={paragraph} />
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
