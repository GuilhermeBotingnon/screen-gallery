import type { ComponentType } from "react";

export type MockResponse = {
  status?: number;
  body?: unknown;
  pending?: boolean;
  networkError?: boolean;
};

export type StepHelper = {
  type(field: string, value: string): Promise<void>;
  click(label: string): Promise<void>;
  check(label: string): Promise<void>;
  scroll(heading: string): Promise<void>;
};

export type ScreenState = {
  name: string;
  description: string;
  path?: string;
  api?: Record<string, MockResponse>;
  storage?: Record<string, string>;
  steps?: (h: StepHelper) => Promise<void>;
};

export type ScreenDef = ScreenState & {
  component?: () => Promise<ComponentType>;
  states?: ScreenState[];
};

export type ScreenGroup = {
  name: string;
  screens: ScreenDef[];
};

export type ListedScreen = ScreenDef & {
  id: string;
  number: string;
  group: string;
};

export function listScreens(groups: ScreenGroup[]): ListedScreen[] {
  const result: ListedScreen[] = [];
  let n = 0;

  for (const group of groups) {
    for (const screen of group.screens) {
      n++;
      const id = `s${String(n).padStart(2, "0")}`;
      result.push({ ...screen, id, number: String(n), group: group.name });

      screen.states?.forEach((state, i) => {
        result.push({
          ...screen,
          ...state,
          name: `${screen.name}: ${state.name}`,
          api: { ...screen.api, ...state.api },
          storage: { ...screen.storage, ...state.storage },
          id: `${id}-${i + 1}`,
          number: `${n}·${i + 1}`,
          group: group.name,
        });
      });
    }
  }

  return result;
}

const GROUPS: ScreenGroup[] = [
  {
    name: "Visitor",
    screens: [
      {
        name: "Home",
        description: "Landing page for unauthenticated visitors.",
        path: "/",
        api: {
          "GET /api/me": { status: 401, body: { error: "unauthorized" } },
        },
      },
      {
        name: "Sign in",
        description: "Authentication form.",
        path: "/login",
        states: [
          {
            name: "invalid credentials",
            description: "Shows inline error after failed sign-in.",
            api: {
              "POST /api/login": { status: 401, body: { error: "Invalid email or password" } },
            },
            steps: async (h) => {
              await h.type("Email", "alex.silva@example.test");
              await h.type("Password", "wrong-password");
              await h.click("Sign in");
            },
          },
        ],
      },
    ],
  },
];

export const SCREENS = listScreens(GROUPS);
