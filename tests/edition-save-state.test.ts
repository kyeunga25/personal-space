import { describe, expect, it, vi } from "vitest";

import {
  completeEditionSave,
  EDITION_NEWER_CHANGES_STATUS,
} from "../src/scripts/edition-save-state";
import { UnsavedChangesTracker } from "../src/scripts/unsaved-changes";

describe("Edition save completion", () => {
  it("preserves newer edits instead of reloading an older response", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const submittedRevision = tracker.snapshot();
    tracker.markChanged();
    const reload = vi.fn();
    const showStatus = vi.fn();

    expect(
      completeEditionSave({
        hasWorkingCopy: false,
        reload,
        revision: submittedRevision,
        showStatus,
        tracker,
      }),
    ).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(showStatus).toHaveBeenCalledWith(EDITION_NEWER_CHANGES_STATUS, true);
    expect(tracker.hasUnsavedChanges).toBe(true);
  });

  it.each([
    [false, "Edition 已儲存。 Saved."],
    [true, "Edition 工作副本已儲存。 Working copy saved."],
  ])(
    "reloads a current save with working-copy state %s",
    (hasWorkingCopy, status) => {
      const tracker = new UnsavedChangesTracker();
      tracker.markChanged();
      const reload = vi.fn();
      const showStatus = vi.fn();

      expect(
        completeEditionSave({
          hasWorkingCopy,
          reload,
          revision: tracker.snapshot(),
          showStatus,
          tracker,
        }),
      ).toBe(true);
      expect(showStatus).toHaveBeenCalledWith(status);
      expect(reload).toHaveBeenCalledOnce();
      expect(tracker.hasUnsavedChanges).toBe(false);
    },
  );
});
