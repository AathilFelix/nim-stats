import type { MetadataRoute } from "next"

import { PUBLIC_ROUTES, absoluteUrl } from "@/lib/site"

// /sitemap.xml — every indexable URL. There are no per-model pages: model detail
// is a client-side drawer over the fleet table, so the fleet pages are the only
// canonical URLs there are.
//
// Regenerated daily; lastModified is the generation time, which for the live
// fleet pages is the honest signal (their content changes on every probe cycle).

export const revalidate = 86400

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
