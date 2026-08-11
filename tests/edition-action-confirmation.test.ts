import { describe, expect, it, vi } from "vitest";

import { confirmEditionAction } from "../src/scripts/edition-action-confirmation";

describe("Edition action confirmation", () => {
  it("saves without an extra destructive-action prompt", () => {
    const confirm = vi.fn(() => false);

    expect(confirmEditionAction("save", "測試 Edition", confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("explains every public surface before publishing", () => {
    const confirm = vi.fn(() => false);

    expect(confirmEditionAction("publish", "  測試 Edition  ", confirm)).toBe(
      false,
    );
    expect(confirm).toHaveBeenCalledWith(
      "確定發佈「測試 Edition」？這會立即更新公開 Edition 頁面、列表及 RSS。 Publish “測試 Edition” now? This immediately updates the public Edition page, listing, and RSS.",
    );
  });

  it("keeps the archive confirmation", () => {
    const confirm = vi.fn(() => true);

    expect(confirmEditionAction("archive", "測試 Edition", confirm)).toBe(true);
    expect(confirm).toHaveBeenCalledWith(
      "確定封存「測試 Edition」？ Archive “測試 Edition”?",
    );
  });

  it("fails closed for an unknown action", () => {
    const confirm = vi.fn(() => true);

    expect(confirmEditionAction("delete", "測試 Edition", confirm)).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
});
