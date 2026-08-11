import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({ env: {} }));

import { PUT } from "../src/pages/api/studio/editions/[id]";

describe("Edition save route", () => {
  it("rejects invalid input with a bilingual error", async () => {
    const request = new Request("http://localhost/api/studio/editions/test", {
      body: "{}",
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const response = await PUT({
      params: { id: "synthetic-edition" },
      request,
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Edition 格式不正確。 Edition data is invalid.",
    });
  });
});
