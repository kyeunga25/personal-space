import { describe, expect, it } from "vitest";

import { editionSourceLinkLabel } from "../src/lib/edition-source-link";

describe("edition source link", () => {
  it("names the source entry and announces the new tab", () => {
    expect(editionSourceLinkLabel("  虛構新聞標題  ")).toBe(
      "閱讀原文：虛構新聞標題（新分頁） · Read source (new tab)",
    );
  });

  it("uses a bilingual fallback for a blank source title", () => {
    expect(editionSourceLinkLabel("   ")).toBe(
      "閱讀原文：未命名來源 · Untitled source（新分頁） · Read source (new tab)",
    );
  });
});
