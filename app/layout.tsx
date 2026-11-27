import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WebMcpTools } from "@/components/agent/webmcp";
import { JsonLd } from "@/components/site/json-ld";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

// Geist and Geist Mono at 400 and 500 only: the whole type scale lives on those
// two weights (see DESIGN.md). Both are self-hosted by next/font, so the mono is
// the same face on every platform (no system-stack width variance). Latin subset;
// every character the app renders is Latin.
const geist = Geist({
  variable: "--ff-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--ff-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    // content-negotiate can still follow the `.md` alias. A plain URL, not the
    // `[{ url, title }]` form: vinext's metadata resolver only accepts strings
    // here and fails the whole render on the object form.
    types: { "text/markdown": "/.md" },
  },
  robots: { index: true, follow: true },
  // Served from public/ as a static asset, so browsers fetching it never wake the
  // Worker. As app/favicon.ico it was a route: ~190 Worker invocations a day.
  // The logo mark (circle, diamond, triangle) on a dark tile. SVG for modern browsers,
  // a 16/32/48 ICO as the fallback, and a 180px PNG for iOS home screens.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
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
      className={`${geist.variable} ${geistMono.variable} dark h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
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
