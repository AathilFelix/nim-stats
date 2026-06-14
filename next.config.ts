import type { NextConfig } from "next";

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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
