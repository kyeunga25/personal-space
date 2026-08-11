import { describe, expect, it } from "vitest";

import {
  resolveEditorShortcut,
  resolveMarkdownShortcut,
} from "../src/scripts/editor-shortcuts";

const baseEvent = {
  altKey: false,
  ctrlKey: false,
  defaultPrevented: false,
  isComposing: false,
  key: "",
  metaKey: false,
  repeat: false,
  shiftKey: false,
};

describe("editor keyboard shortcuts", () => {
  it.each([
    [{ key: "s", metaKey: true }, "save"],
    [{ ctrlKey: true, key: "S" }, "save"],
    [{ key: "Enter", metaKey: true }, "publish"],
    [{ ctrlKey: true, key: "Enter" }, "publish"],
  ] as const)("recognizes %o as %s", (event, action) => {
    expect(resolveEditorShortcut({ ...baseEvent, ...event })).toBe(action);
  });

  it.each([
    { key: "s" },
    { altKey: true, ctrlKey: true, key: "s" },
    { key: "s", metaKey: true, shiftKey: true },
    { ctrlKey: true, key: "s", repeat: true },
    { isComposing: true, key: "s", metaKey: true },
    { defaultPrevented: true, key: "s", metaKey: true },
    { key: "p", metaKey: true },
  ])("ignores an unsafe or unrelated key event %#", (event) => {
    expect(resolveEditorShortcut({ ...baseEvent, ...event })).toBeNull();
  });
});

describe("Markdown keyboard shortcuts", () => {
  it.each([
    [{ key: "b", metaKey: true }, "bold"],
    [{ ctrlKey: true, key: "I" }, "italic"],
    [{ key: "k", metaKey: true }, "link"],
  ] as const)("recognizes %o as %s", (event, action) => {
    expect(resolveMarkdownShortcut({ ...baseEvent, ...event })).toBe(action);
  });

  it.each([
    { key: "b" },
    { altKey: true, ctrlKey: true, key: "b" },
    { key: "b", metaKey: true, shiftKey: true },
    { ctrlKey: true, key: "i", repeat: true },
    { isComposing: true, key: "k", metaKey: true },
    { defaultPrevented: true, key: "b", metaKey: true },
    { key: "s", metaKey: true },
  ])("ignores an unsafe or unrelated key event %#", (event) => {
    expect(resolveMarkdownShortcut({ ...baseEvent, ...event })).toBeNull();
  });
});
