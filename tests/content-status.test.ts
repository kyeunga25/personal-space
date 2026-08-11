import { describe, expect, it } from "vitest";

import {
  formatContentStatus,
  formatEditionItemCount,
} from "../src/lib/content-status";

describe("Studio content status labels", () => {
  it.each([
    ["archived", "已封存 Archived"],
    ["draft", "草稿 Draft"],
    ["published", "已發佈 Published"],
    ["scheduled", "已排程 Scheduled"],
  ] as const)("presents %s bilingually", (status, expected) => {
    expect(formatContentStatus(status)).toBe(expected);
  });

  it("falls back safely for a newer stored status", () => {
    expect(formatContentStatus("legacy" as never)).toBe(
      "未識別內容狀態 Unknown content status",
    );
  });
});

describe("Edition item count labels", () => {
  it.each([
    [0, "0 個項目 0 items"],
    [1, "1 個項目 1 item"],
    [2, "2 個項目 2 items"],
  ] as const)("formats %i items bilingually", (count, expected) => {
    expect(formatEditionItemCount(count)).toBe(expected);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "uses a safe fallback for invalid count %s",
    (count) => {
      expect(formatEditionItemCount(count)).toBe(
        "項目數量不明 Item count unavailable",
      );
    },
  );
});
