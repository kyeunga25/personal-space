import { describe, expect, it } from "vitest";

import { POST_INPUT_LIMITS } from "../src/config/publishing";
import {
  EDITOR_TAGS_ERROR,
  EDITOR_TAGS_INPUT_MAX_LENGTH,
  getEditorBodyFeedback,
  getEditorCategoryFeedback,
  getEditorCharacterCount,
  getEditorAutofocusTarget,
  getEditorExcerptFeedback,
  getEditorHeading,
  getEditorSlugFeedback,
  getEditorTagsFeedback,
  getEditorTitleFeedback,
  parseEditorTags,
  updateEditorCategoryFeedback,
  updateEditorBodyFeedback,
  updateEditorExcerptFeedback,
  updateEditorHeading,
  updateEditorSlugFeedback,
  updateEditorTagsFeedback,
  updateEditorTitleFeedback,
} from "../src/scripts/editor-input";

describe("editor publishing input", () => {
  it.each([
    ["article", true, "title"],
    ["note", true, "bodyMd"],
    ["article", false, null],
    ["note", false, null],
    ["page", true, null],
  ] as const)("focuses %s new=%s on %s", (kind, isNew, expected) => {
    expect(getEditorAutofocusTarget(kind, isNew)).toBe(expected);
  });

  it.each([
    [
      { bodyMd: "  ", kind: "article" },
      {
        label:
          "草稿可先留空。 Drafts may be saved empty. 發佈、排程或封存前必須有內容。 Content is required before publishing, scheduling, or archiving.",
        state: "required",
      },
    ],
    [
      { bodyMd: "a".repeat(501), kind: "article" },
      {
        label:
          "正文已填寫；公開文章會顯示「2 分鐘閱讀 · 2 min read」。 Body added; public articles show this reading time.",
        state: "ready",
      },
    ],
    [
      { bodyMd: "簡短筆記", kind: "note" },
      {
        label:
          "正文已填寫；公開筆記維持精簡，不顯示閱讀時間。 Body added; public notes stay compact without reading time.",
        state: "ready",
      },
    ],
  ] as const)("explains body behavior for %j", (input, expected) => {
    expect(getEditorBodyFeedback(input)).toEqual(expected);
  });

  it("updates body guidance as text and fails closed for an invalid kind", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    expect(
      updateEditorBodyFeedback(target, { bodyMd: "正文", kind: "note" }),
    ).toBe(true);
    expect(target.dataset.state).toBe("ready");
    expect(target.textContent).toContain("公開筆記維持精簡");
    expect(
      updateEditorBodyFeedback(target, { bodyMd: "Body", kind: "page" }),
    ).toBe(false);
    expect(target.dataset.state).toBe("ready");
  });

  it.each([
    [{ kind: "article", title: "  " }, "未命名文章"],
    [{ kind: "note", title: "" }, "快速筆記"],
    [{ kind: "article", title: "  即時標題  " }, "即時標題"],
  ])("builds the editor heading from %j", (input, expected) => {
    expect(getEditorHeading(input)).toBe(expected);
  });

  it("updates the heading as text and fails closed for an invalid kind", () => {
    const target = { textContent: "previous" };

    expect(
      updateEditorHeading(target, {
        kind: "note",
        title: '<img src=x onerror="alert(1)">',
      }),
    ).toBe(true);
    expect(target.textContent).toBe('<img src=x onerror="alert(1)">');
    expect(updateEditorHeading(target, { kind: "page", title: "Page" })).toBe(
      false,
    );
    expect(target.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  it.each([
    [
      { kind: "article", title: "  " },
      {
        label:
          "草稿可先留空。 Drafts may be saved without a title. 文章在發佈、排程或封存前必須有標題。 Articles require a title before publishing, scheduling, or archiving.",
        state: "required",
      },
    ],
    [
      { kind: "article", title: "清晰文章標題" },
      {
        label: "文章標題已填寫。 Article title is ready.",
        state: "ready",
      },
    ],
    [
      { kind: "note", title: "" },
      {
        label:
          "選填；留空時會以正文自動摘要作為公開標題。 Optional; the generated body excerpt becomes the public title.",
        state: "optional",
      },
    ],
    [
      { kind: "note", title: "筆記標題" },
      {
        label:
          "此標題會顯示於筆記列表及頁面。 This title appears in note listings and on the note page.",
        state: "ready",
      },
    ],
  ] as const)("explains title behavior for %j", (input, expected) => {
    expect(getEditorTitleFeedback(input)).toEqual(expected);
  });

  it("updates title guidance as text and fails closed for an invalid kind", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    expect(updateEditorTitleFeedback(target, { kind: "note", title: "" })).toBe(
      true,
    );
    expect(target).toEqual({
      dataset: { state: "optional" },
      textContent:
        "選填；留空時會以正文自動摘要作為公開標題。 Optional; the generated body excerpt becomes the public title.",
    });
    expect(
      updateEditorTitleFeedback(target, { kind: "page", title: "Page" }),
    ).toBe(false);
    expect(target.dataset.state).toBe("optional");
  });

  it("describes empty, recognized, and ignored categories", () => {
    expect(getEditorCategoryFeedback("  ")).toEqual({
      label: "分類 Category：未設定 None",
      state: "empty",
    });
    expect(getEditorCategoryFeedback("  生活札記  ")).toEqual({
      label: "將使用分類 Category：生活札記",
      state: "normal",
    });
    expect(getEditorCategoryFeedback("！！！")).toEqual({
      label:
        "無法識別此分類，儲存時會視為未分類。 This category is not recognized and will be saved as uncategorized.",
      state: "invalid",
    });
  });

  it("updates category feedback using text only", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    updateEditorCategoryFeedback(target, '<img src=x onerror="alert(1)">');
    expect(target.textContent).toBe(
      '將使用分類 Category：<img src=x onerror="alert(1)">',
    );
    expect(target.dataset.state).toBe("normal");
  });

  it("explains where an article excerpt appears and what blank means", () => {
    expect(getEditorExcerptFeedback("  ")).toEqual({
      label:
        "選填；留空時儲存會從正文自動產生摘要。 Optional; when saved, a summary is generated from the body.",
      state: "empty",
    });
    expect(getEditorExcerptFeedback("給一般讀者的摘要")).toEqual({
      label:
        "將顯示於文章列表、搜尋結果、文章頁與 RSS。 Shown in article lists, search results, the article page, and RSS.",
      state: "ready",
    });
  });

  it("updates excerpt guidance as plain text", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    updateEditorExcerptFeedback(target, "讀者摘要");

    expect(target).toEqual({
      dataset: { state: "ready" },
      textContent:
        "將顯示於文章列表、搜尋結果、文章頁與 RSS。 Shown in article lists, search results, the article page, and RSS.",
    });
  });

  it("normalizes a comma-separated tag list", () => {
    expect(parseEditorTags("  測試標籤， , synthetic-tag  ")).toEqual([
      "測試標籤",
      "synthetic-tag",
    ]);
  });

  it("describes recognized and ignored tags using server taxonomy rules", () => {
    expect(getEditorTagsFeedback("生活，生活, ！！！, Work")).toEqual({
      label: "已識別 Recognized：2 / 12 · 將忽略 Ignored：2",
      state: "notice",
    });
    expect(getEditorTagsFeedback("ＡＢＣ, abc")).toEqual({
      label: "已識別 Recognized：1 / 12 · 將忽略 Ignored：1",
      state: "notice",
    });
    expect(getEditorTagsFeedback("  ")).toEqual({
      label: "標籤 Tags：0 / 12",
      state: "empty",
    });
  });

  it("updates tag feedback as text and exposes invalid input", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    updateEditorTagsFeedback(target, "閱讀，旅行");
    expect(target.textContent).toBe("已識別 Recognized：2 / 12");
    expect(target.dataset.state).toBe("normal");

    updateEditorTagsFeedback(target, "x".repeat(POST_INPUT_LIMITS.tag + 1));
    expect(target.textContent).toBe(EDITOR_TAGS_ERROR);
    expect(target.dataset.state).toBe("invalid");
  });

  it("previews normalized and automatic article paths", () => {
    expect(
      getEditorSlugFeedback({
        originalSlug: "",
        slug: "  My First 文章!  ",
        title: "Ignored title",
      }),
    ).toEqual({
      label: "網址路徑預覽 URL path preview：/articles/my-first-文章",
      state: "normal",
    });
    expect(
      getEditorSlugFeedback({
        originalSlug: "",
        slug: "",
        title: "  由標題建立網址  ",
      }),
    ).toEqual({
      label:
        "自動網址路徑預覽 Automatic URL path preview：/articles/由標題建立網址",
      state: "automatic",
    });
  });

  it("warns when a saved path will lose its existing link", () => {
    expect(
      getEditorSlugFeedback({
        originalSlug: "existing-path",
        slug: "New path",
        title: "Existing title",
      }),
    ).toEqual({
      label:
        "新網址路徑預覽 New URL path preview：/articles/new-path · 已分享的舊連結不會自動轉址 Shared existing links will not redirect.",
      state: "changed",
    });
    expect(
      getEditorSlugFeedback({
        originalSlug: "existing-path",
        slug: "!!!",
        title: "Existing title",
      }),
    ).toEqual({
      label:
        "將改用系統自動代稱；已分享的舊連結不會自動轉址。 A system slug will replace the current path; shared existing links will not redirect.",
      state: "changed",
    });
  });

  it("updates slug feedback using text only", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    updateEditorSlugFeedback(target, {
      originalSlug: "",
      slug: '<img src=x onerror="alert(1)">',
      title: "",
    });
    expect(target.textContent).toBe(
      "網址路徑預覽 URL path preview：/articles/img-src-x-onerror-alert-1",
    );
    expect(target.dataset.state).toBe("normal");
  });

  it("accepts the exact server tag count and length limits", () => {
    const tags = Array.from({ length: POST_INPUT_LIMITS.tags }, (_, index) =>
      String(index).padEnd(POST_INPUT_LIMITS.tag, "x"),
    );

    expect(parseEditorTags(tags.join(", "))).toEqual(tags);
    expect(EDITOR_TAGS_INPUT_MAX_LENGTH).toBe(
      POST_INPUT_LIMITS.tags * POST_INPUT_LIMITS.tag +
        (POST_INPUT_LIMITS.tags - 1) * 2,
    );
  });

  it("rejects more tags than the server accepts", () => {
    const value = Array.from(
      { length: POST_INPUT_LIMITS.tags + 1 },
      (_, index) => `synthetic-${String(index + 1)}`,
    ).join(", ");

    expect(() => parseEditorTags(value)).toThrow(EDITOR_TAGS_ERROR);
  });

  it("rejects a tag longer than the server accepts", () => {
    expect(() =>
      parseEditorTags("x".repeat(POST_INPUT_LIMITS.tag + 1)),
    ).toThrow(EDITOR_TAGS_ERROR);
  });

  it("describes normal, near-limit, and reached-limit character counts", () => {
    expect(getEditorCharacterCount("draft", 10)).toEqual({
      current: 5,
      label: "字元 Characters：5 / 10",
      remaining: 5,
      state: "normal",
    });
    expect(getEditorCharacterCount("x".repeat(9), 10)).toEqual({
      current: 9,
      label: "字元 Characters：9 / 10 · 剩餘 Remaining：1",
      remaining: 1,
      state: "near",
    });
    expect(getEditorCharacterCount("x".repeat(10), 10)).toEqual({
      current: 10,
      label: "字元 Characters：10 / 10 · 已達上限 Limit reached",
      remaining: 0,
      state: "limit",
    });
  });

  it("uses the same title, excerpt, and body limits as server parsing", () => {
    for (const limit of [
      POST_INPUT_LIMITS.title,
      POST_INPUT_LIMITS.excerpt,
      POST_INPUT_LIMITS.bodyMd,
    ]) {
      const count = getEditorCharacterCount("", limit);
      expect(count.label).toContain(`0 / ${limit.toLocaleString("en-US")}`);
      expect(count.state).toBe("normal");
    }
  });
});
