# CLAUDE.md This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (next build)
npm run start    # Serve production build (next start)
npm run lint     # Lint with eslint-config-next (core-web-vitals + typescript)
npx next dev     # Alternative dev invocation
```

## Tech Stack

- **Next.js 16.2.7** (App Router, Root Layout in `app/layout.tsx`)
- **React 19.2.4**
- **Tailwind CSS v4** (`@tailwindcss/postcss` plugin, CSS-first config — no `tailwind.config.ts`)
- **TypeScript 5** (strict mode, path alias `@/*` → project root)

## Architecture

Fresh `create-next-app` scaffold. App lives in `app/` with a single page at `app/page.tsx`. No API routes, middleware, or data fetching currently. Styling uses Tailwind utility classes with CSS custom properties defined in `app/globals.css` under `@theme inline`. Dark mode follows `prefers-color-scheme` media query.

## Key Notes

- **Tailwind v4**: theme customization goes in CSS (`@theme inline { ... }` in `globals.css`), not in a JS config file.
- **Next.js 16 specifics**: This Next.js version has breaking changes — check `node_modules/next/dist/docs/` before using APIs that may have shifted.
- **Path alias**: `@/` resolves to project root, e.g. `@/components/foo`.
