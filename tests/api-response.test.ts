import { describe, expect, it, vi } from "vitest";

import {
  MAX_API_ERROR_MESSAGE_LENGTH,
  readApiResponse,
  requestApiResponse,
  requestPreparedApiResponse,
} from "../src/scripts/api-response";
import {
  EDITOR_TAGS_ERROR,
  parseEditorTags,
} from "../src/scripts/editor-input";

interface ParsedResult {
  id: string;
}

function parseResult(value: unknown): ParsedResult | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof value.id !== "string"
  ) {
    return null;
  }
  return { id: value.id };
}

const fallback =
  "暫時無法完成要求，請重新登入或稍後再試。 Unable to complete the request; sign in again or retry later.";

describe("Studio API response handling", () => {
  it("returns a validated JSON result", async () => {
    const response = Response.json({ id: "synthetic-result" });

    await expect(
      readApiResponse(response, parseResult, fallback),
    ).resolves.toEqual({ id: "synthetic-result" });
  });

  it("preserves an approved API error", async () => {
    const response = Response.json(
      { error: "內容已更新，請重新載入。 Reload and try again." },
      { status: 409 },
    );

    await expect(
      readApiResponse(response, parseResult, fallback),
    ).rejects.toThrow("內容已更新，請重新載入。 Reload and try again.");
  });

  it("preserves an API error at the message limit", async () => {
    const message = "x".repeat(MAX_API_ERROR_MESSAGE_LENGTH);
    const response = Response.json({ error: message }, { status: 400 });

    await expect(
      readApiResponse(response, parseResult, fallback),
    ).rejects.toThrow(message);
  });

  it.each([
    ["a blank error", { error: "   " }],
    ["a non-string error", { error: 7 }],
    [
      "an overlong error",
      { error: "x".repeat(MAX_API_ERROR_MESSAGE_LENGTH + 1) },
    ],
  ])("uses the bilingual fallback for %s", async (_, body) => {
    await expect(
      readApiResponse(
        Response.json(body, { status: 400 }),
        parseResult,
        fallback,
      ),
    ).rejects.toThrow(fallback);
  });

  it.each([
    ["an HTML error", new Response("<html>Access</html>", { status: 403 })],
    ["malformed JSON", new Response("{broken", { status: 502 })],
    ["an invalid success shape", Response.json({ id: 2 })],
  ])("uses the bilingual fallback for %s", async (_, response) => {
    await expect(
      readApiResponse(response, parseResult, fallback),
    ).rejects.toThrow(fallback);
  });

  it("uses the bilingual fallback when the request fails before a response", async () => {
    await expect(
      requestApiResponse(
        () => Promise.reject(new TypeError("Failed to fetch")),
        parseResult,
        fallback,
      ),
    ).rejects.toThrow(fallback);
  });

  it("preserves an editor validation error without issuing a request", async () => {
    const request = vi.fn(() =>
      Promise.resolve(Response.json({ id: "synthetic-result" })),
    );
    const value = Array.from(
      { length: 13 },
      (_, index) => `synthetic-${String(index + 1)}`,
    ).join(", ");

    await expect(
      requestPreparedApiResponse(
        () => parseEditorTags(value),
        request,
        parseResult,
        fallback,
      ),
    ).rejects.toThrow(EDITOR_TAGS_ERROR);
    expect(request).not.toHaveBeenCalled();
  });
});
