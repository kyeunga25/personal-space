import type { UnsavedChangesTracker } from "./unsaved-changes";

export const REVISION_RESTORE_NEWER_CHANGES_TOAST =
  "修訂已還原；較新修改令畫面未重新載入。目前修改仍未儲存；請儲存或重新載入。 Revision restored; newer edits kept this screen open. Current changes remain unsaved; save or reload.";

interface EditorAutosaveState {
  postRequestBusy: boolean;
  restoreAllowsAutosave: boolean;
}

interface EditorAutosaveContent {
  bodyMd: string;
  postId: string;
  title: string;
}

export type EditorAutosaveDecision = "retry" | "run" | "suppress";

export function shouldScheduleEditorAutosave({
  bodyMd,
  postId,
  title,
}: EditorAutosaveContent): boolean {
  return Boolean(postId.trim() || bodyMd.trim() || title.trim());
}

export function resolveEditorAutosaveDecision({
  postRequestBusy,
  restoreAllowsAutosave,
}: EditorAutosaveState): EditorAutosaveDecision {
  if (!restoreAllowsAutosave) return "suppress";
  return postRequestBusy ? "retry" : "run";
}

export class RevisionRestoreRequestGate {
  private active = false;

  get allowsAutosave(): boolean {
    return !this.active;
  }

  async run<T>(request: () => Promise<T>): Promise<T> {
    this.active = true;
    try {
      return await request();
    } finally {
      this.active = false;
    }
  }
}

export function shouldReloadAfterRevisionRestore(
  tracker: UnsavedChangesTracker,
  confirmedRevision: number,
): boolean {
  if (tracker.snapshot() !== confirmedRevision) return false;
  return tracker.markSaved(confirmedRevision);
}
