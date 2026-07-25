import { describe, expect, it, vi } from "vitest";

import { UserFacingError } from "../src/server/errors";
import {
  errorResponse,
  MAX_JSON_BODY_BYTES,
  readJsonBody,
} from "../src/server/http/json";

describe("Studio JSON handling", () => {
  it("returns null for malformed or oversized JSON", async () => {
    await expect(
      readJsonBody(
        new Request("https://example.test/api", {
          body: "{broken",
          method: "POST",
        }),
      ),
    ).resolves.toBeNull();

    await expect(
      readJsonBody(
        new Request("https://example.test/api", {
          body: "{}",
          headers: { "Content-Length": String(MAX_JSON_BODY_BYTES + 1) },
          method: "POST",
        }),
      ),
    ).resolves.toBeNull();
  });

  it("exposes only approved request errors", async () => {
    const expected = errorResponse(new UserFacingError("請修正輸入。", 422));
    expect(expected.status).toBe(422);
    await expect(expected.json()).resolves.toEqual({ error: "請修正輸入。" });

    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const hidden = errorResponse(new Error("private provider detail"));
    expect(hidden.status).toBe(500);
    await expect(hidden.json()).resolves.toEqual({
      error: "暫時無法完成要求。",
    });
    expect(log).toHaveBeenCalledWith("Studio request failed", {
      errorType: "Error",
    });
    log.mockRestore();
  });
});
