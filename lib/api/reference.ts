// Flattens the OpenAPI document into a shape both renderers can walk.
//
// The /api page (HTML) and its Markdown representation are two views of the
// same spec — this is what they share, so neither can describe an endpoint the
// document does not declare.

type AnyRecord = Record<string, unknown>

export type ReferenceParameter = {
  name: string
  in: string
  required: boolean
  description: string
  type: string
  enum?: string[]
  default?: string
}

export type ReferenceResponse = {
  status: string
  description: string
  /** Schema name from components/schemas, when the response has one. */
  schema?: string
}

export type ReferenceOperation = {
  method: string
  path: string
  operationId: string
  summary: string
  description: string
  parameters: ReferenceParameter[]
  responses: ReferenceResponse[]
}

export type ReferenceSchema = {
  name: string
  description: string
  fields: Array<{ name: string; type: string; required: boolean; description: string }>
}

export type ApiReference = {
  title: string
  version: string
  summary: string
  description: string
  serverUrl: string
  externalDocsUrl: string
  operations: ReferenceOperation[]
  schemas: ReferenceSchema[]
}

const METHODS = ["get", "post", "put", "patch", "delete"] as const

function refName(node: unknown): string | undefined {
  const ref = (node as AnyRecord | undefined)?.$ref
  return typeof ref === "string" ? ref.split("/").pop() : undefined
}

/** Renders an OpenAPI `type` — which may be a union array in 3.1 — as prose. */
export function typeLabel(schema: unknown): string {
  const s = schema as AnyRecord | undefined
  if (!s) return "unknown"
  const named = refName(s)
  if (named) return named
  const raw = s.type
  const base = Array.isArray(raw) ? raw.join(" | ") : typeof raw === "string" ? raw : "unknown"
  if (base === "array") {
    const items = s.items
    return `${typeLabel(items)}[]`
  }
  if (typeof s.const === "string") return `"${s.const}"`
  return base
}

export function buildApiReference(doc: AnyRecord): ApiReference {
  const info = (doc.info ?? {}) as AnyRecord
  const servers = (doc.servers ?? []) as AnyRecord[]
  const paths = (doc.paths ?? {}) as Record<string, AnyRecord>
  const schemas = ((doc.components as AnyRecord | undefined)?.schemas ?? {}) as Record<string, AnyRecord>

  const operations: ReferenceOperation[] = []
  for (const [path, item] of Object.entries(paths)) {
    for (const method of METHODS) {
      const op = item[method] as AnyRecord | undefined
      if (!op) continue
      operations.push({
        method: method.toUpperCase(),
        path,
        operationId: String(op.operationId ?? ""),
        summary: String(op.summary ?? ""),
        description: String(op.description ?? ""),
        parameters: ((op.parameters ?? []) as AnyRecord[]).map((p) => {
          const schema = (p.schema ?? {}) as AnyRecord
          return {
            name: String(p.name),
            in: String(p.in),
            required: p.required === true,
            description: String(p.description ?? ""),
            type: typeLabel(schema),
            enum: Array.isArray(schema.enum) ? schema.enum.map(String) : undefined,
            default: schema.default === undefined ? undefined : String(schema.default),
          }
        }),
        responses: Object.entries((op.responses ?? {}) as Record<string, AnyRecord>).map(
          ([status, res]) => {
            const content = (res.content as AnyRecord | undefined)?.["application/json"] as
              | AnyRecord
              | undefined
            return {
              status,
              description: String(res.description ?? ""),
              schema: refName(content?.schema),
            }
          },
        ),
      })
    }
  }

  const referenced: ReferenceSchema[] = Object.entries(schemas).map(([name, schema]) => {
    const required = new Set((schema.required as string[] | undefined) ?? [])
    const props = (schema.properties ?? {}) as Record<string, AnyRecord>
    return {
      name,
      description: String(schema.description ?? ""),
      fields: Object.entries(props).map(([field, def]) => ({
        name: field,
        type: typeLabel(def),
        required: required.has(field),
        description: String(def.description ?? ""),
      })),
    }
  })

  return {
    title: String(info.title ?? ""),
    version: String(info.version ?? ""),
    summary: String(info.summary ?? ""),
    description: String(info.description ?? ""),
    serverUrl: String(servers[0]?.url ?? ""),
    externalDocsUrl: String((doc.externalDocs as AnyRecord | undefined)?.url ?? ""),
    operations,
    schemas: referenced,
  }
}
