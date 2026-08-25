import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono as JetBrainsMono } from "next/font/google";
import { WebMcpTools } from "@/components/agent/webmcp";
import { JsonLd } from "@/components/site/json-ld";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

// Geist — Vercel's technical grotesque, for all UI text. Instrument-grade,
// engineered feel that suits an AI-infrastructure operations console.
const geist = Geist({
  variable: "--ff-sans",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono — every number, code, and machine-readable label. Tabular
// figures keep metrics aligned column-to-column across the fleet.
const jetbrains = JetBrainsMono({
  variable: "--ff-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Identity facts live in lib/site.ts — the sitemap, robots.txt, llms.txt, the
// JSON-LD graph and the Markdown representations all read from the same place.
const TITLE = SITE_TITLE;
const DESCRIPTION = SITE_DESCRIPTION;

// metadataBase makes the generated opengraph-image / twitter-image URLs absolute,
// which social crawlers require. The og:image and twitter:image tags themselves
// are injected automatically by Next from app/opengraph-image.tsx + twitter-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "NIM Stats",
  keywords: [
    "NVIDIA NIM", "LLM status", "API uptime", "inference latency", "TTFT",
    "throughput", "model reliability", "Llama", "Mistral", "Gemma", "Qwen", "DeepSeek",
  ],
  alternates: {
    canonical: "/",
    // Advertise the Markdown representation of this URL. A crawler that can't
    // content-negotiate can still follow the `.md` alias.
    types: { "text/markdown": [{ url: "/.md", title: TITLE }] },
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "NIM Stats",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrains.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="ops-grid min-h-full flex flex-col font-sans antialiased">
        {/* Dark-first, no flash: apply the persisted theme before first paint. */}
        <ThemeScript />
        <JsonLd />
        {/* WebMCP tools for an agent driving the browser. No-op elsewhere. */}
        <WebMcpTools />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
