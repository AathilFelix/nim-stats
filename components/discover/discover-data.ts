import { type NIMModel } from "../dashboard/mock-data";

export type DiscoverCategory =
  | "fastest"
  | "most-reliable"
  | "least-congested"
  | "best-for-coding"
  | "trending-degradation"
  | "emerging-standouts";

export interface DiscoverCategoryDef {
  id: DiscoverCategory;
  label: string;
  sort: (models: NIMModel[]) => NIMModel[];
}

export const CATEGORIES: DiscoverCategoryDef[] = [
  {
    id: "fastest",
    label: "Fastest Right Now",
    sort: (models) =>
      [...models].sort((a, b) => b.throughput - a.throughput),
  },
  {
    id: "most-reliable",
    label: "Most Reliable",
    sort: (models) =>
      [...models].sort((a, b) => b.reliability - a.reliability),
  },
  {
    id: "least-congested",
    label: "Least Congested",
    sort: (models) =>
      [...models].sort((a, b) => a.congestion - b.congestion),
  },
  {
    id: "best-for-coding",
    label: "Best for Coding",
    sort: (models) =>
      [...models].sort((a, b) => codingScore(b) - codingScore(a)),
  },
  {
    id: "trending-degradation",
    label: "Trending Degradation",
    sort: (models) =>
      [...models].sort((a, b) => degradationTrend(b) - degradationTrend(a)),
  },
  {
    id: "emerging-standouts",
    label: "Emerging Standouts",
    sort: (models) => {
      const scored = models.map((m) => ({
        model: m,
        score: standoutScore(m),
      }));
      return scored
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.model);
    },
  },
];

export function getRankedModels(
  models: NIMModel[],
  categoryId: DiscoverCategoryDef["id"],
): NIMModel[] {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return [...models].sort((a, b) => a.name.localeCompare(b.name));
  return category.sort(models);
}

export function getCategoryLabel(
  categoryId: DiscoverCategoryDef["id"],
): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

function codingScore(m: NIMModel): number {
  const latencyPenalty = Math.max(0, (m.ttft - 100) / 1000);
  const reliabilityWeight = m.reliability / 100;
  const throughputWeight = m.throughput / 150;
  return reliabilityWeight * 0.5 + throughputWeight * 0.3 - latencyPenalty * 0.2;
}

function degradationTrend(m: NIMModel): number {
  const recent = m.reliabilityHistory.slice(-6);
  if (recent.length < 2) return 0;
  const first = recent[0].score;
  const last = recent[recent.length - 1].score;
  return first - last;
}

function standoutScore(m: NIMModel): number {
  const throughputBonus = m.throughput > 90 ? 20 : 0;
  const congestionBonus = m.congestion < 25 ? 15 : m.congestion < 40 ? 5 : 0;
  const reliabilityBonus =
    m.reliability >= 97 && m.congestion < 40 && m.throughput > 70 ? 10 : 0;
  const busyPenalty = m.status === "busy" ? -30 : m.status === "jammed" ? -50 : 0;
  return throughputBonus + congestionBonus + reliabilityBonus + busyPenalty;
}

export function countByProvider(models: NIMModel[]): Map<string, NIMModel[]> {
  const map = new Map<string, NIMModel[]>();
  for (const m of models) {
    const list = map.get(m.provider) ?? [];
    list.push(m);
    map.set(m.provider, list);
  }
  return map;
}

export function providerStats(
  models: NIMModel[],
  providerName: string,
) {
  const group = models.filter((m) => m.provider === providerName);
  const avgThroughput =
    group.reduce((acc, m) => acc + m.throughput, 0) / group.length;
  const avgReliability =
    group.reduce((acc, m) => acc + m.reliability, 0) / group.length;
  const jammed = group.filter((m) => m.status === "jammed").length;
  const busy = group.filter((m) => m.status === "busy").length;
  return {
    count: group.length,
    avgThroughput: Math.round(avgThroughput * 10) / 10,
    avgReliability: Math.round(avgReliability * 10) / 10,
    jammed,
    busy,
    models: group,
  };
}

export function aggregateFleetStats(models: NIMModel[]) {
  const avgThroughput = Math.round(
    models.reduce((acc, m) => acc + m.throughput, 0) / models.length,
  );
  const avgReliability = (
    models.reduce((acc, m) => acc + m.reliability, 0) / models.length
  ).toFixed(1);
  const healthy = models.filter((m) => m.status === "healthy").length;
  const busy = models.filter((m) => m.status === "busy").length;
  const jammed = models.filter((m) => m.status === "jammed").length;
  return { avgThroughput, avgReliability, healthy, busy, jammed, total: models.length };
}
