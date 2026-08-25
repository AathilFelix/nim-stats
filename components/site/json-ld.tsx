import {
  AUTHOR_NAME,
  AUTHOR_URL,
  CONTACT_EMAIL,
  SAME_AS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site";

/**
 * schema.org identity graph for the site, emitted once from the root layout.
 *
 * Three linked nodes rather than one blob: the Organization that operates the
 * site, the WebSite itself, and the WebApplication that is the product. Agents
 * resolve "who is this and what do they do" from the first two and "what does
 * it cost / what does it run on" from the third.
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APPLICATION_ID = `${SITE_URL}/#application`;

// TODO(contact): add `email` here (and a PostalAddress `address`) once a support
// address is published — see CONTACT_EMAIL in lib/site.ts. Until then the
// contactPoint carries only a URL, which is honest but incomplete.
const contactPoint: JsonValue = {
  "@type": "ContactPoint",
  contactType: "technical support",
  url: absoluteUrl("/contact"),
  availableLanguage: ["en"],
  ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
};

const graph: JsonValue = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        `${SITE_NAME} is an independent operational dashboard that continuously probes the free NVIDIA NIM inference endpoints and publishes their measured latency, throughput, uptime, and congestion. Not affiliated with NVIDIA Corporation.`,
      founder: { "@type": "Person", name: AUTHOR_NAME, url: AUTHOR_URL },
      sameAs: [...SAME_AS],
      contactPoint: [contactPoint],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "WebApplication",
      "@id": APPLICATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "DeveloperApplication",
      applicationSubCategory: "API status monitoring",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript for interactive panels; core status renders without it.",
      isAccessibleForFree: true,
      // The dashboard is free to read and requires no account.
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      featureList: [
        "Live status for every free NVIDIA NIM chat-completion endpoint",
        "Measured time to first token, end-to-end latency, and sustained throughput",
        "Uptime, reliability, and congestion history per endpoint",
        "Endpoint rankings by latency and throughput",
        "Markdown representation of every page for AI agents via Accept: text/markdown",
      ],
      publisher: { "@id": ORGANIZATION_ID },
      isPartOf: { "@id": WEBSITE_ID },
    },
  ],
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify can emit `</script>` inside a string value; escaping the
      // `<` keeps the block from terminating early. No user input reaches here,
      // but the escape costs nothing.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}

/** Exported for tests — the exact object that gets serialised. */
export const jsonLdGraph = graph;
