// One JSON shape for every error this API can return.
//
// Agents cannot parse an HTML error page, and a bare status code with an empty
// body tells them nothing about what to do next. Every failure here answers
// three questions: what went wrong (`code`, stable and machine-comparable),
// what happened in prose (`message`), and what to try instead (`hint`), plus a
// pointer to the reference. The shape is declared in the OpenAPI document as
// the `Error` schema, so a generated client knows it up front.

import { NextResponse } from "next/server"

import { absoluteUrl } from "@/lib/site"

export const ERROR_CODES = [
  "not_found",
  "method_not_allowed",
  "invalid_parameter",
  "service_unavailable",
  "server_error",
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export type ApiErrorBody = {
  error: {
    code: ErrorCode
    message: string
    hint: string
    docs: string
  }
}

const DOCS_URL = absoluteUrl("/api")

export function apiErrorBody(code: ErrorCode, message: string, hint: string): ApiErrorBody {
  return { error: { code, message, hint, docs: DOCS_URL } }
}

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  hint: string,
  headers: Record<string, string> = {},
): NextResponse<ApiErrorBody> {
  return NextResponse.json(apiErrorBody(code, message, hint), {
    status,
    // Errors are per-request truth; a cached 500 outliving the outage it
    // described is worse than no cache at all.
    headers: { "Cache-Control": "no-store", ...headers },
  })
}

/**
 * 404 for a path this API does not serve.
 *
 * Deliberately identical to what the internal-route guard returns, so probing
 * for gated endpoints cannot distinguish "does not exist" from "exists but you
 * are not allowed" — the reason that guard chose 404 over 401 in the first place.
 */
export function notFound(pathname: string): NextResponse<ApiErrorBody> {
  return jsonError(
    404,
    "not_found",
    `No API endpoint at ${pathname}.`,
    `Fetch ${absoluteUrl("/openapi.json")} for the endpoints this API serves.`,
  )
}

export function methodNotAllowed(method: string, allowed: string[]): NextResponse<ApiErrorBody> {
  return jsonError(
    405,
    "method_not_allowed",
    `${method} is not supported on this endpoint.`,
    `This API is read-only. Use ${allowed.join(" or ")}.`,
    { Allow: allowed.join(", ") },
  )
}

export function invalidParameter(
  name: string,
  received: string,
  allowed: readonly (string | number)[],
): NextResponse<ApiErrorBody> {
  return jsonError(
    400,
    "invalid_parameter",
    `\`${name}\` must be one of ${allowed.join(", ")}; received \`${received}\`.`,
    `Retry with a supported value, e.g. \`${name}=${allowed[0]}\`.`,
  )
}

export function serverError(operation: string): NextResponse<ApiErrorBody> {
  return jsonError(
    500,
    "server_error",
    `${operation} failed.`,
    "This is a fault on our side, not with your request. Retry in a few seconds; if it persists, check /api/health.",
  )
}

export function serviceUnavailable(message: string, hint: string): NextResponse<ApiErrorBody> {
  return jsonError(503, "service_unavailable", message, hint)
}

/** Handler for every method a read-only route does not implement. */
export function readOnlyMethodHandler(req: Request): NextResponse<ApiErrorBody> {
  return methodNotAllowed(req.method, ["GET", "HEAD"])
}
