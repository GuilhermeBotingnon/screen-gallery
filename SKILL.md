---
name: screen-gallery
description: Scaffold and maintain a zero-config, full-page dev screen gallery (iframe + in-memory fetch/storage mocks + ErrorBoundary) for Vite + React apps, outside the production build. Use when the user asks for a screen gallery, UI preview catalog, Storybook alternative for full routes, or dev-only route/state/component previewer.
---

# Screen Gallery

Build a lightweight, zero-dependency UI gallery that renders real application routes, states, and isolated components inside an `<iframe>` during development, with zero impact on the production build.

## CLI Commands

Run from the frontend root (where `vite.config.*` or `next.config.*` lives — auto-detected, or pass `--framework vite|next`):

```bash
node <skill-dir>/bin/cli.mjs init           # Scaffold Vite (gallery.html) or Next.js (/gallery); pass --entry index for root /
node <skill-dir>/bin/cli.mjs scan --write   # Auto-discover routes, components, and /api/* calls into catalog.ts
node <skill-dir>/bin/cli.mjs add-screen Foo --path /foo --auth
node <skill-dir>/bin/cli.mjs add-component Card
node <skill-dir>/bin/cli.mjs check          # Verify all gallery files exist
```

## Live-First Workflow for AI Agents

1. **Scaffold & Scan Fast**: Run `init` (pass `--entry index` if the project is gallery-first) and `scan --write` in the frontend root to populate `src/gallery/catalog.ts` in seconds.
2. **Start Live Preview Early**: Ensure the dev server is running (`npm run dev`) early so the user has real-time HMR preview (`http://localhost:5173/gallery.html`, `/` with `--entry index`, or `http://localhost:3000/gallery`). `Gallery.tsx` uses 2-slot double-buffered iframes for zero-flash switching.
3. **Next.js Polish**: For Next.js apps, set `devIndicators: false` in `next.config.*` so the floating `N` badge does not appear inside gallery iframes. Use `npm run dev` while actively building pages; for large static reviews, `npm run build && npm run start` serves prebuilt routes in ~50ms.
3. **Rapid Page Prototyping**: When creating a new page or UI slice, register an isolated `component: () => import(...)` entry in `catalog.ts` *immediately* (before wiring full routing/backend) with `default`, `loading`, `empty`, and `error` states so every state is visible in real time via HMR.
4. **Match Exact API Shapes & Auth**: Inspect `App.tsx`, global shells (`AppShell`), and `fetch("/api/...")` types. **Never guess mock JSON payloads** (match exact fields and arrays `[]`). Mock session endpoints (`GET /api/me`, `GET /api/auth/session`) or `storage` tokens for protected routes (`401` for visitor screens).
5. **Runtime & Media Safety**: If shared modules read `process.env.NODE_ENV` in Vite, add `define: { "process.env.NODE_ENV": JSON.stringify("development") }` to `vite.config.ts`. Detect animations (`motion`/`framer-motion`, CSS keyframes, Lottie) and media (`.gif`, `.webp`, animated SVGs) and add preview entries (non-`/api/` assets pass through `stage.tsx` automatically).
6. **Privacy & Verify**: Use only synthetic data and `@example.test` emails. Run `tsc --noEmit` and `src/gallery/catalog.test.ts`, then verify the gallery URL loads cleanly.
