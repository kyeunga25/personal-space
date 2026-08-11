import { describe, expect, it } from "vitest";

import {
  resolveInitialPostSaveState,
  resolvePostSaveNavigation,
  resolvePostSaveToast,
} from "../src/scripts/post-save-state";

describe("initial editor save state", () => {
  it.each([
    ["new", { label: "尚未建立草稿", labelEn: "Draft not created yet" }],
    ["saved", { label: "已儲存", labelEn: "Saved" }],
    [
      "working-copy",
      { label: "工作副本已儲存", labelEn: "Working copy saved" },
    ],
  ] as const)("describes %s content accurately", (state, expected) => {
    expect(resolveInitialPostSaveState(state)).toEqual(expected);
  });

  it("fails closed for an invalid initial state", () => {
    expect(resolveInitialPostSaveState("published")).toBeNull();
  });
});

describe("post-save editor navigation", () => {
  it.each([
    ["archive", "archived", "/studio"],
    ["publish", "published", "/studio/posts/synthetic%2Fpost"],
    ["schedule", "scheduled", "/studio/posts/synthetic%2Fpost"],
  ])("resolves %s / %s to %s", (action, status, destination) => {
    expect(
      resolvePostSaveNavigation(action, status, "synthetic/post", true),
    ).toBe(destination);
  });

  it.each([
    ["archive", "archived", false],
    ["archive", "published", true],
    ["publish", "published", false],
    ["schedule", "draft", true],
    ["save", "archived", true],
  ] as const)(
    "keeps the editor for %s / %s when latest=%s",
    (action, status, savedLatest) => {
      expect(
        resolvePostSaveNavigation(
          action,
          status,
          "synthetic-post",
          savedLatest,
        ),
      ).toBeNull();
    },
  );
});

describe("post-save feedback", () => {
  it.each([
    ["save", false, true, "草稿已儲存。 Draft saved."],
    [
      "save",
      true,
      true,
      "未發佈修改已儲存為工作副本。 Unpublished changes saved as a working copy.",
    ],
    [
      "save",
      false,
      false,
      "較早版本已儲存；較新修改仍未儲存。 Earlier version saved; newer changes remain unsaved.",
    ],
    [
      "save",
      true,
      false,
      "較早的工作副本已儲存；較新修改仍未儲存。 Earlier working copy saved; newer changes remain unsaved.",
    ],
    [
      "publish",
      false,
      false,
      "內容已發佈；較新修改仍未儲存。 Content published; newer changes remain unsaved.",
    ],
    [
      "schedule",
      false,
      false,
      "內容已排程；較新修改仍未儲存。 Content scheduled; newer changes remain unsaved.",
    ],
    [
      "archive",
      false,
      false,
      "內容已封存；較新修改仍未儲存。 Content archived; newer changes remain unsaved.",
    ],
  ] as const)(
    "describes action=%s workingCopy=%s latest=%s",
    (action, hasWorkingCopy, savedLatest, message) => {
      expect(resolvePostSaveToast(action, hasWorkingCopy, savedLatest)).toBe(
        message,
      );
    },
  );

  it("fails closed for an unknown action", () => {
    expect(resolvePostSaveToast("delete", false, true)).toBeNull();
  });
});
