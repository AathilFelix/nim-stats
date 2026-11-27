// Vite `?inline` asset imports resolve to a base64 data URI string. Only
// app/opengraph-image.tsx uses it (Satori needs the raw WOFF bytes).
declare module "*.woff?inline" {
  const dataUri: string;
  export default dataUri;
}
