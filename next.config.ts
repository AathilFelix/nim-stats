import type { NextConfig } from "next";

// Relative path, not the `@/*` alias: next.config.ts is transpiled and run
// outside the app's module graph, where that alias does not resolve.
import { renderLinkHeader } from "./lib/agent/link-header";

// Baseline security response headers applied to every route. HSTS is already set
// by the platform (Vercel/Cloudflare); these add the cheap, no-breakage wins.
// A full Content-Security-Policy is intentionally left out for now — it would
// need nonces for the inline theme script and Next's runtime, so it's a separate,
// more careful pass.
const securityHeaders = [
  // Stop browsers MIME-sniffing a response into a different content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Anti-clickjacking: disallow the site being framed by other origins.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't leak full URLs to third parties on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Drop access to powerful APIs the app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // Every page has two representations (HTML and Markdown), selected
          // from the Accept header in proxy.ts, so caches must key on it.
          //
          // Declared in three places on purpose, because no single one covers
          // every response: the Markdown route handler sets it on its own
          // response; this entry covers routes Next serves without clobbering
          // it; and vercel.json sets it in the CDN layer, outside the render —
          // which is the one that survives on a prerendered page, since Next's
          // Node server overwrites Vary when it appends its own RSC vary.
          // Vary is a union of its values, so declaring it more than once is
          // harmless.
          { key: "Vary", value: "Accept" },
          // RFC 8288 discovery links: the API catalog, the OpenAPI document,
          // the docs, the health endpoint and the agent-facing text files.
          // Declared here rather than in proxy.ts so they also reach the routes
          // the proxy deliberately skips (/api/*, /.well-known/*, llms.txt).
          // The per-page `rel="alternate"` Markdown link is appended by the
          // proxy instead, since it depends on the request path.
          { key: "Link", value: renderLinkHeader() },
        ],
      },
    ];
  },
};

export default nextConfig;
