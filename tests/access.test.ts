import { describe, expect, it } from "vitest";

import {
  isLocalStudioBypassAllowed,
  isOwnerEmail,
  verifyOwnerRequest,
} from "../src/server/auth/access";

describe("Studio owner authorization", () => {
  it("only permits the explicit development bypass", () => {
    const environment = {
      APP_ENV: "development",
      LOCAL_STUDIO_BYPASS: "true",
    };
    expect(isLocalStudioBypassAllowed(environment)).toBe(true);
    expect(
      isLocalStudioBypassAllowed({
        ...environment,
        APP_ENV: "production",
      }),
    ).toBe(false);
    expect(isLocalStudioBypassAllowed({ APP_ENV: "development" })).toBe(false);
  });

  it("matches the configured owner identity case-insensitively", () => {
    expect(isOwnerEmail("Owner@Example.com", "owner@example.com")).toBe(true);
    expect(isOwnerEmail("other@example.com", "owner@example.com")).toBe(false);
  });

  it("fails closed without Access configuration", async () => {
    await expect(
      verifyOwnerRequest(new Request("https://space.example/studio"), {}),
    ).resolves.toBeNull();
  });
});
