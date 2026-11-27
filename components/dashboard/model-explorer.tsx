"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, Star, Download, X, SlidersHorizontal, Link as LinkIcon, Bookmark, Trash2,
} from "lucide-react";
import { TickMark } from "@/components/ui/tick-mark";
import { ModelTable } from "./model-table";
import { ModelDetailDrawer } from "./model-detail-drawer";
import { STATUS_WORD } from "./status-pill";
import type { NIMModel } from "./mock-data";
import { usePreferences } from "@/lib/client/preferences";
import type { FilterPreset } from "@/lib/client/preferences";
import { downloadCSV, downloadJSON, printReport, type ExportColumn } from "@/lib/client/export";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StatusFilter = "healthy" | "busy" | "jammed";
type SortMode = "best" | "status" | "name" | "ttft" | "throughput" | "uptime" | "reliability" | "congestion";

const DEFAULT_SORT: SortMode = "best";

const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: "best", label: "Best first" },
  { value: "status", label: "Status (worst first)" },
  { value: "name", label: "Name (A–Z)" },
  { value: "ttft", label: "Fastest first token" },
  { value: "throughput", label: "Highest throughput" },
  { value: "uptime", label: "Highest uptime" },
  { value: "reliability", label: "Highest reliability" },
  { value: "congestion", label: "Most congested" },
];

const STATUS_ORDER = { jammed: 0, busy: 1, healthy: 2 } as Record<string, number>;
const STATUSES: StatusFilter[] = ["healthy", "busy", "jammed"];

// Rows shown before "Show all". Enough for the answering endpoints on a normal
// day; the footer always says how many are hidden.
const PAGE_ROWS = 12;

// An unmeasured first token (0) sorts after every measured one.
const ttftRank = (v: number) => (v > 0 ? v : Number.POSITIVE_INFINITY);

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

function readParams(sp: URLSearchParams) {
  const sort = sp.get("sort") as SortMode | null;
  return {
    query: sp.get("q") ?? "",
    provider: sp.get("p") ?? "all",
    statuses: new Set((sp.get("s") ?? "").split(",").filter(Boolean) as StatusFilter[]),
    favoritesOnly: sp.get("fav") === "1",
    sort: sort && SORT_MODES.some((m) => m.value === sort) ? sort : DEFAULT_SORT,
  };
}

function buildUrl(
  query: string, provider: string, statuses: Set<StatusFilter>,
  favoritesOnly: boolean, sort: SortMode,
): string {
  const sp = new URLSearchParams();
  if (query) sp.set("q", query);
  if (provider !== "all") sp.set("p", provider);
  if (statuses.size) sp.set("s", [...statuses].join(","));
  if (favoritesOnly) sp.set("fav", "1");
  if (sort !== DEFAULT_SORT) sp.set("sort", sort);
  const str = sp.toString();
  return str ? `${window.location.pathname}?${str}` : window.location.pathname;
}

/**
 * Same box as the loaded panel (header, toolbar, rows, footer) so the page does
 * not jump when the explorer hydrates. Only the rows are placeholders.
 */
export function ModelExplorerSkeleton() {
  return (
    <div className="panel" aria-busy="true">
      <div className="hdiv">
        <h2 className="heading-md">Endpoints</h2>
      </div>
      {/* Placeholders are static and paint only after 120ms (`.skel`), so a fast
          response shows none. */}
      <div className="min-h-[891px] max-md:min-h-[1218px]">
        {Array.from({ length: PAGE_ROWS + 2 }, (_, i) => (
          <div key={i} className="skel flex h-[72px] items-center border-b border-border-subtle px-4 md:h-14 md:px-6">
            <span className="h-3 w-40 rounded-full bg-chip" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModelExplorer({ models }: { models: NIMModel[] }) {
  const { prefs, toggleFavorite, savePreset, deletePreset } = usePreferences();
  const searchParams = useSearchParams();
  const initial = useMemo(() => readParams(searchParams), [searchParams]);

  const [query, setQuery] = useState(initial.query);
  const [provider, setProvider] = useState<string>(initial.provider);
  const [statuses, setStatuses] = useState<Set<StatusFilter>>(initial.statuses);
  const [favoritesOnly, setFavoritesOnly] = useState(initial.favoritesOnly);
  const [sort, setSort] = useState<SortMode>(initial.sort);
  const [selected, setSelected] = useState<NIMModel | null>(null);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [advanced, setAdvanced] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync filter state into URL (shallow — no server re-fetch).
  useEffect(() => {
    const url = buildUrl(query, provider, statuses, favoritesOnly, sort);
    window.history.replaceState(null, "", url);
  }, [query, provider, statuses, favoritesOnly, sort]);

  // "/" focuses search input unless already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const providers = useMemo(
    () => Array.from(new Set(models.map((m) => m.provider))).sort(),
    [models],
  );

  const favorites = useMemo(() => new Set(prefs.favorites), [prefs.favorites]);

  const counts = useMemo(() => {
    const c = { healthy: 0, busy: 0, jammed: 0 } as Record<StatusFilter, number>;
    for (const m of models) if (m.status in c) c[m.status as StatusFilter]++;
    return c;
  }, [models]);

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
        case "ttft": return ttftRank(a.ttft) - ttftRank(b.ttft);
        case "throughput": return b.throughput - a.throughput;
        case "uptime": return b.uptime - a.uptime;
        case "reliability": return b.reliability - a.reliability;
        case "congestion": return b.congestion - a.congestion;
        case "status":
          return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || a.name.localeCompare(b.name);
        case "best":
        default:
          // Answering first, then the quickest first token (unmeasured last),
          // then throughput.
          return (
            (STATUS_ORDER[b.status] - STATUS_ORDER[a.status]) ||
            (ttftRank(a.ttft) - ttftRank(b.ttft)) ||
            (b.throughput - a.throughput) ||
            a.name.localeCompare(b.name)
          );
      }
    });
    return list;
  }, [models, query, provider, statuses, favoritesOnly, favorites, sort]);

  const visible = showAll ? filtered : filtered.slice(0, PAGE_ROWS);

  const toggleStatus = (s: StatusFilter) => {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const activeFilters =
    (query ? 1 : 0) + (provider !== "all" ? 1 : 0) + statuses.size +
    (favoritesOnly ? 1 : 0);

  const clearAll = () => {
    setQuery(""); setProvider("all"); setStatuses(new Set());
    setFavoritesOnly(false);
  };

  const copyLink = () => {
    const done = (state: "copied" | "failed") => {
      setCopied(state);
      setTimeout(() => setCopied("idle"), 2000);
    };
    // The Clipboard API is missing on insecure origins and rejects on denied
    // permission; either way the button says so instead of failing silently.
    if (!navigator.clipboard) return done("failed");
    navigator.clipboard.writeText(window.location.href).then(() => done("copied"), () => done("failed"));
  };

  const handleSavePreset = (name: string) => {
    savePreset({ name, query, provider, statuses: [...statuses], favoritesOnly, sort });
  };

  const applyPreset = (preset: FilterPreset) => {
    setQuery(preset.query);
    setProvider(preset.provider);
    setStatuses(new Set(preset.statuses as StatusFilter[]));
    setFavoritesOnly(preset.favoritesOnly);
    setSort((SORT_MODES.some((m) => m.value === preset.sort) ? preset.sort : DEFAULT_SORT) as SortMode);
  };

  const hidden = filtered.length - visible.length;

  return (
    // `.explorer-in`: the loaded content fades in over a panel whose chrome stays put.
    <div className="panel explorer-in">
      <div className="hdiv">
        <h2 className="heading-md">Endpoints</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyLink}
            title="Copy shareable link to current filters"
            className="btn-quiet max-sm:w-9 max-sm:justify-center max-sm:px-0"
          >
            {/* Icon and label each stack every state in one cell: the button keeps
                its width and the header does not reflow (R10). */}
            <span className="lbl-stack">
              <span className="lbl" data-on={copied === "idle"} aria-hidden="true"><LinkIcon aria-hidden="true" /></span>
              <span className="lbl" data-on={copied === "copied"} aria-hidden="true"><TickMark /></span>
              <span className="lbl" data-on={copied === "failed"} aria-hidden="true"><X aria-hidden="true" /></span>
            </span>
            <span className="lbl-stack max-sm:sr-only">
              <span className="lbl" data-on={copied === "idle"} aria-hidden={copied !== "idle"}>Share</span>
              <span className="lbl" data-on={copied === "copied"} aria-hidden={copied !== "copied"}>Copied</span>
              <span className="lbl" data-on={copied === "failed"} aria-hidden={copied !== "failed"}>Failed</span>
            </span>
          </button>
          <span role="status" className="sr-only">
            {copied === "copied" ? "Link copied" : copied === "failed" ? "Couldn’t copy the link" : ""}
          </span>
          {/* Always rendered (disabled until a filter is active) so the header
              does not reflow when a filter is toggled. */}
          <SavePresetButton onSave={handleSavePreset} disabled={activeFilters === 0} />
          <ExportMenu rows={filtered} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filter by state" className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-outline"
              aria-pressed={statuses.size === 0}
              onClick={() => setStatuses(new Set())}
            >
              All <span className="n">{models.length}</span>
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn-outline"
                aria-pressed={statuses.has(s)}
                onClick={() => toggleStatus(s)}
              >
                {STATUS_WORD[s]} <span className="n">{counts[s]}</span>
              </button>
            ))}
          </div>

          <label className="field max-md:w-full md:ml-auto md:min-w-[320px]">
            <Search className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models or providers"
              aria-label="Search models"
            />
            <kbd className="kbd" aria-hidden="true">/</kbd>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger aria-label="Sort models" className="min-w-[152px]">
              <span className="font-normal text-text-muted">Sort</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_MODES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger aria-label="Filter by provider" className="min-w-[144px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            title="Show only pinned models"
          >
            <Star className="h-4 w-4" fill={favoritesOnly ? "currentColor" : "none"} aria-hidden="true" />
            Watchlist
            <span className="n">{prefs.favorites.length}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline max-md:hidden"
            onClick={() => setAdvanced((v) => !v)}
            aria-pressed={advanced}
            title="Add congestion, session, tail latency and routing columns"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            All metrics
          </button>
        </div>

        {prefs.filterPresets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="body-sm text-text-muted">Presets</span>
            {prefs.filterPresets.map((p) => (
              <span key={p.id} className="pill gap-1 pr-1">
                <button type="button" onClick={() => applyPreset(p)} className="rounded-xs">
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => deletePreset(p.id)}
                  className="grid h-5 w-5 place-items-center rounded-full text-text-muted hover:bg-chip hover:text-text-primary"
                  aria-label={`Delete preset ${p.name}`}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <ModelTable
        models={visible}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSelect={setSelected}
        presorted
        advanced={advanced}
        reserveRows={Math.min(PAGE_ROWS, models.length)}
      />

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border-subtle px-4 py-3 body-sm text-text-muted md:px-6 md:py-4" aria-live="polite">
        <span>
          {hidden > 0
            ? `Showing ${visible.length} of ${filtered.length} ${filtered.length === models.length ? "" : "matching "}endpoints.`
            : `${filtered.length} of ${models.length} endpoints.`}
        </span>
        {hidden > 0 && (
          <button type="button" onClick={() => setShowAll(true)} className="text-text-primary underline underline-offset-[3px]">
            Show all
          </button>
        )}
        {showAll && filtered.length > PAGE_ROWS && (
          <button type="button" onClick={() => setShowAll(false)} className="text-text-primary underline underline-offset-[3px]">
            Show fewer
          </button>
        )}
        {activeFilters > 0 && (
          <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 text-text-primary underline underline-offset-[3px]">
            <X className="h-3 w-3" aria-hidden="true" /> Clear filters
          </button>
        )}
      </p>

      <ModelDetailDrawer
        model={selected}
        onClose={() => setSelected(null)}
        isFavorite={selected ? favorites.has(selected.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}

/** Closes on outside mousedown, Tab-out and Escape (returning focus to the trigger). */
function usePopover(open: boolean, close: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      ref.current?.querySelector<HTMLElement>("[data-popover-trigger]")?.focus();
    };
    // Tabbing out of the popover closes it. relatedTarget is null for a click on
    // non-focusable padding inside it, which must not count as leaving.
    const root = ref.current;
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && root && !root.contains(next)) close();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    root?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [open, close, ref]);
}

function SavePresetButton({ onSave, disabled }: { onSave: (name: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  // Never show the popover when disabled (e.g. filters were just cleared).
  const showPopover = open && !disabled;
  usePopover(open, () => setOpen(false), ref);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setName("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-popover-trigger
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={showPopover}
        aria-haspopup="dialog"
        title={disabled ? "Apply a filter to save it as a preset" : "Save current filters as a preset"}
        className="btn-quiet max-sm:w-9 max-sm:justify-center max-sm:px-0"
      >
        <Bookmark aria-hidden="true" />
        <span className="max-sm:sr-only">Save</span>
      </button>
      {showPopover && (
        <div role="dialog" aria-label="Save filter preset" className="menu absolute right-0 z-30 mt-1 w-64 p-3">
          <label htmlFor="preset-name" className="mb-2 block body-sm text-text-muted">Name this filter preset</label>
          <div className="field">
            <input
              id="preset-name"
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Meta, answering, fast"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="btn btn-outline mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save preset
          </button>
        </div>
      )}
    </div>
  );
}

function ExportMenu({ rows }: { rows: NIMModel[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  usePopover(open, () => setOpen(false), ref);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-popover-trigger
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="btn-quiet max-sm:w-9 max-sm:justify-center max-sm:px-0"
      >
        <Download aria-hidden="true" />
        <span className="max-sm:sr-only">Export</span>
      </button>
      {open && (
        <div className="menu absolute right-0 z-30 mt-1 w-48 overflow-hidden py-1">
          <button
            type="button" className="menu-item"
            onClick={() => { downloadCSV("nim-stats-fleet", rows, EXPORT_COLUMNS); setOpen(false); }}
          >
            Download CSV
            <span className="metric-xs ml-auto text-text-muted">{rows.length}</span>
          </button>
          <button
            type="button" className="menu-item"
            onClick={() => { downloadJSON("nim-stats-fleet", rows); setOpen(false); }}
          >
            Download JSON
          </button>
          <button
            type="button" className="menu-item"
            onClick={() => { printReport(); setOpen(false); }}
          >
            Print or save PDF
          </button>
        </div>
      )}
    </div>
  );
}
