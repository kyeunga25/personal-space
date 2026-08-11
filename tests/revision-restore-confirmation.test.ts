import { describe, expect, it, vi } from "vitest";

import {
  buildRevisionRestoreMessage,
  confirmRevisionRestore,
} from "../src/scripts/revision-restore-confirmation";

describe("revision restore confirmation", () => {
  it.each([
    [
      "draft",
      "要把這個修訂版本還原為草稿嗎？ Restore this revision as a draft?",
    ],
    [
      "working-copy",
      "要把這個修訂版本還原為工作副本嗎？公開內容會維持不變。 Restore this revision as a working copy? Public content will remain unchanged.",
    ],
  ])(
    "keeps the concise %s prompt when the editor is clean",
    (target, message) => {
      expect(
        buildRevisionRestoreMessage({
          hasUnsavedChanges: false,
          target,
          title: "虛構文章",
        }),
      ).toBe(message);
    },
  );

  it("names unsaved content and explains loss and recovery before restoring", () => {
    expect(
      buildRevisionRestoreMessage({
        hasUnsavedChanges: true,
        target: "working-copy",
        title: "  虛構文章  ",
      }),
    ).toBe(
      "「虛構文章」目前有未儲存修改。成功還原後，編輯器會重新載入並捨棄這些修改；你可以取消並先儲存。 “虛構文章” has unsaved changes. After a successful restore, the editor will reload and discard them; you can cancel and save first.\n\n要把這個修訂版本還原為工作副本嗎？公開內容會維持不變。 Restore this revision as a working copy? Public content will remain unchanged.",
    );
  });

  it("uses a bilingual fallback for untitled unsaved content", () => {
    expect(
      buildRevisionRestoreMessage({
        hasUnsavedChanges: true,
        target: "draft",
        title: "   ",
      }),
    ).toContain("未命名內容 · Untitled content");
  });

  it("fails closed without prompting for an unknown restore target", () => {
    const confirm = vi.fn(() => true);

    expect(
      confirmRevisionRestore(
        {
          hasUnsavedChanges: true,
          target: "published",
          title: "虛構文章",
        },
        confirm,
      ),
    ).toBe("invalid");
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([
    [false, "cancelled"],
    [true, "confirmed"],
  ] as const)("maps a %s answer to %s", (answer, decision) => {
    const confirm = vi.fn(() => answer);

    expect(
      confirmRevisionRestore(
        {
          hasUnsavedChanges: true,
          target: "draft",
          title: "虛構文章",
        },
        confirm,
      ),
    ).toBe(decision);
    expect(confirm).toHaveBeenCalledOnce();
  });
});
