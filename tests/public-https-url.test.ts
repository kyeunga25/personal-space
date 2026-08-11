import { describe, expect, it } from "vitest";

import {
  parsePublicHttpsUrl,
  PUBLIC_HTTPS_URL_MAX_LENGTH,
} from "../src/lib/public-https-url";

describe("public HTTPS URL policy", () => {
  it("accepts a public HTTPS URL and removes its fragment", () => {
    const result = parsePublicHttpsUrl(
      "https://example.com/feed.xml#temporary-fragment",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url.toString()).toBe("https://example.com/feed.xml");
  });

  it.each([
    "http://example.com/feed.xml",
    "https://127.0.0.1/feed.xml",
    "https://[::1]/feed.xml",
    "https://user:@example.com/feed.xml",
    "https://localhost./feed.xml",
    "https://service.internal./feed.xml",
    "https://example.local./feed.xml",
    "https://example.com:8443/feed.xml",
  ])("rejects a non-public HTTPS target: %s", (value) => {
    expect(parsePublicHttpsUrl(value)).toEqual({
      ok: false,
      reason: "not-public-https",
    });
  });

  it("distinguishes malformed and overlong values", () => {
    expect(parsePublicHttpsUrl("not a URL")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(
      parsePublicHttpsUrl(
        `https://example.com/${"a".repeat(PUBLIC_HTTPS_URL_MAX_LENGTH)}`,
      ),
    ).toEqual({ ok: false, reason: "too-long" });
  });

  it("accepts the exact shared length boundary", () => {
    const prefix = "https://example.com/";
    const value = `${prefix}${"a".repeat(
      PUBLIC_HTTPS_URL_MAX_LENGTH - prefix.length,
    )}`;

    expect(parsePublicHttpsUrl(value).ok).toBe(true);
  });
});
