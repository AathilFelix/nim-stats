import { MODELS } from "@/components/dashboard/mock-data";
import type { NIMModel } from "@/components/dashboard/mock-data";
import { NavBar } from "@/components/navigation/nav-bar";
import { Lateral } from "@/components/layout/lateral";
import { VerdictBanner } from "@/components/dashboard/verdict-banner";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { ModelTable } from "@/components/dashboard/model-table";
import { ReliabilitySection } from "@/components/dashboard/reliability-section";
import { UptimeTrendChart } from "@/components/dashboard/uptime-trend-chart";

export default function Home() {
  const models = MODELS as NIMModel[];
  const now = new Date();

  return (
    <div className="min-h-screen bg-black">
      {/* Background atmosphere */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -20%, #10b98108, transparent)" }}
      />

      {/* Navigation */}
      <NavBar lastUpdate={now} />

      {/* Main content */}
      <main className="relative pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">
            {/* Sidebar */}
            <Lateral models={models} className="xl:sticky xl:top-16 xl:self-start" />

            {/* Main column */}
            <div className="space-y-6 min-w-0">
              {/* Section label */}
              <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">
                Command
              </p>

              {/* Verdict first */}
              <VerdictBanner models={models} />

              {/* Fleet health summary */}
              <QuickStats models={models} />

              {/* Fleet table */}
              <section>
                <p className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium mb-3">
                  Model Fleet
                </p>
                <ModelTable models={models} />
              </section>

              {/* Deeper intelligence */}
              <ReliabilitySection models={models} />
              <UptimeTrendChart />
            </div>
          </div>
        </div>

        <footer className="border-t border-zinc-800/40 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-[11px] text-zinc-700">Mock data — not live endpoint status</p>
            <p className="text-[11px] text-zinc-700 font-mono tabular-nums">Refreshes every 30s</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
