import { describe, expect, it } from "vitest";

import {
  SECURITY_HEADERS,
  withSecurityHeaders,
} from "../src/server/http/security-headers";

describe("security response headers", () => {
  it("applies the complete baseline without dropping route headers", async () => {
    const response = withSecurityHeaders(
      new Response("ok", {
        headers: {
          "Cache-Control": "private, no-store",
        },
        status: 202,
      }),
    );

    expect(response.status).toBe(202);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.text()).toBe("ok");

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });

  it("blocks framing and unsafe default resource origins", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain(
      "default-src 'self'",
    );
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
  });
});
