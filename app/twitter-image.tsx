// X / Twitter uses the same generated card as Open Graph. Re-exporting keeps a
// single source of truth (see opengraph-image.tsx) while emitting explicit
// twitter:image tags rather than relying on the og:image fallback.
export { default, alt, size, contentType } from "./opengraph-image";
