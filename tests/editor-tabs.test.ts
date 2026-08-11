import { describe, expect, it } from "vitest";

import { resolveEditorTabIndex } from "../src/scripts/editor-tabs";

const baseInput = {
  altKey: false,
  ctrlKey: false,
  currentIndex: 0,
  defaultPrevented: false,
  isComposing: false,
  key: "",
  metaKey: false,
  shiftKey: false,
  tabCount: 2,
};

describe("editor mobile tab keyboard navigation", () => {
  it.each([
    [{ currentIndex: 0, key: "ArrowRight" }, 1],
    [{ currentIndex: 1, key: "ArrowRight" }, 0],
    [{ currentIndex: 0, key: "ArrowLeft" }, 1],
    [{ currentIndex: 1, key: "ArrowLeft" }, 0],
    [{ currentIndex: 1, key: "Home" }, 0],
    [{ currentIndex: 0, key: "End" }, 1],
  ] as const)("moves %o to tab %s", (input, expected) => {
    expect(resolveEditorTabIndex({ ...baseInput, ...input })).toBe(expected);
  });

  it.each([
    { key: "Enter" },
    { altKey: true, key: "ArrowRight" },
    { ctrlKey: true, key: "ArrowRight" },
    { key: "ArrowRight", metaKey: true },
    { key: "ArrowRight", shiftKey: true },
    { defaultPrevented: true, key: "ArrowRight" },
    { isComposing: true, key: "ArrowRight" },
    { currentIndex: -1, key: "ArrowRight" },
    { currentIndex: 2, key: "ArrowRight" },
    { key: "ArrowRight", tabCount: 0 },
  ])("ignores an unsafe or invalid navigation input %#", (input) => {
    expect(resolveEditorTabIndex({ ...baseInput, ...input })).toBeNull();
  });
});
