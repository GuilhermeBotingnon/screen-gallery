# Screen Gallery — Agent Instructions

This repository provides a universal `SKILL.md` and zero-dependency Node CLI (`bin/cli.mjs`) to scaffold and maintain a dev-only full-page screen gallery (`gallery.html`) for Vite + React apps.

## Automatic Project Mapping Workflow

When installed or invoked in any frontend project, follow these steps automatically:

1. **Scaffold first**: Run `node <skill-dir>/bin/cli.mjs init` in the frontend root (`vite.config.*`).
2. **Map the entire structure**:
   - Inspect the router (`App.tsx`, route tables, lazy pages) to list every public and protected route.
   - Inspect global shells/layouts (e.g., `AppShell`, navbars, polling hooks, notification providers).
   - Inspect every `fetch("/api/...")` or API client call and its TypeScript types. **Never guess mock JSON shapes** — match exact expected fields and arrays (`[]`).
3. **Mandatory Auth Mocking**:
   - If the app has login or protected routes, mock the session endpoint (e.g., `GET /api/me`, `GET /api/auth/session`) and/or `storage` tokens for authenticated screens, and return `401` for visitor screens.
4. **Animations & Rich Media (GIFs, Motion, Lottie, CSS)**:
   - Detect animation libraries (`motion` / `framer-motion`, GSAP, Lottie, CSS `@keyframes` / transitions) and media assets (`.gif`, `.mp4`, `.webp`, animated `.svg`) in the project.
   - Include dedicated screens/states in `src/gallery/catalog.ts` to preview key animations, transitions, and GIF/media assets (e.g., loading skeletons, interactive drawers/modals via `steps`, or isolated animated components via `component: () => ...`).
   - Non-`/api/` asset requests (images, GIFs, fonts) automatically pass through `stage.tsx` to Vite/network — never block them.
5. **Runtime Safety**:
   - If shared code reads `process.env.NODE_ENV`, add `define: { "process.env.NODE_ENV": JSON.stringify("development") }` to `vite.config.ts`.
   - Rely on `GalleryErrorBoundary` in `stage.tsx` to surface any render/runtime error clearly.
6. **Synthetic Data Only**:
   - Never use real personal data. Use synthetic names and `@example.test` emails.
7. **Verify**:
   - Run `tsc --noEmit` and `src/gallery/catalog.test.ts`, then confirm `http://localhost:5173/gallery.html` loads cleanly.
