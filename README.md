# Screen Gallery

> Zero-config, zero-CSS-dependency, full-page dev screen gallery for Vite + React apps and AI coding agents.

![Screen Gallery Preview](./docs/images/hero.jpg)

**Screen Gallery** is a lightweight, dev-only alternative to Storybook built for **full application routes, isolated components, and real user states** (authenticated, empty, loading, error, offline) — without touching your production bundle, starting a backend, or leaking state into your normal dev `localStorage`.

---

## Why Screen Gallery?

- **Zero CSS dependencies:** The gallery shell uses self-contained monochrome (black & white) CSS with light/dark themes, collapsible sidebar, category accordions, sub-state dropdowns, search filter, and invisible scrollbars.
- **Zero-flash screen switching:** Uses 2 fixed double-buffered `<iframe>` slots — the next screen loads hidden and swaps on `onLoad` with no white flash.
- **Full routes + isolated components:** Mounts your real `<App />` inside an `<iframe>` at any route, or mounts individual components via `component: () => ...`.
- **True mobile breakpoints:** Toggle between **Desktop** and **Mobile (`372×772`)** inside a real iframe.
- **Zero backend required:** Intercepts `/api/*` requests in memory (`pending`, `networkError`, HTTP status codes) and isolates `localStorage` per screen.
- **Built-in ErrorBoundary:** Surfaces React render errors and `ReferenceError`s clearly inside the iframe instead of leaving a blank screen.
- **Built for AI coding agents:** Ships as a universal `SKILL.md` + Node CLI so **Antigravity, Claude Code, Codex, Cursor, and Gemini CLI** can scaffold and maintain your screens automatically.

---

## Architecture

![Screen Gallery Architecture](./docs/images/architecture.jpg)

1. **`src/gallery/catalog.ts`** — Defines groups, screens, components, mock `/api/*` responses, and interactive `steps`.
2. **`src/gallery/stage.tsx`** — Mounts `<App />` inside the iframe with in-memory `localStorage`, `/api/*` mock, and `GalleryErrorBoundary`.
3. **`src/gallery/Gallery.tsx`** — Self-contained UI shell (sidebar, Desktop/Mobile toggle, Light/Dark toggle, preview iframe).

---

## CLI Commands

From your **Vite + React** or **Next.js (App Router)** root (the CLI auto-detects `vite.config.*` vs `next.config.*`):

```bash
npx screen-gallery init                                      # Scaffold Vite (gallery.html) or Next.js (/gallery)
npx screen-gallery init --entry index                        # Scaffold Vite using index.html (opens at /)
npx screen-gallery scan --write                              # Auto-discover routes, components, and /api/* into catalog.ts
npx screen-gallery add-screen Billing --path /billing --auth # Print screen snippet with auth mock
npx screen-gallery add-component PricingCard                 # Print isolated component snippet
npx screen-gallery check                                     # Verify gallery files exist
```

Then start your dev server and open:
- **Vite:** `http://localhost:5173/gallery.html` (or `http://localhost:5173/` with `--entry index`)
- **Next.js:** `http://localhost:3000/gallery` (map your pages in `src/gallery/NextGalleryApp.tsx`; disabled automatically in production builds). Set `devIndicators: false` in `next.config.*` to hide the floating `N` badge inside gallery iframes. For large Next.js galleries, `npm run build && npm run start` serves prebuilt routes in ~50ms.

---

## Apps with Authentication (Important!)

If your app has login or protected routes, **always mock your session endpoint** (e.g., `GET /api/me` or `GET /api/auth/session`) and/or auth token in `storage` inside `catalog.ts`:

```ts
{
  name: "Authenticated",
  screens: [
    {
      name: "Dashboard",
      description: "Protected view with mocked user session.",
      path: "/dashboard",
      api: {
        "GET /api/me": {
          body: { id: "user-1", name: "Alex Silva", email: "alex.silva@example.test" },
        },
      },
    },
  ],
}
```

Without a session mock, protected routes often stay stuck on a loading spinner or render a blank/gray screen. Also make sure to mock any endpoints called by your global layout/shell (e.g. notifications, polling) using the exact JSON shape expected by the frontend types.

> **Tip for Next.js / shared monorepo code:** If shared files read `process.env.NODE_ENV`, add `define: { "process.env.NODE_ENV": JSON.stringify("development") }` in your `vite.config.ts`. Any runtime error is caught and displayed by `GalleryErrorBoundary`.

---

## Using as an AI Agent Skill (All Agents)

Supports **Antigravity, Gemini CLI, Claude Code, Codex, and Cursor** out of the box (`SKILL.md`, `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/screen-gallery.mdc`).

### One-command install for all agents in your project
```bash
git clone https://github.com/GuilhermeBotingnon/screen-gallery.git /tmp/sg && \
  node /tmp/sg/bin/cli.mjs install-skill --agent all && \
  rm -rf /tmp/sg
```

Or install only for your agent (`--agent antigravity|claude|codex|cursor`), or manually:
- **Antigravity / Gemini CLI:** `.agents/skills/screen-gallery/`
- **Claude Code:** `.claude/skills/screen-gallery/` (or `~/.claude/skills/screen-gallery/`)
- **Codex:** `.codex/skills/screen-gallery/`
- **Cursor:** `.cursor/rules/screen-gallery.mdc`

Once installed, ask your AI agent:
> *"Set up screen-gallery for this frontend, mock our auth session, and catalog all routes, states, and key components using synthetic data."*

---

## License

MIT © 2026 [Guilherme Botingnon](https://github.com/GuilhermeBotingnon)
