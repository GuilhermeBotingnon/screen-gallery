/**
 * Isolated screen stage inside the iframe: mounts the real <App /> at a route,
 * backed by catalog-driven `/api/*` responses and an in-memory localStorage.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../App";
import type { ListedScreen, MockResponse, StepHelper } from "./catalog";

class InMemoryStorage implements Storage {
  #data = new Map<string, string>();
  get length() {
    return this.#data.size;
  }
  clear() {
    this.#data.clear();
  }
  getItem(key: string) {
    return this.#data.get(key) ?? null;
  }
  key(i: number) {
    return [...this.#data.keys()][i] ?? null;
  }
  removeItem(key: string) {
    this.#data.delete(key);
  }
  setItem(key: string, value: string) {
    this.#data.set(key, String(value));
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function installMockApi(api: Record<string, MockResponse>) {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
    const method = (init?.method ?? "GET").toUpperCase();
    const res: MockResponse =
      api[`${method} ${url.pathname}`] ??
      (method === "GET" ? { status: 404, body: { error: "not_found" } } : { body: {} });
    if (method !== "GET") await wait(250);
    if (res.pending) return new Promise<Response>(() => {});
    if (res.networkError) throw new TypeError("Failed to fetch");
    return Response.json(res.body ?? {}, { status: res.status ?? 200 });
  };
}

async function waitFor<T>(find: () => T | null | undefined, what: string): Promise<T> {
  for (let i = 0; i < 60; i++) {
    const match = find();
    if (match) return match;
    await wait(50);
  }
  throw new Error(`Could not find ${what}`);
}

const isVisible = (el: Element) => el.getClientRects().length > 0;
type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fieldByName(name: string): Field | null {
  const labels = [...document.querySelectorAll("label")].filter(isVisible);
  const label =
    labels.find((l) => l.textContent?.trim() === name) ??
    labels.find((l) => l.textContent?.trim().startsWith(name));
  if (label?.control) return label.control as Field;
  return (
    [...document.querySelectorAll<Field>("input, textarea, select")]
      .filter(isVisible)
      .find(
        (c) =>
          ("placeholder" in c && c.placeholder.startsWith(name)) ||
          c.getAttribute("aria-label") === name,
      ) ?? null
  );
}

const helper: StepHelper = {
  async type(name, value) {
    const field = await waitFor(() => fieldByName(name), `field "${name}"`);
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")?.set?.call(field, value);
    field.dispatchEvent(
      new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }),
    );
  },
  async click(text) {
    const target = await waitFor(
      () =>
        [...document.querySelectorAll<HTMLElement>("button, a, [role=tab]")]
          .filter((el) => isVisible(el) && !(el as HTMLButtonElement).disabled)
          .find((el) =>
            [el.textContent, el.getAttribute("aria-label"), el.title].some(
              (t) => t?.trim() === text,
            ),
          ),
      `button "${text}"`,
    );
    target.click();
  },
  async check(label) {
    const field = await waitFor(() => fieldByName(label), `checkbox "${label}"`);
    if (field instanceof HTMLInputElement && !field.checked) field.click();
  },
  async scroll(heading) {
    const target = await waitFor(
      () =>
        [...document.querySelectorAll("h1, h2, h3")].find((h) => h.textContent?.trim() === heading),
      `heading "${heading}"`,
    );
    target.scrollIntoView({ block: "start" });
  },
};

function notifyError(message: string) {
  const banner = document.createElement("div");
  banner.textContent = `Gallery: ${message}`;
  banner.style.cssText =
    "position:fixed;bottom:8px;left:8px;z-index:99999;padding:6px 10px;border-radius:6px;background:#b91c1c;color:#fff;font:12px system-ui";
  document.body.append(banner);
}

export async function mountScreen(screen: ListedScreen | undefined, dark: boolean) {
  const root = createRoot(document.getElementById("root") as HTMLElement);
  document.documentElement.classList.toggle("dark", dark);

  if (!screen) {
    root.render(<p className="p-6 text-sm">Screen not found in catalog.</p>);
    return;
  }

  const memory = new InMemoryStorage();
  for (const [k, v] of Object.entries(screen.storage ?? {})) {
    memory.setItem(k, v);
  }
  Object.defineProperty(window, "localStorage", { value: memory, configurable: true });

  if (screen.component) {
    const Component = await screen.component();
    root.render(
      <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
        <Component />
      </main>,
    );
    return;
  }

  installMockApi(screen.api ?? {});
  window.confirm = () => true;

  const screenUrl = location.href;
  import.meta.hot?.on("vite:beforeFullReload", () => history.replaceState(null, "", screenUrl));
  history.replaceState(null, "", screen.path ?? "/");

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  try {
    await screen.steps?.(helper);
  } catch (err) {
    notifyError(err instanceof Error ? err.message : String(err));
  }
}
