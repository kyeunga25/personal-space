import { describe, expect, it } from "vitest";

import {
  isPostRequestBusy,
  runWithPostRequestControls,
} from "../src/scripts/post-request-controls";

function controlFixture(disabled = false) {
  return { disabled };
}

function busyTargetFixture(initial?: string) {
  const attributes = new Map<string, string>();
  if (initial !== undefined) attributes.set("aria-busy", initial);
  return {
    attributes,
    getAttribute(name: string) {
      return attributes.get(name) ?? null;
    },
    removeAttribute(name: string) {
      attributes.delete(name);
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
  };
}

describe("post request controls", () => {
  it("recognizes only an active busy state", () => {
    expect(isPostRequestBusy(busyTargetFixture("true"))).toBe(true);
    expect(isPostRequestBusy(busyTargetFixture("false"))).toBe(false);
    expect(isPostRequestBusy(busyTargetFixture())).toBe(false);
  });

  it("locks unique controls and restores their original states", async () => {
    const enabled = controlFixture();
    const alreadyDisabled = controlFixture(true);
    const busyTarget = busyTargetFixture();
    let resolveRequest: (value: string) => void = () => undefined;
    const request = new Promise<string>((resolve) => {
      resolveRequest = resolve;
    });

    const pending = runWithPostRequestControls(
      [enabled, alreadyDisabled, enabled],
      busyTarget,
      () => request,
    );

    expect(enabled.disabled).toBe(true);
    expect(alreadyDisabled.disabled).toBe(true);
    expect(busyTarget.attributes.get("aria-busy")).toBe("true");

    resolveRequest("saved");
    await expect(pending).resolves.toBe("saved");

    expect(enabled.disabled).toBe(false);
    expect(alreadyDisabled.disabled).toBe(true);
    expect(busyTarget.attributes.has("aria-busy")).toBe(false);
  });

  it("restores controls and a prior busy value after failure", async () => {
    const control = controlFixture();
    const busyTarget = busyTargetFixture("false");

    await expect(
      runWithPostRequestControls([control], busyTarget, () =>
        Promise.reject(new Error("synthetic failure")),
      ),
    ).rejects.toThrow("synthetic failure");

    expect(control.disabled).toBe(false);
    expect(busyTarget.attributes.get("aria-busy")).toBe("false");
  });
});
