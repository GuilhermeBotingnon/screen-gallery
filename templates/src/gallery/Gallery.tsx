/**
 * Dev-only screen gallery (excluded from production build):
 * self-contained monochrome CSS (zero Tailwind/UI-lib dependency) so the shell
 * never breaks even if the host app does not use Tailwind or its stylesheet fails to load.
 */
import { useEffect, useRef, useState } from "react";
import { SCREENS } from "./catalog";

type Preferences = {
  device: "desktop" | "mobile";
  theme: "light" | "dark";
  sidebar: boolean;
};

const STORAGE_KEY = "dev:screen-gallery";

function readPreferences(): Preferences {
  try {
    return {
      device: "desktop",
      theme: "light",
      sidebar: true,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
    };
  } catch {
    return { device: "desktop", theme: "light", sidebar: true };
  }
}

const idFromHash = () => {
  const id = location.hash.slice(1);
  return SCREENS.some((s) => s.id === id) ? id : (SCREENS[0]?.id ?? "");
};

const GROUPS = [...new Set(SCREENS.map((s) => s.group))];

const GALLERY_CSS = `
.sg-shell {
  --sg-bg: #f4f4f5;
  --sg-surface: #ffffff;
  --sg-surface-hover: #f4f4f5;
  --sg-border: #e4e4e7;
  --sg-text: #000000;
  --sg-muted: #71717a;
  --sg-active-bg: #000000;
  --sg-active-text: #ffffff;
  --sg-frame-bg: #ffffff;
  display: flex;
  height: 100vh;
  width: 100%;
  background: var(--sg-bg);
  color: var(--sg-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  box-sizing: border-box;
}
.sg-shell[data-theme="dark"] {
  --sg-bg: #000000;
  --sg-surface: #0a0a0a;
  --sg-surface-hover: #18181b;
  --sg-border: #27272a;
  --sg-text: #ffffff;
  --sg-muted: #a1a1aa;
  --sg-active-bg: #ffffff;
  --sg-active-text: #000000;
  --sg-frame-bg: #000000;
}
.sg-shell *, .sg-shell *::before, .sg-shell *::after {
  box-sizing: border-box;
}
.sg-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sg-scroll::-webkit-scrollbar {
  display: none;
}
.sg-nav {
  width: 216px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid var(--sg-border);
  background: var(--sg-surface);
  transition: width 140ms ease;
}
.sg-nav--collapsed {
  width: 0;
  border-right: 0;
  overflow: hidden;
}
.sg-nav-header {
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid var(--sg-border);
  background: var(--sg-surface);
  padding: 10px 12px;
}
.sg-nav-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.sg-nav-sub {
  margin: 2px 0 8px;
  font-size: 11px;
  color: var(--sg-muted);
}
.sg-search {
  width: 100%;
  border: 1px solid var(--sg-border);
  border-radius: 6px;
  background: var(--sg-bg);
  color: var(--sg-text);
  padding: 5px 8px;
  font-size: 12px;
  outline: none;
}
.sg-search::placeholder {
  color: var(--sg-muted);
}
.sg-search:focus {
  border-color: var(--sg-text);
}
.sg-group {
  padding: 6px 8px;
  border-bottom: 1px solid var(--sg-border);
}
.sg-group:last-child {
  border-bottom: 0;
}
.sg-group-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 0;
  background: transparent;
  padding: 4px 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sg-muted);
  cursor: pointer;
}
.sg-group-btn:hover {
  color: var(--sg-text);
}
.sg-group-count {
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}
.sg-list {
  list-style: none;
  margin: 2px 0 0;
  padding: 0;
}
.sg-link {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: var(--sg-text);
  text-decoration: none;
  opacity: 0.82;
}
.sg-link:hover {
  background: var(--sg-surface-hover);
  opacity: 1;
}
.sg-link[aria-current="page"] {
  background: var(--sg-active-bg);
  color: var(--sg-active-text);
  opacity: 1;
  font-weight: 600;
}
.sg-link--state {
  padding-left: 20px;
  font-size: 11px;
}
.sg-num {
  width: 26px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  opacity: 0.55;
  font-size: 11px;
}
.sg-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sg-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.sg-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--sg-border);
  background: var(--sg-surface);
  padding: 8px 12px;
}
.sg-select {
  display: none;
  width: 100%;
  border-radius: 6px;
  border: 1px solid var(--sg-border);
  padding: 5px 8px;
  font-size: 13px;
  background: var(--sg-surface);
  color: var(--sg-text);
}
.sg-select--visible {
  display: block;
  width: auto;
  max-width: 220px;
}
.sg-meta {
  min-width: 0;
  flex: 1;
}
.sg-crumb {
  margin: 0;
  font-size: 11px;
  color: var(--sg-muted);
}
.sg-h1 {
  margin: 1px 0 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sg-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.sg-toggle {
  display: inline-flex;
  border-radius: 7px;
  border: 1px solid var(--sg-border);
  background: var(--sg-bg);
  padding: 2px;
}
.sg-toggle-btn {
  border: 0;
  background: transparent;
  border-radius: 5px;
  padding: 3px 9px;
  font-size: 11px;
  color: var(--sg-muted);
  cursor: pointer;
}
.sg-toggle-btn:hover {
  color: var(--sg-text);
}
.sg-toggle-btn[aria-pressed="true"] {
  background: var(--sg-active-bg);
  color: var(--sg-active-text);
  font-weight: 600;
}
.sg-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 7px;
  border: 1px solid var(--sg-border);
  background: var(--sg-surface);
  color: var(--sg-text);
  padding: 4px 9px;
  font-size: 11px;
  cursor: pointer;
  text-decoration: none;
}
.sg-btn:hover {
  background: var(--sg-surface-hover);
}
.sg-stage {
  display: flex;
  min-height: 0;
  flex: 1;
  justify-content: center;
  overflow: auto;
  padding: 10px;
}
.sg-stage--mobile {
  padding: 20px;
}
.sg-frame-desktop {
  height: 100%;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--sg-border);
  background: var(--sg-frame-bg);
  transition: opacity 100ms ease;
}
.sg-frame-mobile {
  height: 772px;
  width: 372px;
  flex-shrink: 0;
  border-radius: 28px;
  border: 6px solid #18181b;
  background: var(--sg-frame-bg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
  transition: opacity 100ms ease;
}
@media (max-width: 899px) {
  .sg-nav { display: none; }
  .sg-select { display: block; }
  .sg-sidebar-toggle { display: none; }
}
`;

function Toggle<T extends string>(props: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="sg-toggle">
      {props.options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={props.value === v}
          onClick={() => props.onChange(v)}
          className="sg-toggle-btn"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Gallery() {
  const [id, setId] = useState(idFromHash);
  const [pref, setPref] = useState(readPreferences);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onHashChange = () => setId(idFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  }, [pref]);

  const index = SCREENS.findIndex((s) => s.id === id);
  const screen = SCREENS[index];
  const go = (step: number) => {
    const target = SCREENS[(index + step + SCREENS.length) % SCREENS.length];
    if (target) location.hash = target.id;
  };
  const base = location.pathname.endsWith(".html") ? location.pathname : "/gallery";
  const src = `${base}?screen=${id}&theme=${pref.theme}`;
  const [initialSrc] = useState(src);
  const isMobile = pref.device === "mobile";

  const syncIframe = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "sg:render", screenId: id, dark: pref.theme === "dark" },
      "*",
    );
  };

  useEffect(() => {
    if (iframeReady) syncIframe();
  }, [id, pref.theme, iframeReady]);

  const q = query.trim().toLowerCase();
  const matches = (name: string, group: string) =>
    !q || name.toLowerCase().includes(q) || group.toLowerCase().includes(q);

  return (
    <div className="sg-shell" data-theme={pref.theme}>
      <style>{GALLERY_CSS}</style>
      <nav className={`sg-nav sg-scroll ${pref.sidebar ? "" : "sg-nav--collapsed"}`}>
        <header className="sg-nav-header">
          <p className="sg-nav-title">Screen Gallery</p>
          <p className="sg-nav-sub">{SCREENS.length} screens · B&amp;W</p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter screens..."
            aria-label="Filter screens"
            className="sg-search"
          />
        </header>
        {GROUPS.map((group) => {
          const items = SCREENS.filter((s) => s.group === group && matches(s.name, group));
          if (items.length === 0) return null;
          const isOpen = q ? true : !collapsed[group];
          return (
            <section key={group} className="sg-group">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }))}
                className="sg-group-btn"
              >
                <span>
                  {isOpen ? "▾" : "▸"} {group}
                </span>
                <span className="sg-group-count">{items.length}</span>
              </button>
              {isOpen && (
                <ul className="sg-list">
                  {items.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        aria-current={s.id === id ? "page" : undefined}
                        className={`sg-link ${s.number.includes("·") ? "sg-link--state" : ""}`}
                      >
                        <span className="sg-num">{s.number}</span>
                        <span className="sg-name">
                          {s.number.includes("·") ? s.name.split(": ")[1] : s.name}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </nav>

      <main className="sg-main">
        <header className="sg-topbar">
          <button
            type="button"
            onClick={() => setPref((p) => ({ ...p, sidebar: !p.sidebar }))}
            title={pref.sidebar ? "Hide sidebar" : "Show sidebar"}
            className="sg-btn sg-sidebar-toggle"
          >
            {pref.sidebar ? "◧" : "☰"}
          </button>
          <select
            aria-label="Screen"
            value={id}
            onChange={(e) => {
              location.hash = e.target.value;
            }}
            className={`sg-select ${pref.sidebar ? "" : "sg-select--visible"}`}
          >
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {SCREENS.filter((s) => s.group === group).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.number} {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="sg-meta">
            <p className="sg-crumb">
              {screen?.group} · {index + 1}/{SCREENS.length} · <code>#{id}</code>
            </p>
            <h1 className="sg-h1">
              {screen?.number} {screen?.name}
            </h1>
          </div>
          <div className="sg-controls">
            <Toggle
              value={pref.device}
              options={[
                ["desktop", "Desktop"],
                ["mobile", "Mobile"],
              ]}
              onChange={(device) => setPref({ ...pref, device })}
            />
            <Toggle
              value={pref.theme}
              options={[
                ["light", "Light"],
                ["dark", "Dark"],
              ]}
              onChange={(theme) => setPref({ ...pref, theme })}
            />
            <button type="button" onClick={() => go(-1)} className="sg-btn">
              ‹ Prev
            </button>
            <button type="button" onClick={() => go(1)} className="sg-btn">
              Next ›
            </button>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              title="Open isolated screen in new tab"
              className="sg-btn"
            >
              ↗
            </a>
          </div>
        </header>
        <div className={`sg-stage sg-scroll ${isMobile ? "sg-stage--mobile" : ""}`}>
          <iframe
            ref={iframeRef}
            src={initialSrc}
            onLoad={() => {
              setIframeReady(true);
              syncIframe();
            }}
            style={{ opacity: iframeReady ? 1 : 0 }}
            title={screen?.name ?? "Screen"}
            className={isMobile ? "sg-frame-mobile" : "sg-frame-desktop"}
          />
        </div>
      </main>
    </div>
  );
}
