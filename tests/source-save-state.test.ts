import { describe, expect, it, vi } from "vitest";

import {
  completeSourceSave,
  SOURCE_NEWER_CHANGES_STATUS,
  SOURCE_OTHER_CHANGES_STATUS,
} from "../src/scripts/source-save-state";
import { UnsavedChangesTracker } from "../src/scripts/unsaved-changes";

function effectsFixture() {
  return {
    reload: vi.fn(),
    setSourceId: vi.fn(),
    showStatus: vi.fn(),
  };
}

describe("source save completion", () => {
  it("preserves newer changes in the submitted source form", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const revision = tracker.snapshot();
    tracker.markChanged();
    const effects = effectsFixture();

    expect(
      completeSourceSave({
        allTrackers: [tracker],
        ...effects,
        revision,
        sourceId: "synthetic-source",
        tracker,
      }),
    ).toBe("newer-changes");
    expect(effects.setSourceId).toHaveBeenCalledWith("synthetic-source");
    expect(effects.reload).not.toHaveBeenCalled();
    expect(effects.showStatus).toHaveBeenCalledWith(
      SOURCE_NEWER_CHANGES_STATUS,
      true,
    );
  });

  it("preserves unsaved changes in another source form", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const otherTracker = new UnsavedChangesTracker();
    otherTracker.markChanged();
    const effects = effectsFixture();

    expect(
      completeSourceSave({
        allTrackers: [tracker, otherTracker],
        ...effects,
        revision: tracker.snapshot(),
        sourceId: "synthetic-source",
        tracker,
      }),
    ).toBe("other-changes");
    expect(effects.reload).not.toHaveBeenCalled();
    expect(effects.showStatus).toHaveBeenCalledWith(
      SOURCE_OTHER_CHANGES_STATUS,
      true,
    );
  });

  it("reloads only after every source form is clean", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const otherTracker = new UnsavedChangesTracker();
    const effects = effectsFixture();

    expect(
      completeSourceSave({
        allTrackers: [tracker, otherTracker],
        ...effects,
        revision: tracker.snapshot(),
        sourceId: "synthetic-source",
        tracker,
      }),
    ).toBe("reloaded");
    expect(effects.showStatus).toHaveBeenCalledWith("來源已儲存。 Saved.");
    expect(effects.reload).toHaveBeenCalledOnce();
  });
});
