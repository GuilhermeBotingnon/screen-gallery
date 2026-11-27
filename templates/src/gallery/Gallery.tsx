/**
 * Dev-only screen gallery (excluded from production build):
 * self-contained CSS (zero Tailwind/UI-lib dependency) so the shell never breaks
 * even if the host app does not use Tailwind or its stylesheet fails to load.
 */
import { useEffect, useState } from "react";
import { SCREENS } from "./catalog";

type Preferences = {
  device: "desktop" | "mobile";
  theme: "light" | "dark";
};

const STORAGE_KEY = "dev:screen-gallery";

function readPreferences(): Preferences {
  try {
    return {
      device: "desktop",
      theme: "light",
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
    };
  } catch {
    return { device: "desktop", theme: "light" };
  }
}

const idFromHash = () => {
  const id = location.hash.slice(1);
  return SCREENS.some((s) => s.id === id) ? id : (SCREENS[0]?.id ?? "");
};

const GROUPS = [...new Set(SCREENS.map((s) => s.group))];

const GALLERY_CSS = `
.sg-shell {
  display: flex;
  height: 100vh;
  width: 100%;
  background: #f5f5f4;
  color: #1c1917;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  box-sizing: border-box;
}
.sg-shell *, .sg-shell *::before, .sg-shell *::after {
  box-sizing: border-box;
}
.sg-nav {
  width: 288px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid #e7e5e4;
  background: #ffffff;
}
.sg-nav-header {
  position: sticky;
  top: 0;
  border-bottom: 1px solid #e7e5e4;
  background: #ffffff;
  padding: 12px 16px;
}
.sg-nav-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.sg-nav-sub {
  margin: 2px 0 0;
  font-size: 12px;
  color: #78716c;
}
.sg-group {
  padding: 8px;
}
.sg-group-title {
  margin: 0;
  padding: 0 8px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a8a29e;
}
.sg-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sg-link {
  display: flex;
  gap: 8px;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 13px;
  color: #44403c;
  text-decoration: none;
}
.sg-link:hover {
  background: #f5f5f4;
}
.sg-link[aria-current="page"] {
  background: #1c1917;
  color: #ffffff;
}
.sg-link--state {
  padding-left: 24px;
}
.sg-num {
  width: 32px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  opacity: 0.6;
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
  gap: 12px;
  border-bottom: 1px solid #e7e5e4;
  background: #ffffff;
  padding: 12px 16px;
}
.sg-select {
  display: none;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #d6d3d1;
  padding: 6px 8px;
  font-size: 14px;
  background: #ffffff;
  color: #1c1917;
}
.sg-meta {
  min-width: 0;
  flex: 1;
}
.sg-crumb {
  margin: 0;
  font-size: 12px;
  color: #78716c;
}
.sg-h1 {
  margin: 2px 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sg-desc {
  margin: 0;
  font-size: 13px;
  color: #57534e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sg-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.sg-toggle {
  display: inline-flex;
  border-radius: 8px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  padding: 2px;
}
.sg-toggle-btn {
  border: 0;
  background: transparent;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #57534e;
  cursor: pointer;
}
.sg-toggle-btn:hover {
  background: #f5f5f4;
}
.sg-toggle-btn[aria-pressed="true"] {
  background: #1c1917;
  color: #ffffff;
}
.sg-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  color: #1c1917;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
}
.sg-btn:hover {
  background: #f5f5f4;
}
.sg-stage {
  display: flex;
  min-height: 0;
  flex: 1;
  justify-content: center;
  overflow: auto;
  padding: 12px;
}
.sg-stage--mobile {
  padding: 24px;
}
.sg-frame-desktop {
  height: 100%;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.sg-frame-mobile {
  height: 772px;
  width: 372px;
  flex-shrink: 0;
  border-radius: 28px;
  border: 6px solid #292524;
  background: #ffffff;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.12);
}
@media (max-width: 899px) {
  .sg-nav { display: none; }
  .sg-select { display: block; }
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
  const isMobile = pref.device === "mobile";

  return (
    <div className="sg-shell">
      <style>{GALLERY_CSS}</style>
      <nav className="sg-nav">
        <header className="sg-nav-header">
          <p className="sg-nav-title">Screen Gallery</p>
          <p className="sg-nav-sub">{SCREENS.length} screens, synthetic data</p>
        </header>
        {GROUPS.map((group) => (
          <section key={group} className="sg-group">
            <h2 className="sg-group-title">{group}</h2>
            <ul className="sg-list">
              {SCREENS.filter((s) => s.group === group).map((s) => (
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
          </section>
        ))}
      </nav>

      <main className="sg-main">
        <header className="sg-topbar">
          <select
            aria-label="Screen"
            value={id}
            onChange={(e) => {
              location.hash = e.target.value;
            }}
            className="sg-select"
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
              {screen?.group} · screen {index + 1} of {SCREENS.length} · <code>#{id}</code>
            </p>
            <h1 className="sg-h1">
              {screen?.number} {screen?.name}
            </h1>
            <p className="sg-desc">{screen?.description}</p>
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
        <div className={`sg-stage ${isMobile ? "sg-stage--mobile" : ""}`}>
          <iframe
            key={src}
            src={src}
            title={screen?.name ?? "Screen"}
            className={isMobile ? "sg-frame-mobile" : "sg-frame-desktop"}
          />
        </div>
      </main>
    </div>
  );
}
