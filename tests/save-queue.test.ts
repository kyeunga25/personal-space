import { describe, expect, it, vi } from "vitest";

import { SerialSaveQueue, type SaveRequest } from "../src/scripts/save-queue";

interface VersionedSaveRequest extends SaveRequest {
  version: number;
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

describe("editor save queue", () => {
  it("serializes an autosave queued while another save is running", async () => {
    const firstSave = deferred();
    const calls: SaveRequest[] = [];
    const perform = vi.fn(async (request: SaveRequest) => {
      calls.push(request);
      if (calls.length === 1) await firstSave.promise;
    });
    const queue = new SerialSaveQueue(perform);

    const first = queue.enqueue({ action: "save", quiet: true });
    await Promise.resolve();
    const second = queue.enqueue({ action: "save", quiet: true });

    expect(calls).toEqual([{ action: "save", quiet: true }]);
    firstSave.resolve();
    await Promise.all([first, second]);

    expect(calls).toEqual([
      { action: "save", quiet: true },
      { action: "save", quiet: true },
    ]);
    expect(perform).toHaveBeenCalledTimes(2);
  });

  it("keeps a confirmed action ahead of a later autosave snapshot", async () => {
    const firstSave = deferred();
    const calls: VersionedSaveRequest[] = [];
    const queue = new SerialSaveQueue<VersionedSaveRequest>(async (request) => {
      calls.push(request);
      if (calls.length === 1) await firstSave.promise;
    });

    const idle = queue.enqueue({ action: "save", quiet: true, version: 1 });
    await Promise.resolve();
    void queue.enqueue({ action: "publish", quiet: false, version: 2 });
    void queue.enqueue({ action: "save", quiet: true, version: 3 });

    firstSave.resolve();
    await idle;

    expect(calls).toEqual([
      { action: "save", quiet: true, version: 1 },
      { action: "publish", quiet: false, version: 2 },
      { action: "save", quiet: true, version: 3 },
    ]);
  });

  it("coalesces autosaves with the latest data and visible feedback", async () => {
    const firstSave = deferred();
    const calls: VersionedSaveRequest[] = [];
    const queue = new SerialSaveQueue<VersionedSaveRequest>(async (request) => {
      calls.push(request);
      if (calls.length === 1) await firstSave.promise;
    });

    const idle = queue.enqueue({ action: "save", quiet: true, version: 1 });
    await Promise.resolve();
    void queue.enqueue({ action: "save", quiet: true, version: 2 });
    void queue.enqueue({ action: "save", quiet: false, version: 3 });

    firstSave.resolve();
    await idle;

    expect(calls).toEqual([
      { action: "save", quiet: true, version: 1 },
      { action: "save", quiet: false, version: 3 },
    ]);
  });

  it("keeps visible feedback when queued manual and quiet saves coalesce", async () => {
    const firstSave = deferred();
    const calls: SaveRequest[] = [];
    const queue = new SerialSaveQueue(async (request) => {
      calls.push(request);
      if (calls.length === 1) await firstSave.promise;
    });

    const idle = queue.enqueue({ action: "save", quiet: true });
    await Promise.resolve();
    void queue.enqueue({ action: "save", quiet: false });
    void queue.enqueue({ action: "save", quiet: true });

    firstSave.resolve();
    await idle;

    expect(calls.at(-1)).toEqual({ action: "save", quiet: false });
  });
});
