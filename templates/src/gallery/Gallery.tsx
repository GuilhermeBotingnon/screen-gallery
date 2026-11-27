/**
 * Dev-only screen gallery (excluded from production build):
 * lists grouped screens on the left and renders the selected screen in an iframe
 * so mobile breakpoints apply accurately.
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

function Toggle<T extends string>(props: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-xs">
      {props.options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={props.value === v}
          onClick={() => props.onChange(v)}
          className={`rounded-md px-2.5 py-1 ${
            props.value === v ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
          }`}
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
  const src = `/gallery.html?screen=${id}&theme=${pref.theme}`;
  const isMobile = pref.device === "mobile";

  return (
    <div className="flex h-screen bg-stone-100 text-stone-900">
      <nav className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-white min-[900px]:flex">
        <header className="sticky top-0 border-b border-stone-200 bg-white px-4 py-3">
          <p className="text-sm font-semibold">Screen Gallery</p>
          <p className="text-xs text-stone-500">{SCREENS.length} screens, synthetic data</p>
        </header>
        {GROUPS.map((group) => (
          <section key={group} className="px-2 py-2">
            <h2 className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {group}
            </h2>
            <ul>
              {SCREENS.filter((s) => s.group === group).map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    aria-current={s.id === id ? "page" : undefined}
                    className={`flex gap-2 rounded-md px-2 py-1 text-[13px] ${
                      s.id === id ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
                    } ${s.number.includes("·") ? "pl-6" : ""}`}
                  >
                    <span className="w-8 shrink-0 tabular-nums opacity-60">{s.number}</span>
                    <span className="truncate">
                      {s.number.includes("·") ? s.name.split(": ")[1] : s.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
          <select
            aria-label="Screen"
            value={id}
            onChange={(e) => {
              location.hash = e.target.value;
            }}
            className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm min-[900px]:hidden"
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
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-500">
              {screen?.group} · screen {index + 1} of {SCREENS.length} · <code>#{id}</code>
            </p>
            <h1 className="truncate text-base font-semibold">
              {screen?.number} {screen?.name}
            </h1>
            <p className="truncate text-sm text-stone-600">{screen?.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs hover:bg-stone-100"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs hover:bg-stone-100"
            >
              Next ›
            </button>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              title="Open isolated screen in new tab"
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs hover:bg-stone-100"
            >
              ↗
            </a>
          </div>
        </header>
        <div
          className={`flex min-h-0 flex-1 justify-center overflow-auto ${
            isMobile ? "p-6" : "p-3"
          }`}
        >
          <iframe
            key={src}
            src={src}
            title={screen?.name ?? "Screen"}
            className={
              isMobile
                ? "h-[772px] w-[372px] shrink-0 rounded-[28px] border-[6px] border-stone-800 bg-white shadow-xl"
                : "h-full w-full rounded-lg border border-stone-300 bg-white shadow-sm"
            }
          />
        </div>
      </main>
    </div>
  );
}
