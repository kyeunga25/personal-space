import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  formatEditionItemPosition,
  planEditionItemMove,
} from "../src/scripts/edition-item-order";

const editionPage = readFileSync(
  new URL("../src/pages/studio/editions/[id].astro", import.meta.url),
  "utf8",
);
const editionClient = readFileSync(
  new URL("../src/scripts/studio-edition.ts", import.meta.url),
  "utf8",
);

describe("Edition item ordering", () => {
  it("plans one-position moves without crossing either boundary", () => {
    expect(planEditionItemMove(0, 3, "up")).toBeNull();
    expect(planEditionItemMove(2, 3, "down")).toBeNull();
    expect(planEditionItemMove(0, 3, "down")).toEqual({
      announcement: "已移至第 2 項，共 3 項。 Moved to item 2 of 3.",
      targetIndex: 1,
    });
    expect(planEditionItemMove(2, 3, "up")).toEqual({
      announcement: "已移至第 2 項，共 3 項。 Moved to item 2 of 3.",
      targetIndex: 1,
    });
  });

  it.each([
    [-1, 3],
    [3, 3],
    [0.5, 3],
    [0, 0],
    [0, 2.5],
  ])("rejects an invalid position %s of %s", (index, total) => {
    expect(planEditionItemMove(index, total, "down")).toBeNull();
    expect(formatEditionItemPosition(index, total)).toBeNull();
  });

  it("formats an ordinary-reader-friendly bilingual position", () => {
    expect(formatEditionItemPosition(0, 3)).toBe(
      "第 1 項，共 3 項 · Item 1 of 3",
    );
    expect(formatEditionItemPosition(2, 3)).toBe(
      "第 3 項，共 3 項 · Item 3 of 3",
    );
  });

  it("renders keyboard buttons with initial boundary and position states", () => {
    expect(editionPage).toContain("data-edition-item-list");
    expect(editionPage).toContain("data-edition-item");
    expect(editionPage.match(/data-edition-item-move=/gu)).toHaveLength(2);
    expect(editionPage).toContain('data-edition-item-move="up"');
    expect(editionPage).toContain('data-edition-item-move="down"');
    expect(editionPage).toContain("formatEditionItemPosition(");
    expect(editionPage).toContain("disabled={entryIndex === 0}");
    expect(editionPage).toContain(
      "disabled={entryIndex === edition.entries.length - 1}",
    );
    expect(editionPage).toContain("Move up:");
    expect(editionPage).toContain("Move down:");
    expect(editionPage).toMatch(
      /<button[\s\S]*?type="button"[\s\S]*?data-edition-item-move="up"/u,
    );
  });

  it("moves the existing row, refreshes controls, and marks the form dirty", () => {
    expect(editionClient).toContain("formatEditionItemPosition");
    expect(editionClient).toContain("planEditionItemMove");
    expect(editionClient).toContain('from "./edition-item-order";');
    expect(editionClient).toContain('"[data-edition-item-list]"');
    expect(editionClient).toContain('"[data-edition-item-move]"');
    expect(editionClient).toContain(
      "itemList.insertBefore(item, previousItem)",
    );
    expect(editionClient).toContain(
      "itemList.insertBefore(item, nextItem.nextSibling)",
    );
    expect(editionClient).toContain("updateEditionItemOrderControls()");
    expect(editionClient).toContain("focusTarget?.focus()");
    expect(editionClient).toContain("unsavedChanges.markChanged()");
    expect(editionClient).toContain("move.announcement");
  });

  it("keeps move controls usable on narrow screens", () => {
    expect(editionPage).toMatch(/\.item-order-controls\s*\{/u);
    expect(editionPage).toMatch(
      /\.item-order-controls\s*\{[\s\S]*?flex-wrap:\s*wrap/u,
    );
  });
});
