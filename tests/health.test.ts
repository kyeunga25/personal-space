import { describe, expect, it } from "vitest";

import { GET } from "../src/pages/api/health";

describe("health endpoint", () => {
  it("reports the public release version without caching", async () => {
    const response = await GET({} as never);

    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      service: "personal-space",
      status: "ok",
      version: "v0.7.0",
    });
  });
});
