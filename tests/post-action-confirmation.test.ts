import { describe, expect, it, vi } from "vitest";

import {
  ARTICLE_TITLE_REQUIRED_ERROR,
  POST_CONTENT_REQUIRED_ERROR,
} from "../src/config/publishing";
import {
  buildPostArchiveMessage,
  confirmPostArchive,
  getPostArchiveReadinessError,
} from "../src/scripts/post-action-confirmation";

describe("post archive confirmation", () => {
  it("names the content and explains retention before archiving", () => {
    expect(
      buildPostArchiveMessage({
        bodyMd: "正文",
        kind: "article",
        title: "  虛構文章  ",
      }),
    ).toBe(
      "確定封存「虛構文章」？封存後不會出現在公開網站，內容仍保留在 Studio。 Archive “虛構文章”? After archiving, it will not be available on the public site and will remain in Studio.",
    );
  });

  it("uses a bilingual fallback for an untitled note", () => {
    expect(
      buildPostArchiveMessage({ bodyMd: "正文", kind: "note", title: "   " }),
    ).toContain("無標題筆記 · Untitled note");
  });

  it.each([
    {
      error: POST_CONTENT_REQUIRED_ERROR,
      input: { bodyMd: "  ", kind: "note", title: "" },
    },
    {
      error: ARTICLE_TITLE_REQUIRED_ERROR,
      input: { bodyMd: "Body", kind: "article", title: "  " },
    },
  ])(
    "returns the shared readiness error before prompting",
    ({ error, input }) => {
      const confirm = vi.fn(() => true);

      expect(getPostArchiveReadinessError(input)).toBe(error);
      expect(confirmPostArchive(input, confirm)).toBe("invalid");
      expect(confirm).not.toHaveBeenCalled();
    },
  );

  it("fails closed without prompting for an unknown content type", () => {
    const confirm = vi.fn(() => true);

    expect(
      confirmPostArchive(
        { bodyMd: "Body", kind: "page", title: "Title" },
        confirm,
      ),
    ).toBe("invalid");
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([
    [false, "cancelled"],
    [true, "confirmed"],
  ] as const)("returns %s confirmation as %s", (answer, decision) => {
    const confirm = vi.fn(() => answer);

    expect(
      confirmPostArchive(
        {
          bodyMd: "Body",
          kind: "note",
          title: '<img src=x onerror="alert(1)">',
        },
        confirm,
      ),
    ).toBe(decision);
    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('<img src=x onerror="alert(1)">'),
    );
  });
});
