import { describe, expect, it } from "vitest";

import {
  getPublicPostDisplayTitle,
  getPublicPostListEmptyState,
} from "../src/lib/post-display";

describe("public post display title", () => {
  it.each([
    [
      { excerpt: "文章摘要", kind: "article", title: "  清晰文章標題  " },
      "清晰文章標題",
    ],
    [
      { excerpt: "  由正文產生的筆記摘要  ", kind: "note", title: null },
      "由正文產生的筆記摘要",
    ],
    [{ excerpt: null, kind: "article", title: null }, "未命名文章"],
    [{ excerpt: " ", kind: "note", title: " " }, "無標題筆記"],
  ] as const)("resolves %j as %s", (post, expected) => {
    expect(getPublicPostDisplayTitle(post)).toBe(expected);
  });
});

describe("dedicated public list empty states", () => {
  it.each([
    [
      "note",
      {
        description: "公開筆記發佈後，會按時間顯示在這裡。",
        descriptionEn:
          "Published notes will appear here in chronological order.",
        title: "暫未有公開筆記",
        titleEn: "No public notes yet",
      },
    ],
    [
      "article",
      {
        description: "公開文章發佈後，會按時間顯示在這裡。",
        descriptionEn:
          "Published articles will appear here in chronological order.",
        title: "暫未有公開文章",
        titleEn: "No public articles yet",
      },
    ],
  ] as const)("describes an empty %s list", (kind, expected) => {
    expect(getPublicPostListEmptyState(kind)).toEqual(expected);
  });
});
