import { describe, expect, it } from "vitest";

import {
  isLocalStudioBypassAllowed,
  isLoopbackRequest,
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

  it("limits the development bypass to loopback requests", async () => {
    const environment = {
      APP_ENV: "development",
      LOCAL_STUDIO_BYPASS: "true",
    };
    expect(isLoopbackRequest(new Request("http://127.0.0.1/studio"))).toBe(
      true,
    );
    expect(isLoopbackRequest(new Request("https://space.example/studio"))).toBe(
      false,
    );
    await expect(
      verifyOwnerRequest(new Request("http://localhost/studio"), environment),
    ).resolves.toMatchObject({ subject: "local-owner" });
    await expect(
      verifyOwnerRequest(
        new Request("https://space.example/studio"),
        environment,
      ),
    ).resolves.toBeNull();
  });
});
