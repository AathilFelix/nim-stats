// Cron-only Worker: drives the NIM Stats pipeline by dispatching its GitHub
// Actions workflows directly. No HTTP surface (no `fetch` handler) — it can only
// be invoked by its own cron triggers, so there's nothing to abuse.
//
// Two schedules (see wrangler.jsonc):
//   */10 * * * *  → probe.yml        (collect fresh samples)
//   0 3 * * *     → maintenance.yml  (sync registry + prune old samples)
//
// The GitHub token is injected as the `GH_DISPATCH_TOKEN` Worker Secret
// (`wrangler secret put GH_DISPATCH_TOKEN`); it never appears in source.

const REPO = "AathilFelix/nim-stats";
const REF = "main";
const MAINTENANCE_CRON = "0 3 * * *";

async function dispatch(env, workflow) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_DISPATCH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "nimstats-cf-cron",
        "Content-Type": "application/json",
      },
      // `inputs.source` labels the run "… · cloudflare-worker" in the Actions list.
      body: JSON.stringify({ ref: REF, inputs: { source: "cloudflare-worker" } }),
    },
  );

  // GitHub returns 204 No Content on a successful dispatch.
  if (res.status !== 204) {
    const detail = await res.text().catch(() => "");
    throw new Error(`dispatch ${workflow} failed: ${res.status} ${detail.slice(0, 200)}`);
  }
}

export default {
  async scheduled(event, env, _ctx) {
    // The 03:00 tick runs maintenance; every other tick runs the probe.
    const workflow = event.cron === MAINTENANCE_CRON ? "maintenance.yml" : "probe.yml";
    try {
      await dispatch(env, workflow);
      console.log(`dispatched ${workflow} (cron ${event.cron})`);
    } catch (err) {
      // Re-throw so the failure shows as an errored invocation in Cron Triggers.
      console.error(`dispatch error (${workflow}):`, err.message);
      throw err;
    }
  },
};
