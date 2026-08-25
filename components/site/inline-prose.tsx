import { tokenizeInline } from "@/lib/markdown/inline";

/**
 * Renders the inline Markdown used in lib/content/pages.ts — links, bold, and
 * code spans — as React nodes. Same source text as the Markdown representation,
 * so the two never drift.
 */
export function InlineProse({ text }: { text: string }) {
  return (
    <>
      {tokenizeInline(text).map((token, i) => {
        switch (token.kind) {
          case "link": {
            const external = !token.href.startsWith("/") && !token.href.startsWith("https://nimstats.aathil.com");
            return (
              <a
                key={i}
                href={token.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary"
              >
                {token.value}
              </a>
            );
          }
          case "strong":
            return (
              <strong key={i} className="font-semibold text-text-primary">
                {token.value}
              </strong>
            );
          case "code":
            return (
              <code key={i} className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-[0.9em] text-text-secondary">
                {token.value}
              </code>
            );
          default:
            return <span key={i}>{token.value}</span>;
        }
      })}
    </>
  );
}
