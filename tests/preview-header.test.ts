import { describe, expect, it } from "vitest";

import { POST_INPUT_LIMITS } from "../src/config/publishing";
import {
  getPreviewHeaderContent,
  getPreviewReadingTimeContent,
  getPreviewTaxonomyContent,
  updatePreviewHeaderOutput,
  updatePreviewReadingTimeOutput,
  updatePreviewTaxonomyOutput,
} from "../src/scripts/preview-header";
import { EDITOR_TAGS_ERROR } from "../src/scripts/editor-input";

describe("editor preview header", () => {
  it("shows an article title and excerpt like the public reading header", () => {
    expect(
      getPreviewHeaderContent({
        excerpt: "  給一般讀者的簡短摘要。  ",
        kind: "article",
        title: "  容易理解的文章標題  ",
      }),
    ).toEqual({
      excerpt: "給一般讀者的簡短摘要。",
      showExcerpt: true,
      title: "容易理解的文章標題",
    });
  });

  it("uses the excerpt as the heading without repeating it", () => {
    expect(
      getPreviewHeaderContent({
        excerpt: "文章仍未命名",
        kind: "article",
        title: " ",
      }),
    ).toEqual({
      excerpt: "",
      showExcerpt: false,
      title: "文章仍未命名",
    });
  });

  it.each([
    ["article", "未命名文章 · Untitled article"],
    ["note", "無標題筆記 · Untitled note"],
  ] as const)("uses a bilingual fallback for an empty %s", (kind, title) => {
    expect(getPreviewHeaderContent({ excerpt: "", kind, title: "" })).toEqual({
      excerpt: "",
      showExcerpt: false,
      title,
    });
  });

  it("writes untrusted preview text as text and restores excerpt visibility", () => {
    const output = {
      excerpt: { hidden: true, textContent: "上一個摘要" },
      title: { textContent: "上一個標題" },
    };

    updatePreviewHeaderOutput(output, {
      excerpt: "<script>alert('excerpt')</script>",
      kind: "article",
      title: '<img src=x onerror="alert(1)">',
    });

    expect(output).toEqual({
      excerpt: {
        hidden: false,
        textContent: "<script>alert('excerpt')</script>",
      },
      title: { textContent: '<img src=x onerror="alert(1)">' },
    });

    updatePreviewHeaderOutput(output, {
      excerpt: "",
      kind: "note",
      title: "",
    });

    expect(output).toEqual({
      excerpt: { hidden: true, textContent: "" },
      title: { textContent: "無標題筆記 · Untitled note" },
    });
  });

  it("matches public reading time for articles and keeps notes compact", () => {
    expect(getPreviewReadingTimeContent("article", "a".repeat(501))).toEqual({
      label: "2 分鐘閱讀",
      labelEn: "2 min read",
      show: true,
    });
    expect(getPreviewReadingTimeContent("note", "a".repeat(501))).toEqual({
      label: "",
      labelEn: "",
      show: false,
    });
  });

  it("updates reading time as text and clears it when changing to a note", () => {
    const output = {
      container: { hidden: true },
      label: { textContent: "上一個估算" },
      labelEn: { textContent: "Previous estimate" },
    };

    updatePreviewReadingTimeOutput(output, "article", "a".repeat(1_001));
    expect(output).toEqual({
      container: { hidden: false },
      label: { textContent: "3 分鐘閱讀" },
      labelEn: { textContent: "3 min read" },
    });

    updatePreviewReadingTimeOutput(output, "note", "a".repeat(1_001));
    expect(output).toEqual({
      container: { hidden: true },
      label: { textContent: "" },
      labelEn: { textContent: "" },
    });
  });

  it("matches published taxonomy normalization and de-duplicates tags", () => {
    expect(
      getPreviewTaxonomyContent(
        "  網站設計  ",
        "  易用性, EASY-USE, easy use, 🎨, 繁體中文  ",
      ),
    ).toEqual({
      items: ["網站設計", "#易用性", "#easy use", "#繁體中文"],
      show: true,
    });
    expect(getPreviewTaxonomyContent("🎨", "")).toEqual({
      items: [],
      show: false,
    });
  });

  it("preserves the existing tag validation boundary", () => {
    expect(() =>
      getPreviewTaxonomyContent("分類", "x".repeat(POST_INPUT_LIMITS.tag + 1)),
    ).toThrow(EDITOR_TAGS_ERROR);
  });

  it("writes taxonomy as plain text and restores its empty state", () => {
    const output = {
      container: { hidden: true },
      items: { textContent: "上一個分類" },
    };

    updatePreviewTaxonomyOutput(output, {
      items: ["<img src=x onerror=alert(1)>", "#<script>"],
      show: true,
    });
    expect(output).toEqual({
      container: { hidden: false },
      items: { textContent: "<img src=x onerror=alert(1)> · #<script>" },
    });

    updatePreviewTaxonomyOutput(output, { items: [], show: false });
    expect(output).toEqual({
      container: { hidden: true },
      items: { textContent: "" },
    });
  });
});
