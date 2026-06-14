import { ImageResponse } from "next/og";

// Social link-preview card (1200×630) shown when nimstats.aathil.com is shared
// on X, Slack, etc. Statically generated at build (no request-time data), so it
// adds nothing to runtime cost. Hand-built in the app's dark palette — Satori
// only supports inline styles + flexbox, so every multi-child box sets display:flex.
export const alt = "NIM Stats — real-time status & reliability for free NVIDIA NIM endpoints";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#08090b";
const TEXT = "#eef0f3";
const SUBTLE = "#a4a9b4";
const MUTED = "#6b7080";
const INDIGO = "#6e7bff";
const GREEN = "#2fd98a";
const BORDER = "#232631";

const MODELS = ["Llama", "Mistral", "Gemma", "Qwen", "DeepSeek", "Phi"];

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
          backgroundImage:
            "radial-gradient(900px 520px at 10% -10%, rgba(110,123,255,0.20), transparent 60%), radial-gradient(700px 500px at 100% 110%, rgba(47,217,138,0.10), transparent 55%)",
          color: TEXT,
          fontFamily: "sans-serif",
        }}
      >
        {/* top: live badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: GREEN,
              boxShadow: `0 0 22px 5px rgba(47,217,138,0.65)`,
            }}
          />
          <div style={{ fontSize: 24, letterSpacing: 3, color: MUTED, textTransform: "uppercase" }}>
            Live · probed every 10 minutes
          </div>
        </div>

        {/* middle: title + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 108, fontWeight: 700, letterSpacing: -3, lineHeight: 1, color: TEXT }}>
            NIM Stats
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 36, lineHeight: 1.3, color: SUBTLE, maxWidth: 940 }}>
            Real-time status &amp; reliability for every free NVIDIA NIM endpoint — throughput, latency, uptime &amp; congestion.
          </div>
        </div>

        {/* bottom: model chips + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {MODELS.map((m) => (
              <div
                key={m}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                  backgroundColor: "rgba(255,255,255,0.02)",
                  fontSize: 24,
                  color: SUBTLE,
                }}
              >
                {m}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: INDIGO }}>
            nimstats.aathil.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
