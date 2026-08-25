import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/site"

// /robots.txt — everything public is open to crawlers and agents. Only the
// internal API surface and Next's build output are disallowed; those are either
// token-gated or meaningless to a crawler.

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/_next/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
