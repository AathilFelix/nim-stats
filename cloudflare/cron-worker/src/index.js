// Cron-only Worker: dispatches the NIM Stats probe by triggering its GitHub
// Actions workflow directly. No HTTP surface (no `fetch` handler) — it can only
// be invoked by its own cron trigger, so there's nothing to abuse.
//
// The GitHub token is injected as the `GH_DISPATCH_TOKEN` Worker Secret
// (`wrangler secret put GH_DISPATCH_TOKEN`); it never appears in source.

const REPO = "AathilFelix/nim-stats";
const WORKFLOW = "probe.yml";
const REF = "main";

async function dispatchProbe(env) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "nimstats-cf-cron",
        "Content-Type": "application/json",
      },
      // `inputs.source` labels the run "probe · cloudflare-worker" in the Actions
      // list, distinct from manual / schedule-fallback runs.
      body: JSON.stringify({ ref: REF, inputs: { source: "cloudflare-worker" } }),
    },
  );

  // GitHub returns 204 No Content on a successful dispatch.
  if (res.status !== 204) {
    const detail = await res.text().catch(() => "");
    throw new Error(`GitHub dispatch failed: ${res.status} ${detail.slice(0, 200)}`);
  }
}

export default {
  async scheduled(event, env, _ctx) {
    try {
      await dispatchProbe(env);
      console.log(`dispatched probe (cron ${event.cron})`);
    } catch (err) {
      // Re-throw so the failure shows as an errored invocation in Cron Triggers
      // metrics rather than silently passing.
      console.error("probe dispatch error:", err.message);
      throw err;
    }
  },
};
