import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        {/* impeccable-live-start */}
        <script src="http://localhost:8400/live.js" />
        {/* impeccable-live-end */}
      </body>
    </html>
  );
}
