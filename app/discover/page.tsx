import { MODELS } from "@/components/dashboard/mock-data";
import type { NIMModel } from "@/components/dashboard/mock-data";
import { NavBar } from "@/components/navigation/nav-bar";
import { DiscoverView } from "@/components/discover/discover-view";
import { ProviderIntelligence } from "@/components/discover/provider-intelligence";
import { TrendAnalysis } from "@/components/discover/trend-analysis";
import { UseCaseRankings } from "@/components/discover/use-case-rankings";
import { ReliabilityHeatmap } from "@/components/discover/reliability-heatmap";
import { IncidentTimeline } from "@/components/discover/incident-timeline";
import { getAllIncidents } from "@/lib/operational-engine";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DiscoverPage() {
  const models = MODELS as NIMModel[];
  const enriched = models as unknown as Array<Record<string, unknown>>;
  const healthy = models.filter((m) => m.status === "healthy").length;
  const total = models.length;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <TooltipProvider delayDuration={0}>
        <main className="relative pt-16 min-h-screen">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Compact status strip */}
            <div className="flex items-center gap-5 px-4 py-2.5 rounded-lg border border-border bg-card">
            <Badge variant="outline" className="gap-1.5 border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
              Healthy
              <span className="tabular-nums font-bold">
                {healthy}/{total}
              </span>
            </Badge>
            <Separator orientation="vertical" className="h-3" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground font-mono">
              {total} endpoints
            </span>
          </div>

          <DiscoverView models={models} />
          <ProviderIntelligence models={models} />
          <TrendAnalysis models={models} />
          <UseCaseRankings models={models} />
          <ReliabilityHeatmap models={models} />
          <IncidentTimeline incidents={getAllIncidents(enriched)} />
          </div>
        </main>
      </TooltipProvider>
    </div>
  );
}
