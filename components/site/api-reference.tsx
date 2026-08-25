import Link from "next/link";

import { NavBar } from "@/components/navigation/nav-bar";
import { SiteFooter } from "@/components/site/site-footer";
import type { ApiReference } from "@/lib/api/reference";

/**
 * The API reference, rendered from the OpenAPI document rather than authored
 * separately — the page cannot describe an endpoint the spec does not declare.
 * Same instrument-panel vocabulary as the status and trust pages.
 */
export function ApiReferenceView({ reference }: { reference: ApiReference }) {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <NavBar />

      <main style={{ paddingTop: "calc(3.5rem + var(--safe-top))" }}>
        <header className="border-b border-border-subtle">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="status-led status-led--healthy" style={{ width: 6, height: 6 }} aria-hidden="true" />
              <span className="label-sm text-text-tertiary">NIM Stats · v{reference.version}</span>
            </div>
            <h1 className="heading-lg text-text-primary">{reference.title}</h1>
            <p className="mt-2 max-w-2xl body-sm text-text-secondary">{reference.summary}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="/openapi.json"
                className="inline-flex items-center gap-1.5 rounded-md border border-border-base bg-surface-card px-3 py-1.5 label-xs text-text-secondary transition-colors hover:bg-surface-recessed hover:text-text-primary"
              >
                openapi.json
              </a>
              <a
                href={reference.externalDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border-base bg-surface-card px-3 py-1.5 label-xs text-text-secondary transition-colors hover:bg-surface-recessed hover:text-text-primary"
              >
                Source &amp; self-hosting ↗
              </a>
              <Link
                href="/llms.txt"
                className="inline-flex items-center gap-1.5 rounded-md border border-border-base bg-surface-card px-3 py-1.5 label-xs text-text-secondary transition-colors hover:bg-surface-recessed hover:text-text-primary"
              >
                llms.txt
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
          <section>
            <h2 className="section-label mb-3">Overview</h2>
            <div className="space-y-3 rounded-lg border border-border-base bg-surface-card px-5 py-5">
              {reference.description
                .split("\n")
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className="max-w-[68ch] body-sm leading-relaxed text-text-secondary">
                    {paragraph}
                  </p>
                ))}
              <p className="max-w-[68ch] body-sm leading-relaxed text-text-tertiary">
                Base URL{" "}
                <code className="rounded bg-surface-recessed px-1.5 py-0.5 font-mono text-text-secondary">
                  {reference.serverUrl}
                </code>
              </p>
            </div>
          </section>

          <section>
            <h2 className="section-label mb-3">Endpoints</h2>
            <div className="space-y-4">
              {reference.operations.map((op) => (
                <article key={op.operationId} className="rounded-lg border border-border-base bg-surface-card">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border-subtle px-5 py-3">
                    <span className="metric-xs rounded-sm border border-border-base px-1.5 py-0.5 text-status-healthy">
                      {op.method}
                    </span>
                    <code className="metric-sm text-text-primary">{op.path}</code>
                    <span className="ml-auto label-xs text-text-quaternary">{op.operationId}</span>
                  </div>

                  <div className="space-y-4 px-5 py-4">
                    <p className="max-w-[68ch] body-sm leading-relaxed text-text-secondary">{op.description}</p>

                    {op.parameters.length > 0 && (
                      <div>
                        <h3 className="label-xs mb-2 text-text-tertiary">Query parameters</h3>
                        <dl className="space-y-2">
                          {op.parameters.map((p) => (
                            <div key={p.name} className="rounded-sm border border-border-subtle bg-surface-recessed px-3 py-2">
                              <dt className="flex flex-wrap items-baseline gap-2">
                                <code className="metric-xs text-text-primary">{p.name}</code>
                                <span className="label-xs text-text-quaternary">{p.type}</span>
                                <span className="label-xs text-text-quaternary">
                                  {p.required ? "required" : "optional"}
                                </span>
                                {p.default !== undefined && (
                                  <span className="label-xs text-text-quaternary">default {p.default}</span>
                                )}
                              </dt>
                              <dd className="mt-1 body-xs text-text-tertiary">
                                {p.description}
                                {p.enum && (
                                  <>
                                    {" "}
                                    One of{" "}
                                    {p.enum.map((v, i) => (
                                      <span key={v}>
                                        {i > 0 && ", "}
                                        <code className="font-mono text-text-secondary">{v}</code>
                                      </span>
                                    ))}
                                    .
                                  </>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}

                    <div>
                      <h3 className="label-xs mb-2 text-text-tertiary">Responses</h3>
                      <ul className="space-y-1">
                        {op.responses.map((r) => (
                          <li key={r.status} className="flex flex-wrap items-baseline gap-2 body-xs text-text-tertiary">
                            <code className="metric-xs text-text-secondary">{r.status}</code>
                            <span>{r.description}</span>
                            {r.schema && <span className="label-xs text-text-quaternary">{r.schema}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="label-xs mb-2 text-text-tertiary">Example</h3>
                      <pre className="overflow-x-auto rounded-sm border border-border-subtle bg-surface-recessed px-3 py-2 font-mono text-[0.75rem] text-text-secondary">
                        <code>{`curl -s ${reference.serverUrl}${op.path}${
                          op.parameters.length > 0
                            ? `?${op.parameters[0].name}=${op.parameters[0].default ?? op.parameters[0].enum?.[0] ?? ""}`
                            : ""
                        }`}</code>
                      </pre>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-label mb-3">Schemas</h2>
            <div className="space-y-4">
              {reference.schemas.map((schema) => (
                <article key={schema.name} className="rounded-lg border border-border-base bg-surface-card">
                  <div className="border-b border-border-subtle px-5 py-3">
                    <h3 className="metric-sm text-text-primary">{schema.name}</h3>
                    <p className="mt-1 body-xs text-text-tertiary">{schema.description}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          <th scope="col" className="label-xs px-5 py-2 text-text-quaternary">Field</th>
                          <th scope="col" className="label-xs px-3 py-2 text-text-quaternary">Type</th>
                          <th scope="col" className="label-xs px-3 py-2 text-text-quaternary">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schema.fields.map((f) => (
                          <tr key={f.name} className="border-b border-border-subtle last:border-0">
                            <td className="px-5 py-2 align-top">
                              <code className="metric-xs text-text-secondary">{f.name}</code>
                              {!f.required && <span className="ml-1.5 label-xs text-text-quaternary">optional</span>}
                            </td>
                            <td className="px-3 py-2 align-top label-xs text-text-quaternary">{f.type}</td>
                            <td className="px-3 py-2 align-top body-xs text-text-tertiary">{f.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
