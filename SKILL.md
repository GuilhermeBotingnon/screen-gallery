---
name: screen-gallery
description: Scaffold and maintain a zero-config, full-page dev screen gallery (iframe + in-memory fetch/storage mocks) for Vite + React apps, outside the production build. Use when the user asks for a screen gallery, UI preview catalog, Storybook alternative for full routes, or dev-only route/state previewer.
---

# Screen Gallery

Build a lightweight, full-page UI gallery that renders real application routes and states inside an isolated `<iframe>` during development, with zero impact on the production build.

## Quick start

Run the bundled Node scaffolding script from the web app root (where `vite.config.*` and `index.html` live):

```bash
node <skill-dir>/bin/cli.mjs init
```

Or if installed via npm:

```bash
npx screen-gallery init
```

This creates:
- `gallery.html` (dev-only entry point ignored by `vite build`)
- `src/gallery/main.tsx` (router between gallery shell and isolated screen)
- `src/gallery/Gallery.tsx` (sidebar, Desktop/Mobile viewport toggle, Light/Dark theme toggle)
- `src/gallery/stage.tsx` (in-memory `localStorage` + `fetch` `/api/*` interceptor + UI step runner)
- `src/gallery/catalog.ts` (typed groups, screens, and states)
- `src/gallery/catalog.test.ts` (validates unique IDs, state inheritance, and synthetic-only emails)

## Workflow for AI Agents

1. **Scaffold**: Run `init` in the target frontend workspace.
2. **Discover routes & API calls**: Inspect the app's router (`App.tsx`, routes) and `fetch` calls.
3. **Populate `src/gallery/catalog.ts`**:
   - Group screens by user role or flow (e.g., `Visitor`, `Authenticated`, `Errors`).
   - Add states under `states: [...]` for empty, loading (`pending: true`), offline (`networkError: true`), and error responses.
   - Use `steps` helper (`type`, `click`, `check`, `scroll`) to reach interactive states (e.g., open modals, filled forms).
   - **Privacy rule**: Never use real user data. Only synthetic data and `@example.test` emails.
4. **Verify**: Run the project's typecheck/test suite and open `http://localhost:5173/gallery.html`.
5. **Keep updated**: Whenever you add or change a route or UI state, update `src/gallery/catalog.ts`.
