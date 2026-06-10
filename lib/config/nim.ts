import { env } from "./env"

const API_URL = env.NIM_API_URL.replace(/\/$/, "")
const apiKey = process.env.NIM_API_KEY ?? ""

export async function fetchModels() {
  const res = await fetch(`${API_URL}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<{ data: any[] }>
}

// Streamed probe so we can measure real time-to-first-token and decode
// throughput. The caller owns the AbortSignal so the timeout spans the full
// stream read (clearing it when headers arrive would leave the body unguarded).
export async function probeModel(model: string, signal: AbortSignal): Promise<Response> {
  return fetch(`${API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "In one short sentence, what is throughput?" }],
      max_tokens: 32,
      temperature: 0,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal,
  })
}
