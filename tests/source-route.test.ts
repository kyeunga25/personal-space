import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({ env: {} }));

import { PUT } from "../src/pages/api/studio/sources/[id]";
import { POST } from "../src/pages/api/studio/sources/index";

function invalidRequest(path: string, method: "POST" | "PUT") {
  return new Request(`http://localhost${path}`, {
    body: "{}",
    headers: { "Content-Type": "application/json" },
    method,
  });
}

describe("Source mutation routes", () => {
  it("rejects invalid create input with a bilingual error", async () => {
    const response = await POST({
      request: invalidRequest("/api/studio/sources", "POST"),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "來源格式不正確。 Source data is invalid.",
    });
  });

  it("rejects invalid update input with a bilingual error", async () => {
    const response = await PUT({
      params: { id: "synthetic-source" },
      request: invalidRequest("/api/studio/sources/synthetic-source", "PUT"),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "來源格式不正確。 Source data is invalid.",
    });
  });
});
