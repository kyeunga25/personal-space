import { describe, expect, it } from "vitest";

import {
  buildPublishConfirmation,
  getPublishReadinessError,
  getPostVisibilitySummary,
  updatePublishConfirmation,
  updatePostVisibilityEffect,
  updatePostVisibilitySummary,
} from "../src/scripts/publish-confirmation";

describe("publish confirmation summary", () => {
  it.each([
    [
      "public",
      "公開 · Public",
      "會立即出現在公開網站及適用的列表。 Immediately available on the public site and eligible listings.",
    ],
    [
      "unlisted",
      "不公開列出 · Unlisted",
      "可經精確連結讀取，但不會出現在列表或搜尋。 Available by exact link, but omitted from listings and search.",
    ],
    [
      "private",
      "私人 · Private",
      "只限 Studio，不會出現在公開網站。 Studio only; not available on the public site.",
    ],
  ])("explains the %s visibility consequence", (visibility, label, effect) => {
    expect(
      buildPublishConfirmation({
        bodyMd: "正文",
        kind: "article",
        title: "  虛構文章  ",
        visibility,
      }),
    ).toEqual({
      effect,
      readiness: "內容已準備 · Content ready · 1 分鐘閱讀 · 1 min read",
      title: "虛構文章",
      visibility: label,
    });
  });

  it("uses a bilingual fallback for an untitled note", () => {
    expect(
      buildPublishConfirmation({
        bodyMd: "正文",
        kind: "note",
        title: "   ",
        visibility: "private",
      }),
    ).toMatchObject({
      readiness: "內容已準備 · Content ready",
      title: "無標題筆記 · Untitled note",
    });
  });

  it.each([
    { bodyMd: "Body", kind: "page", title: "Title", visibility: "public" },
    {
      bodyMd: "Body",
      kind: "article",
      title: "Title",
      visibility: "friends",
    },
  ])("fails closed for an invalid editor state", (input) => {
    expect(buildPublishConfirmation(input)).toBeNull();
  });

  it("returns the same readiness errors as server publication", () => {
    expect(
      getPublishReadinessError({
        bodyMd: "  ",
        kind: "article",
        title: "Title",
        visibility: "public",
      }),
    ).toBe(
      "發佈、排程或封存前必須有內容。 Content is required before publishing, scheduling, or archiving.",
    );
    expect(
      getPublishReadinessError({
        bodyMd: "Body",
        kind: "article",
        title: "  ",
        visibility: "public",
      }),
    ).toBe(
      "文章在發佈、排程或封存前必須有標題。 Articles require a title before publishing, scheduling, or archiving.",
    );
  });

  it("refreshes text-only targets from the latest form state", () => {
    const targets = {
      effect: { textContent: "stale effect" },
      readiness: { textContent: "stale readiness" },
      title: { textContent: "stale title" },
      visibility: { textContent: "stale visibility" },
    };

    expect(
      updatePublishConfirmation(targets, {
        bodyMd: "正文",
        kind: "note",
        title: '<img src=x onerror="alert(1)">',
        visibility: "unlisted",
      }),
    ).toBe(true);
    expect(targets.title.textContent).toBe('<img src=x onerror="alert(1)">');
    expect(targets.readiness.textContent).toBe("內容已準備 · Content ready");
    expect(targets.visibility.textContent).toBe("不公開列出 · Unlisted");
    expect(targets.effect.textContent).toContain("exact link");
  });

  it("updates a preview visibility status without trusting HTML", () => {
    const attributes = new Map<string, string>();
    const targets = {
      container: {
        setAttribute(name: string, value: string) {
          attributes.set(name, value);
        },
      },
      effect: { textContent: "previous effect" },
      label: { textContent: "previous label" },
    };

    expect(updatePostVisibilitySummary(targets, "public")).toBe(true);
    expect(targets.label.textContent).toBe("公開 · Public");
    expect(targets.effect.textContent).toContain("public site");
    expect(attributes.get("data-visibility")).toBe("public");

    expect(updatePostVisibilitySummary(targets, "friends")).toBe(false);
    expect(targets.label.textContent).toBe("公開 · Public");
    expect(targets.effect.textContent).toContain("public site");
    expect(attributes.get("data-visibility")).toBe("public");
  });

  it("returns no visibility summary for an invalid state", () => {
    expect(getPostVisibilitySummary("friends")).toBeNull();
  });

  it.each([
    [
      "private",
      "只限 Studio，不會出現在公開網站。 Studio only; not available on the public site.",
    ],
    [
      "unlisted",
      "可經精確連結讀取，但不會出現在列表或搜尋。 Available by exact link, but omitted from listings and search.",
    ],
    [
      "public",
      "會立即出現在公開網站及適用的列表。 Immediately available on the public site and eligible listings.",
    ],
  ])(
    "updates the %s editor visibility effect as text",
    (visibility, effect) => {
      const target = { textContent: "previous" };

      expect(updatePostVisibilityEffect(target, visibility)).toBe(true);
      expect(target.textContent).toBe(effect);
    },
  );

  it("preserves visibility feedback for an invalid state", () => {
    const target = { textContent: "previous" };

    expect(updatePostVisibilityEffect(target, "friends")).toBe(false);
    expect(target.textContent).toBe("previous");
  });
});
