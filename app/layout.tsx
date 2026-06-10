import type { Metadata, Viewport } from "next";
import { JetBrains_Mono as JetBrainsMono, Outfit as OutfitSans } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const outfit = OutfitSans({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrainsMono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${outfit.variable} ${jetbrains.variable} h-full antialiased`}
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
