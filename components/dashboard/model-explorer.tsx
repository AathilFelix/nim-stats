"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Star, Download, X, SlidersHorizontal } from "lucide-react";
import { ModelTable } from "./model-table";
import { ModelDetailDrawer } from "./model-detail-drawer";
import type { NIMModel } from "./mock-data";
import { usePreferences } from "@/lib/client/preferences";
import { downloadCSV, downloadJSON, printReport, type ExportColumn } from "@/lib/client/export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type StatusFilter = "healthy" | "busy" | "jammed";
type SortMode = "status" | "name" | "ttft" | "throughput" | "uptime" | "reliability" | "congestion";

const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: "status", label: "Status (worst first)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "ttft", label: "Fastest TTFT" },
  { value: "throughput", label: "Highest throughput" },
  { value: "uptime", label: "Highest uptime" },
  { value: "reliability", label: "Highest reliability" },
  { value: "congestion", label: "Most congested" },
];

const STATUS_ORDER = { jammed: 0, busy: 1, healthy: 2 } as Record<string, number>;

const EXPORT_COLUMNS: ExportColumn<NIMModel>[] = [
  { key: "name", header: "Model", value: (m) => m.name },
  { key: "provider", header: "Provider", value: (m) => m.provider },
  { key: "status", header: "Status", value: (m) => m.status },
  { key: "ttft", header: "TTFT (ms)", value: (m) => m.ttft },
  { key: "throughput", header: "Throughput (tok/s)", value: (m) => m.throughput },
  { key: "congestion", header: "Congestion (%)", value: (m) => m.congestion },
  { key: "uptime", header: "Uptime (%)", value: (m) => m.uptime },
  { key: "reliability", header: "Reliability (%)", value: (m) => m.reliability },
  { key: "sessionRel", header: "Session reliability", value: (m) => (m.sessionReliability as { score: number })?.score ?? "" },
  { key: "timeout", header: "Timeout rate (%)", value: (m) => m.timeoutRate },
  { key: "p95", header: "P95 (ms)", value: (m) => m.p95Latency },
  { key: "p99", header: "P99 (ms)", value: (m) => m.p99Latency },
  { key: "queue", header: "Queue pressure", value: (m) => m.queuePressure },
  { key: "routing", header: "Routing confidence", value: (m) => m.routingConfidence },
  { key: "checked", header: "Last checked", value: (m) => new Date(m.lastChecked).toISOString() },
];

export function ModelExplorer({ models }: { models: NIMModel[] }) {
  const { prefs, toggleFavorite } = usePreferences();
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<string>("all");
  const [statuses, setStatuses] = useState<Set<StatusFilter>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortMode>("status");
  const [selected, setSelected] = useState<NIMModel | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search (unless already typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const providers = useMemo(
    () => Array.from(new Set(models.map((m) => m.provider))).sort(),
    [models],
  );

  const favorites = useMemo(() => new Set(prefs.favorites), [prefs.favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = models.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.provider.toLowerCase().includes(q)) return false;
      if (provider !== "all" && m.provider !== provider) return false;
      if (statuses.size > 0 && !statuses.has(m.status as StatusFilter)) return false;
      if (favoritesOnly && !favorites.has(m.id)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name": return a.name.localeCompare(b.name);
        case "ttft": return a.ttft - b.ttft;
        case "throughput": return b.throughput - a.throughput;
        case "uptime": return b.uptime - a.uptime;
        case "reliability": return b.reliability - a.reliability;
        case "congestion": return b.congestion - a.congestion;
        case "status":
        default:
          return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [models, query, provider, statuses, favoritesOnly, favorites, sort]);

  const toggleStatus = (s: StatusFilter) => {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const activeFilters = (query ? 1 : 0) + (provider !== "all" ? 1 : 0) + statuses.size + (favoritesOnly ? 1 : 0);
  const clearAll = () => {
    setQuery("");
    setProvider("all");
    setStatuses(new Set());
    setFavoritesOnly(false);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-quaternary" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models or providers…"
            aria-label="Search models"
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-recessed pl-9 pr-16 body-sm text-text-primary placeholder:text-text-quaternary focus:border-border-strong focus:outline-none"
          />
          <kbd className="kbd pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">/</kbd>
        </div>

        {/* Provider */}
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger aria-label="Filter by provider" className="min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status chips */}
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-recessed p-0.5">
          {(["healthy", "busy", "jammed"] as StatusFilter[]).map((s) => {
            const on = statuses.has(s);
            const color = s === "healthy" ? "var(--status-healthy)" : s === "busy" ? "var(--status-warn)" : "var(--status-critical)";
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 label-xs capitalize transition-colors",
                  on ? "bg-surface-elevated text-text-primary" : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                {s}
              </button>
            );
          })}
        </div>

        {/* Favorites only */}
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          aria-pressed={favoritesOnly}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border px-3 label-xs transition-colors",
            favoritesOnly
              ? "border-status-warn/40 bg-status-warn/10 text-status-warn"
              : "border-border-subtle bg-surface-recessed text-text-tertiary hover:text-text-secondary",
          )}
          title="Show only pinned models"
        >
          <Star className="h-3.5 w-3.5" fill={favoritesOnly ? "currentColor" : "none"} />
          Watchlist
          {prefs.favorites.length > 0 && <span className="metric-xs opacity-70">{prefs.favorites.length}</span>}
        </button>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger aria-label="Sort models" className="min-w-[150px]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-text-quaternary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_MODES.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export */}
        <ExportMenu rows={filtered} />
      </div>

      {/* Active filter summary */}
      <div className="flex items-center justify-between gap-2">
        <p className="metric-xs text-text-tertiary">
          {filtered.length} of {models.length} models
          {activeFilters > 0 && <span className="text-text-quaternary"> · {activeFilters} filter{activeFilters > 1 ? "s" : ""} active</span>}
        </p>
        {activeFilters > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 label-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <ModelTable
        models={filtered}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSelect={setSelected}
        presorted
      />

      <ModelDetailDrawer
        model={selected}
        onClose={() => setSelected(null)}
        isFavorite={selected ? favorites.has(selected.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

function ExportMenu({ rows }: { rows: NIMModel[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2 px-3 py-2 body-sm text-text-secondary hover:bg-surface-recessed hover:text-text-primary transition-colors text-left";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-recessed px-3 label-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-border-base bg-surface-overlay py-1 shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
        >
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => { downloadCSV("nim-stats-fleet", rows, EXPORT_COLUMNS); setOpen(false); }}
          >
            Download CSV
            <span className="ml-auto metric-xs text-text-quaternary">{rows.length}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => { downloadJSON("nim-stats-fleet", rows); setOpen(false); }}
          >
            Download JSON
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => { printReport(); setOpen(false); }}
          >
            Print / Save PDF
          </button>
        </div>
      )}
    </div>
  );
}
