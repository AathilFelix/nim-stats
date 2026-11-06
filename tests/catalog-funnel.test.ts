import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CatalogFunnel } from "@/components/dashboard/catalog-funnel"

// The funnel exists so a model's absence is explained: the dashboard only counts
// models that answer, while NVIDIA lists more. Regression target: the live site
// showed "22 endpoints" with no hint that 65 chat models were listed.
const render = (props: { listed: number; callable: number; healthy: number }) =>
  renderToStaticMarkup(
    createElement(CatalogFunnel, { catalog: { listed: props.listed, callable: props.callable }, healthy: props.healthy }),
  )

describe("CatalogFunnel", () => {
  it("shows listed → callable → healthy and explains what fell out", () => {
    const html = render({ listed: 65, callable: 22, healthy: 13 })
    expect(html).toContain("65")
    expect(html).toContain("listed by nvidia")
    expect(html).toContain("22")
    expect(html).toContain("13")
    expect(html).toContain("43 listed models don")
  })

  it("stays quiet about missing models when everything listed is callable", () => {
    expect(render({ listed: 22, callable: 22, healthy: 22 })).not.toContain("don’t answer")
  })

  it("singularises for exactly one", () => {
    expect(render({ listed: 23, callable: 22, healthy: 5 })).toContain("1 listed model doesn")
  })
})
