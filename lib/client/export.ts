"use client";

// Client-side report export: turn the model table into CSV / JSON and trigger a
// browser download. Print-to-PDF is delegated to window.print (the print
// stylesheet in globals.css handles layout).

export interface ExportColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string | number;
}

function escapeCsv(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const head = columns.map((c) => escapeCsv(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escapeCsv(c.value(r))).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the navigation has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function downloadCSV<T>(
  baseName: string,
  rows: T[],
  columns: ExportColumn<T>[],
) {
  const csv = toCSV(rows, columns);
  triggerDownload(`${baseName}-${stamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

export function downloadJSON(baseName: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  triggerDownload(
    `${baseName}-${stamp()}.json`,
    new Blob([json], { type: "application/json" }),
  );
}

export function printReport() {
  if (typeof window !== "undefined") window.print();
}
