---
name: screen-gallery
description: Scaffold and maintain a zero-config, full-page dev screen gallery (iframe + in-memory fetch/storage mocks + ErrorBoundary) for Vite + React apps, outside the production build. Use when the user asks for a screen gallery, UI preview catalog, Storybook alternative for full routes, or dev-only route/state/component previewer.
---

# Screen Gallery

Build a lightweight, zero-dependency UI gallery that renders real application routes, states, and isolated components inside an `<iframe>` during development, with zero impact on the production build.

## CLI Commands

Run from the frontend root (where `vite.config.*` and `index.html` live):

```bash
node <skill-dir>/bin/cli.mjs init           # Scaffold gallery.html + src/gallery/*
node <skill-dir>/bin/cli.mjs add-screen Foo --path /foo --auth
node <skill-dir>/bin/cli.mjs add-component Card
node <skill-dir>/bin/cli.mjs check          # Verify all gallery files exist
```

## Workflow for AI Agents

1. **Scaffold**: Run `init` in the target frontend workspace. The gallery shell uses self-contained CSS (no Tailwind dependency).
2. **Discover routes, global shells & exact API shapes**: Inspect the router (`App.tsx`), any global authenticated shell/layout (e.g. `AppShell`, navbar notifications/polling), and every `fetch("/api/...")` call. **Never guess mock JSON payloads**: read the TypeScript types or consumer code to match the exact expected shape (arrays as `[]`, nested objects, etc.) so components don't crash on `undefined.map()`.
3. **Mandatory Auth Mocking**: If the app has login or protected routes, **you MUST mock the session endpoint** (e.g., `GET /api/me`, `GET /api/auth/session`) and/or auth token in `storage` for every authenticated screen (and `401` for visitor screens). Otherwise protected routes stay stuck on a loading spinner or render a blank/gray screen.
4. **Shared `process.env` check**: If shared modules read `process.env.NODE_ENV` in a Vite browser context, add `define: { "process.env.NODE_ENV": JSON.stringify("development") }` to `vite.config.ts`. `stage.tsx` includes a `GalleryErrorBoundary` and global error handlers to surface runtime errors clearly.
5. **Catalog screens & components**:
   - Group screens by role (`Visitor`, `Authenticated`, `Components`).
   - Add `states` for `loading` (`pending: true`), `offline` (`networkError: true`), HTTP errors, and interactive flows via `steps`.
   - **Privacy rule**: Never use real user data. Only synthetic data and `@example.test` emails.
6. **Verify**: Run `tsc --noEmit` and `src/gallery/catalog.test.ts`, then open `http://localhost:5173/gallery.html`.
