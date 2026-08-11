import { UnsavedChangesTracker } from "./unsaved-changes";

interface SourceSaveCompletionInput {
  allTrackers: Iterable<UnsavedChangesTracker>;
  reload: () => void;
  revision: number;
  setSourceId: (sourceId: string) => void;
  showStatus: (message: string, error?: boolean) => void;
  sourceId: string;
  tracker: UnsavedChangesTracker;
}

export type SourceSaveCompletion =
  "newer-changes" | "other-changes" | "reloaded";

export const SOURCE_NEWER_CHANGES_STATUS =
  "來源提交版本已儲存，但有較新修改未儲存；畫面已保留。 The submitted source version was saved, but newer changes remain unsaved.";
export const SOURCE_OTHER_CHANGES_STATUS =
  "來源已儲存；其他來源仍有未儲存修改，畫面已保留。 Source saved; unsaved changes in another source were preserved.";
export const SOURCE_SYNC_PRESERVED_STATUS =
  "同步完成；未儲存的來源修改已保留。 Sync complete; unsaved source changes were preserved.";

export function completeSourceSave({
  allTrackers,
  reload,
  revision,
  setSourceId,
  showStatus,
  sourceId,
  tracker,
}: SourceSaveCompletionInput): SourceSaveCompletion {
  setSourceId(sourceId);
  if (!tracker.markSaved(revision)) {
    showStatus(SOURCE_NEWER_CHANGES_STATUS, true);
    return "newer-changes";
  }
  if ([...allTrackers].some((candidate) => candidate.hasUnsavedChanges)) {
    showStatus(SOURCE_OTHER_CHANGES_STATUS, true);
    return "other-changes";
  }

  showStatus("來源已儲存。 Saved.");
  reload();
  return "reloaded";
}
