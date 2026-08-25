import Link from "next/link";
import type { Metadata } from "next";

import { NavBar } from "@/components/navigation/nav-bar";
import { SiteFooter } from "@/components/site/site-footer";

export const metadata: Metadata = {
  title: "404 — Page not found",
  description: "This path does not exist on NIM Stats. Jump to the fleet overview, the status page, or the sitemap.",
  robots: { index: false, follow: true },
};

// Not-found responses carry a real 404 status (Next sets it for this file), and
// a body that is a recovery map rather than an app shell: an agent that followed
// a dead link leaves here knowing where the sitemap and llms.txt are. The
// Markdown representation of the same 404 is rendered by
// app/api/markdown/[[...slug]]/route.ts.

const DESTINATIONS = [
  { href: "/", label: "Fleet overview", note: "Live status of every tracked NVIDIA NIM endpoint" },
  { href: "/discover", label: "Discover", note: "Rankings by latency, throughput, and reliability" },
  { href: "/status", label: "Public status", note: "One-screen fleet verdict" },
  { href: "/about", label: "About", note: "What is measured, how, and how often" },
  { href: "/contact", label: "Contact", note: "Reach the operator" },
  { href: "/privacy", label: "Privacy", note: "Data handling" },
];

const MACHINE_READABLE = [
  { href: "/llms.txt", label: "llms.txt", note: "What this site is for and when to use it" },
  { href: "/agent-instructions.md", label: "agent-instructions.md", note: "Task-by-task agent guidance" },
  { href: "/sitemap.xml", label: "sitemap.xml", note: "Every valid URL on this site" },
  { href: "/robots.txt", label: "robots.txt", note: "Crawl policy" },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <NavBar />

      <main style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="status-led status-led--warn" style={{ width: 6, height: 6 }} aria-hidden="true" />
            <span className="label-sm text-text-tertiary">HTTP 404</span>
          </div>
          <h1 className="heading-lg text-text-primary">Page not found</h1>
          <p className="mt-2 max-w-2xl body-sm text-text-secondary">
            That path does not exist on NIM Stats. Nothing was moved — it was never a valid
            URL. There are no per-model pages: model detail opens as a panel over the fleet
            table, so the fleet views below are the canonical source for any single endpoint.
          </p>

          <section className="mt-8">
            <h2 className="section-label mb-3">Where to look instead</h2>
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-base">
              {DESTINATIONS.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface-card px-4 py-3 transition-colors hover:bg-surface-recessed"
                  >
                    <span className="body-sm font-semibold text-text-primary">{d.label}</span>
                    <span className="body-xs text-text-tertiary">{d.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="section-label mb-3">Machine-readable entry points</h2>
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-base">
              {MACHINE_READABLE.map((d) => (
                <li key={d.href}>
                  <a
                    href={d.href}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-surface-card px-4 py-3 transition-colors hover:bg-surface-recessed"
                  >
                    <span className="metric-sm text-text-primary">{d.label}</span>
                    <span className="body-xs text-text-tertiary">{d.note}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-2xl body-xs text-text-quaternary">
              Every page above is also available as Markdown at the same URL — send{" "}
              <code className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-text-tertiary">
                Accept: text/markdown
              </code>{" "}
              or append <code className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-text-tertiary">.md</code> to the path.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
