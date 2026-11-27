import { ImageResponse } from "next/og";
import geist400 from "@fontsource/geist/files/geist-latin-400-normal.woff?inline";
import geist500 from "@fontsource/geist/files/geist-latin-500-normal.woff?inline";

// Social link-preview card (1200×630) shown when nimstats.aathil.com is shared
// on X, Slack, etc. Statically generated at build (no request-time data), so it
// adds nothing to runtime cost. Hand-built in the app's dark palette (DESIGN.md):
// flat #1c1c1c, white ink, one muted grey, hairline outlines, and the three state
// shapes. No glow, no gradient. Satori only supports inline styles + flexbox, so
// every multi-child box sets display:flex.
//
// Font: Satori reads TTF/OTF/WOFF but not WOFF2 (what next/font self-hosts), so the
// card loads Geist 400 and 500 as WOFF from @fontsource/geist (about 17 kB each,
// latin only), inlined as data URIs at build time and decoded here. Workers'
// fetch() can't read data: URLs, hence the manual base64 decode.

function dataUriToBuffer(uri: string): ArrayBuffer {
  const bin = atob(uri.slice(uri.indexOf(",") + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export const alt = "NIM Stats — real-time status & reliability for free NVIDIA NIM endpoints";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#1c1c1c";
const TEXT = "#ffffff";
const MUTED = "#9a9a9a";
const BORDER = "#3a3a3a";
// State shape colours (dark theme): answering, busy, not responding.
const HEALTHY = "#34d399";
const BUSY = "#f59e0b";
const JAMMED = "#f87171";

const MODELS = ["Llama", "Mistral", "Gemma", "Qwen", "DeepSeek", "Phi"];

function Shapes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width="28" height="28" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5.2" fill={HEALTHY} />
      </svg>
      <svg width="28" height="28" viewBox="0 0 12 12">
        <path d="M6 .4 11.6 6 6 11.6.4 6z" fill={BUSY} />
      </svg>
      <svg width="28" height="28" viewBox="0 0 12 12">
        <path d="M6 .8 11.7 11.2H.3z" fill={JAMMED} />
      </svg>
    </div>
  );
}

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: BG,
          color: TEXT,
          fontFamily: "Geist",
        }}
      >
        {/* top: state shapes + cadence */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Shapes />
          <div style={{ display: "flex", fontSize: 26, color: MUTED }}>Probed every 10 minutes</div>
        </div>

        {/* middle: title + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 112, fontWeight: 500, letterSpacing: -3, lineHeight: 1, color: TEXT }}>
            NIM Stats
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 36, lineHeight: 1.35, color: MUTED, maxWidth: 940 }}>
            Real-time status &amp; reliability for every free NVIDIA NIM endpoint: throughput, latency, uptime and congestion.
          </div>
        </div>

        {/* bottom: model chips + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {MODELS.map((m) => (
              <div
                key={m}
                style={{
                  display: "flex",
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                  fontSize: 24,
                  color: MUTED,
                }}
              >
                {m}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: TEXT }}>nimstats.aathil.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: dataUriToBuffer(geist400), weight: 400, style: "normal" },
        { name: "Geist", data: dataUriToBuffer(geist500), weight: 500, style: "normal" },
      ],
    },
  );
}
