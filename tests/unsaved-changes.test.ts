import { describe, expect, it, vi } from "vitest";

import {
  UnsavedChangesTracker,
  warnBeforeUnload,
} from "../src/scripts/unsaved-changes";

function unloadEventFixture() {
  const preventDefault = vi.fn();
  const state = {
    preventDefault,
    returnValue: "unchanged",
  };
  return {
    event: state as unknown as BeforeUnloadEvent,
    preventDefault,
    state,
  };
}

describe("editor unsaved changes", () => {
  it("does not warn before any persisted field changes", () => {
    const tracker = new UnsavedChangesTracker();
    const { event, preventDefault, state } = unloadEventFixture();

    expect(warnBeforeUnload(event, tracker)).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();
    expect(state.returnValue).toBe("unchanged");
  });

  it("warns while the latest edit has not been saved", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const { event, preventDefault, state } = unloadEventFixture();

    expect(warnBeforeUnload(event, tracker)).toBe(true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(state.returnValue).toBe("");
  });

  it("does not let an older response mark newer changes as saved", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const olderSnapshot = tracker.snapshot();
    tracker.markChanged();

    expect(tracker.markSaved(olderSnapshot)).toBe(false);
    expect(tracker.hasUnsavedChanges).toBe(true);

    expect(tracker.markSaved(tracker.snapshot())).toBe(true);
    expect(tracker.hasUnsavedChanges).toBe(false);
  });
});
