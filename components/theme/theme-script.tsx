import { STORAGE_KEY } from "./constants";

// Dark-first, no-flash theme application. Runs synchronously while the browser
// parses the HTML — before the first paint — so visitors never see a flash of
// the wrong theme. Mirrors the rule in theme-provider.tsx: default to dark
// unless the visitor explicitly chose light.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var m=t==='light'?'light':'dark';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(m);r.setAttribute('data-theme',m);}catch(e){}})();`;

/**
 * Inline theme bootstrap script.
 *
 * On the server the script is emitted as `text/javascript`, so it executes
 * during HTML parsing on a hard navigation or refresh and corrects the theme
 * before paint. On the client React re-renders it as inert `text/plain`, which
 * also silences React's dev warning about rendering <script> tags (scripts
 * inserted via client render never execute anyway). `suppressHydrationWarning`
 * absorbs the resulting `type` mismatch.
 *
 * See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}
