import { describe, expect, it } from "vitest";

import { isProtectedPath } from "../src/server/auth/route-policy";

describe("protected route policy", () => {
  it.each([
    "/studio",
    "/studio/inbox",
    "/private/posts/example",
    "/api/studio/posts",
  ])("fails closed for %s", (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true);
  });

  it.each(["/", "/stream", "/api/health", "/studio-notes"])(
    "keeps %s public",
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false);
    },
  );
});
