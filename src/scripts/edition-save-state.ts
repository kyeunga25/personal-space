import { UnsavedChangesTracker } from "./unsaved-changes";

interface EditionSaveCompletionInput {
  hasWorkingCopy: boolean;
  reload: () => void;
  revision: number;
  showStatus: (message: string, error?: boolean) => void;
  tracker: UnsavedChangesTracker;
}

export const EDITION_NEWER_CHANGES_STATUS =
  "有較新修改未儲存，畫面已保留。 Newer changes are unsaved; this editor has been preserved.";

export function completeEditionSave({
  hasWorkingCopy,
  reload,
  revision,
  showStatus,
  tracker,
}: EditionSaveCompletionInput): boolean {
  if (!tracker.markSaved(revision)) {
    showStatus(EDITION_NEWER_CHANGES_STATUS, true);
    return false;
  }

  showStatus(
    hasWorkingCopy
      ? "Edition 工作副本已儲存。 Working copy saved."
      : "Edition 已儲存。 Saved.",
  );
  reload();
  return true;
}
