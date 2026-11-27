/**
 * Isolated screen stage inside the iframe: mounts the real <App /> at a route,
 * backed by catalog-driven `/api/*` responses, an in-memory localStorage,
 * and a React ErrorBoundary + global error listener so runtime failures render clearly.
 */
import { Component, type ErrorInfo, type ReactNode, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../App";
import { SCREENS, type ListedScreen, type MockResponse, type StepHelper } from "./catalog";

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

class GalleryErrorBoundary extends Component<
  { screenName: string; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[screen-gallery] Render error in "${this.props.screenName}":`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            margin: 24,
            padding: 16,
            borderRadius: 8,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#991b1b",
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>
            Screen Gallery: render error in "{this.props.screenName}"
          </strong>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const baseFetch = window.fetch.bind(window);

function installMockApi(api: Record<string, MockResponse>) {
  window.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (!url.pathname.startsWith("/api/")) return baseFetch(input, init);
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
  const labels = Array.from(document.querySelectorAll("label")).filter(isVisible);
  const label =
    labels.find((l) => l.textContent?.trim() === name) ??
    labels.find((l) => l.textContent?.trim().startsWith(name));
  if (label?.control) return label.control as Field;
  return (
    Array.from(document.querySelectorAll<Field>("input, textarea, select"))
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
        Array.from(document.querySelectorAll<HTMLElement>("button, a, [role=tab]"))
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
        Array.from(document.querySelectorAll("h1, h2, h3")).find((h) => h.textContent?.trim() === heading),
      `heading "${heading}"`,
    );
    target.scrollIntoView({ block: "start" });
  },
};

function notifyError(message: string) {
  const banner = document.createElement("div");
  banner.setAttribute("data-sg-error", "true");
  banner.textContent = `Gallery: ${message}`;
  banner.style.cssText =
    "position:fixed;bottom:8px;left:8px;right:8px;z-index:99999;padding:8px 12px;border-radius:6px;background:#b91c1c;color:#fff;font:12px system-ui";
  document.body.append(banner);
}

let errorHandlersInstalled = false;
function installGlobalErrorHandlers() {
  if (errorHandlersInstalled) return;
  errorHandlersInstalled = true;
  window.addEventListener("error", (event) => {
    notifyError(event.error instanceof Error ? event.error.message : event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    notifyError(reason instanceof Error ? reason.message : String(reason));
  });
}

let stageRoot: Root | null = null;
let stageContainer: HTMLElement | null = null;
let renderSeq = 0;
let messageListenerInstalled = false;

function installMessageListener() {
  if (messageListenerInstalled) return;
  messageListenerInstalled = true;
  window.addEventListener("message", (event) => {
    const data = event.data as { type?: string; screenId?: string; dark?: boolean } | null;
    if (!data || data.type !== "sg:render" || !data.screenId) return;
    void mountScreen(
      SCREENS.find((s) => s.id === data.screenId),
      Boolean(data.dark),
    );
  });
}

export async function mountScreen(screen: ListedScreen | undefined, dark: boolean) {
  const seq = ++renderSeq;
  installGlobalErrorHandlers();
  installMessageListener();
  document.querySelectorAll("[data-sg-error]").forEach((el) => el.remove());

  const container = document.getElementById("root") as HTMLElement;
  if (!stageRoot || stageContainer !== container) {
    stageContainer = container;
    stageRoot = createRoot(container);
  }
  const root = stageRoot;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.documentElement.style.backgroundColor = dark ? "#000000" : "#ffffff";

  if (!screen) {
    root.render(
      <p style={{ padding: 24, fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
        Screen not found in catalog.
      </p>,
    );
    return;
  }

  const memory = new InMemoryStorage();
  for (const [k, v] of Object.entries(screen.storage ?? {})) {
    memory.setItem(k, v);
  }
  Object.defineProperty(window, "localStorage", { value: memory, configurable: true });

  if (screen.component) {
    const Component = await screen.component();
    if (seq !== renderSeq) return;
    root.render(
      <GalleryErrorBoundary key={`${screen.id}-${seq}`} screenName={screen.name}>
        <main style={{ minHeight: "100vh", padding: 24 }}>
          <Component />
        </main>
      </GalleryErrorBoundary>,
    );
    return;
  }

  installMockApi(screen.api ?? {});
  window.confirm = () => true;

  const screenUrl = location.href;
  (import.meta as ImportMeta & { hot?: { on: (e: string, cb: () => void) => void } }).hot?.on(
    "vite:beforeFullReload",
    () => history.replaceState(null, "", screenUrl),
  );
  history.replaceState(null, "", screen.path ?? "/");

  root.render(
    <StrictMode>
      <GalleryErrorBoundary key={`${screen.id}-${seq}`} screenName={screen.name}>
        <App />
      </GalleryErrorBoundary>
    </StrictMode>,
  );

  try {
    if (seq !== renderSeq) return;
    await screen.steps?.(helper);
  } catch (err) {
    if (seq !== renderSeq) return;
    notifyError(err instanceof Error ? err.message : String(err));
  }
}
