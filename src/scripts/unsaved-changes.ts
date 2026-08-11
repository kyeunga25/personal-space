export class UnsavedChangesTracker {
  private currentRevision = 0;
  private savedRevision = 0;

  get hasUnsavedChanges(): boolean {
    return this.currentRevision !== this.savedRevision;
  }

  markChanged(): void {
    this.currentRevision += 1;
  }

  markSaved(revision: number): boolean {
    if (
      Number.isInteger(revision) &&
      revision > this.savedRevision &&
      revision <= this.currentRevision
    ) {
      this.savedRevision = revision;
    }
    return !this.hasUnsavedChanges;
  }

  snapshot(): number {
    return this.currentRevision;
  }
}

export function warnBeforeUnload(
  event: BeforeUnloadEvent,
  tracker: UnsavedChangesTracker,
): boolean {
  if (!tracker.hasUnsavedChanges) return false;
  event.preventDefault();
  Reflect.set(event, "returnValue", "");
  return true;
}
