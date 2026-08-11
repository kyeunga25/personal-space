type Confirm = (message: string) => boolean;
type RevisionRestoreTarget = "draft" | "working-copy";

interface RevisionRestoreConfirmationInput {
  hasUnsavedChanges: boolean;
  target: string;
  title: string;
}

export type RevisionRestoreDecision = "cancelled" | "confirmed" | "invalid";

export const REVISION_RESTORE_STATE_ERROR =
  "還原目標無效，操作已取消。 Restore target is invalid; the action was cancelled.";

function isRevisionRestoreTarget(
  value: string,
): value is RevisionRestoreTarget {
  return value === "draft" || value === "working-copy";
}

export function buildRevisionRestoreMessage({
  hasUnsavedChanges,
  target,
  title,
}: RevisionRestoreConfirmationInput): string | null {
  if (!isRevisionRestoreTarget(target)) return null;

  const restoreMessage =
    target === "working-copy"
      ? "要把這個修訂版本還原為工作副本嗎？公開內容會維持不變。 Restore this revision as a working copy? Public content will remain unchanged."
      : "要把這個修訂版本還原為草稿嗎？ Restore this revision as a draft?";
  if (!hasUnsavedChanges) return restoreMessage;

  const postTitle = title.trim() || "未命名內容 · Untitled content";
  return `「${postTitle}」目前有未儲存修改。成功還原後，編輯器會重新載入並捨棄這些修改；你可以取消並先儲存。 “${postTitle}” has unsaved changes. After a successful restore, the editor will reload and discard them; you can cancel and save first.\n\n${restoreMessage}`;
}

export function confirmRevisionRestore(
  input: RevisionRestoreConfirmationInput,
  confirm: Confirm,
): RevisionRestoreDecision {
  const message = buildRevisionRestoreMessage(input);
  if (!message) return "invalid";
  return confirm(message) ? "confirmed" : "cancelled";
}
