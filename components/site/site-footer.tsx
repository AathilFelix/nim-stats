import Link from "next/link";

import { BuiltBy } from "@/components/site/built-by";

/**
 * Shared footer for the trust-anchor pages. Also the crawl path to /about,
 * /contact and /privacy — pages an agent checks before it will recommend a
 * source, and which nothing linked to before this existed.
 */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-border-subtle mt-8 ${className}`}>
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
        <nav aria-label="Site information" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {[
            { href: "/", label: "Dashboard" },
            { href: "/status", label: "Status" },
            { href: "/api", label: "API" },
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/privacy", label: "Privacy" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="label-xs text-text-tertiary underline-offset-2 transition-colors hover:text-text-secondary hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <BuiltBy />
      </div>
    </footer>
  );
}
