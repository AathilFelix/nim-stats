import type { Instrumentation } from "next"

// Production builds replace server-render error messages with a digest, so a
// failing server component otherwise leaves nothing in the logs but a 500.
// Log the real error, keyed by the same digest the client sees.
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  const e = err as Error & { digest?: string }
  console.error(
    JSON.stringify({
      level: "ERROR",
      scope: "render",
      message: e.message,
      digest: e.digest,
      path: request.path,
      routePath: context.routePath,
      routeType: context.routeType,
      stack: e.stack?.split("\n").slice(0, 6).join("\n"),
    }),
  )
}
