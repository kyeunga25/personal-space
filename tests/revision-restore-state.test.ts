import { describe, expect, it } from "vitest";

import {
  resolveEditorAutosaveDecision,
  RevisionRestoreRequestGate,
  shouldReloadAfterRevisionRestore,
  shouldScheduleEditorAutosave,
} from "../src/scripts/revision-restore-state";
import { UnsavedChangesTracker } from "../src/scripts/unsaved-changes";

function deferred(): {
  promise: Promise<void>;
  reject: (error: Error) => void;
  resolve: () => void;
} {
  let reject: (error: Error) => void = () => undefined;
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((accept, decline) => {
    reject = decline;
    resolve = accept;
  });
  return { promise, reject, resolve };
}

describe("revision restore state", () => {
  it.each([
    [{ bodyMd: "", postId: "", title: "" }, false],
    [{ bodyMd: "正文", postId: "", title: "" }, true],
    [{ bodyMd: "", postId: "", title: "標題" }, true],
    [{ bodyMd: "  ", postId: "existing-post", title: "  " }, true],
  ] as const)("resolves autosave content %j as %s", (input, expected) => {
    expect(shouldScheduleEditorAutosave(input)).toBe(expected);
  });

  it.each([
    [false, true, "run"],
    [true, true, "retry"],
    [true, false, "suppress"],
    [false, false, "suppress"],
  ] as const)(
    "resolves busy=%s and restoreAllowsAutosave=%s as %s",
    (postRequestBusy, restoreAllowsAutosave, decision) => {
      expect(
        resolveEditorAutosaveDecision({
          postRequestBusy,
          restoreAllowsAutosave,
        }),
      ).toBe(decision);
    },
  );

  it("allows reload after explicitly discarding the confirmed editor state", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const confirmedRevision = tracker.snapshot();

    expect(shouldReloadAfterRevisionRestore(tracker, confirmedRevision)).toBe(
      true,
    );
    expect(tracker.hasUnsavedChanges).toBe(false);
  });

  it("preserves edits made after restore confirmation", () => {
    const tracker = new UnsavedChangesTracker();
    tracker.markChanged();
    const confirmedRevision = tracker.snapshot();
    tracker.markChanged();

    expect(shouldReloadAfterRevisionRestore(tracker, confirmedRevision)).toBe(
      false,
    );
    expect(tracker.hasUnsavedChanges).toBe(true);
  });

  it("blocks autosave only while a revision restore request is active", async () => {
    const request = deferred();
    const gate = new RevisionRestoreRequestGate();

    const pending = gate.run(() => request.promise);
    expect(gate.allowsAutosave).toBe(false);

    request.resolve();
    await pending;
    expect(gate.allowsAutosave).toBe(true);
  });

  it("reopens autosave after a revision restore failure", async () => {
    const request = deferred();
    const gate = new RevisionRestoreRequestGate();
    const pending = gate.run(() => request.promise);

    request.reject(new Error("synthetic restore failure"));

    await expect(pending).rejects.toThrow("synthetic restore failure");
    expect(gate.allowsAutosave).toBe(true);
  });
});
