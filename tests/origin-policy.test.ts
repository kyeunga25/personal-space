import { describe, expect, it } from "vitest";

import { isSameOriginWrite } from "../src/server/http/origin-policy";

describe("write origin policy", () => {
  it("allows reads without an Origin header", () => {
    expect(isSameOriginWrite(new Request("https://space.example/studio"))).toBe(
      true,
    );
  });

  it("allows same-origin writes", () => {
    const request = new Request("https://space.example/api/studio/posts", {
      headers: {
        Origin: "https://space.example",
        "Sec-Fetch-Site": "same-origin",
      },
      method: "POST",
    });
    expect(isSameOriginWrite(request)).toBe(true);
  });

  it("rejects missing and cross-origin write headers", () => {
    expect(
      isSameOriginWrite(
        new Request("https://space.example/api/studio/posts", {
          method: "POST",
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginWrite(
        new Request("https://space.example/api/studio/posts", {
          headers: {
            Origin: "https://attacker.example",
            "Sec-Fetch-Site": "cross-site",
          },
          method: "POST",
        }),
      ),
    ).toBe(false);
  });
});
