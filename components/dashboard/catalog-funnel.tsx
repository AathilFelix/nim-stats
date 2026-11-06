import type { CatalogFunnel as CatalogCounts } from "@/lib/dashboard-data";

interface Props {
  catalog: CatalogCounts;
  /** Endpoints currently in the healthy state. */
  healthy: number;
  className?: string;
}

/**
 * Listed → callable → healthy.
 *
 * The rest of the dashboard only counts models that answer, which reads as "the
 * fleet" when NVIDIA actually lists more. This shows the whole funnel, and what
 * fell out of it, so a model's absence is explained rather than silent.
 */
export function CatalogFunnel({ catalog, healthy, className = "" }: Props) {
  const { listed, callable } = catalog;
  const notCallable = Math.max(0, listed - callable);
  const steps = [
    { label: "Listed by NVIDIA", n: listed },
    { label: "Callable", n: callable },
    { label: "Healthy", n: healthy },
  ];

  return (
    <div className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-tertiary">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">→</span>}
            <span>
              <span className="font-mono tabular-nums text-text-secondary">{s.n}</span> {s.label.toLowerCase()}
            </span>
          </li>
        ))}
      </ol>
      {notCallable > 0 && (
        <p className="mt-1.5 body-xs text-text-tertiary">
          {notCallable} listed {notCallable === 1 ? "model doesn’t" : "models don’t"} answer chat requests (not
          deployed, retired, or preview-only) and {notCallable === 1 ? "isn’t" : "aren’t"} measured.
        </p>
      )}
    </div>
  );
}
