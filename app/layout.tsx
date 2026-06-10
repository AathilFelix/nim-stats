import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono as JetBrainsMono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--ff-sans",
  subsets: ["latin"],
  display: "swap",
});

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

export const metadata: Metadata = {
  title: "NIM Stats — Free NVIDIA NIM Endpoint Status",
  description:
    "Real-time status and reliability metrics for free NVIDIA NIM API endpoints. Track throughput, latency, uptime, and congestion across Llama, Mistral, Gemma, Phi, Qwen, DeepSeek, and more models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        {/* Dark-first, no flash: apply the persisted theme before first paint.
            Defaults to dark unless the visitor explicitly chose light. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('nim-stats-theme');var l=t==='light';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(l?'light':'dark');}catch(e){}})();",
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
