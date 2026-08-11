import { describe, expect, it } from "vitest";

import {
  accessJwksForIssuer,
  isCompactAccessToken,
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

  it("rejects malformed or oversized Access tokens before verification", () => {
    expect(isCompactAccessToken("header.payload.signature")).toBe(true);
    expect(isCompactAccessToken("missing-segments")).toBe(false);
    expect(isCompactAccessToken("header.payload.bad+signature")).toBe(false);
    expect(isCompactAccessToken(`header.${"a".repeat(16_384)}.signature`)).toBe(
      false,
    );
  });

  it("reuses the remote key resolver for the same trusted issuer", () => {
    const issuer = "https://team.example";
    expect(accessJwksForIssuer(issuer)).toBe(accessJwksForIssuer(issuer));
    expect(accessJwksForIssuer("https://other.example")).not.toBe(
      accessJwksForIssuer(issuer),
    );
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
