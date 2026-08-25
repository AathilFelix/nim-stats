import { NavBar } from "@/components/navigation/nav-bar";
import { InlineProse } from "@/components/site/inline-prose";
import { SiteFooter } from "@/components/site/site-footer";
import type { StaticPage } from "@/lib/content/pages";

/**
 * Reading surface for /about, /contact and /privacy. Same measured, instrument
 * -panel vocabulary as the status page — bordered card surfaces, section
 * labels, no marketing furniture — at a comfortable reading measure.
 */
export function ProsePage({ page }: { page: StaticPage }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <NavBar />

      <main style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <header className="border-b border-border-subtle">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="status-led status-led--healthy" style={{ width: 6, height: 6 }} aria-hidden="true" />
              <span className="label-sm text-text-tertiary">NIM Stats</span>
            </div>
            <h1 className="heading-lg text-text-primary">{page.title}</h1>
            <p className="mt-2 max-w-2xl body-sm text-text-secondary">{page.summary}</p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="section-label mb-3">{section.heading}</h2>
              <div className="space-y-3 rounded-lg border border-border-base bg-surface-card px-5 py-5">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="max-w-[68ch] body-sm leading-relaxed text-text-secondary">
                    <InlineProse text={paragraph} />
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
