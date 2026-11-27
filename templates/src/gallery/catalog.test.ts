import { describe, expect, it } from "vitest";
import { listScreens, SCREENS } from "./catalog";

describe("screen gallery", () => {
  it("numbers screens and states, and states inherit parent api and path", () => {
    const list = listScreens([
      {
        name: "Group",
        screens: [
          {
            name: "A",
            description: "",
            path: "/a",
            api: { "GET /api/x": { body: 1 } },
            states: [{ name: "error", description: "", api: { "GET /api/y": { status: 500 } } }],
          },
          { name: "B", description: "" },
        ],
      },
    ]);

    expect(list.map((s) => [s.id, s.number, s.name])).toEqual([
      ["s01", "1", "A"],
      ["s01-1", "1·1", "A: error"],
      ["s02", "2", "B"],
    ]);
    expect(list[1]?.path).toBe("/a");
    expect(Object.keys(list[1]?.api ?? {})).toEqual(["GET /api/x", "GET /api/y"]);
  });

  it("has unique IDs and only synthetic @example.test emails", () => {
    expect(new Set(SCREENS.map((s) => s.id)).size).toBe(SCREENS.length);
    const emails = JSON.stringify(SCREENS).match(/[\w.+-]+@[\w.-]+/g) ?? [];
    expect(emails.filter((e) => !e.endsWith("@example.test"))).toEqual([]);
  });
});
