import type { Metadata } from "next";

import { ApiReferenceView } from "@/components/site/api-reference";
import { buildOpenApiDocument } from "@/lib/api/openapi";
import { buildApiReference } from "@/lib/api/reference";
import { SITE_NAME } from "@/lib/site";

// /api — the human-readable rendering of /openapi.json. Static: the spec
// changes only on deploy.
export const dynamic = "force-static";

const reference = buildApiReference(buildOpenApiDocument());

export const metadata: Metadata = {
  title: `${SITE_NAME} API Reference — free NVIDIA NIM endpoint status API`,
  description:
    `Public read-only JSON API for ${SITE_NAME}: measured uptime, latency, throughput, and reliability for the free NVIDIA NIM inference endpoints. OpenAPI 3.1 spec at /openapi.json. No authentication required.`,
  alternates: { canonical: "/api" },
};

export default function ApiDocsPage() {
  return <ApiReferenceView reference={reference} />;
}
