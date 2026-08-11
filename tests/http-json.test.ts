import { describe, expect, it, vi } from "vitest";

import { UserFacingError } from "../src/server/errors";
import {
  errorResponse,
  MAX_JSON_BODY_BYTES,
  readJsonBody,
} from "../src/server/http/json";
import { POST_INPUT_LIMITS } from "../src/server/publishing/input";
import { POST as previewPost } from "../src/pages/api/studio/preview";

function streamedJsonRequest(
  body: Uint8Array<ArrayBuffer>,
  contentLength?: string,
): { cancelled: () => boolean; request: Request } {
  let offset = 0;
  let wasCancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      wasCancelled = true;
    },
    pull(controller) {
      if (offset >= body.byteLength) {
        controller.close();
        return;
      }
      const nextOffset = Math.min(offset + 64 * 1024, body.byteLength);
      controller.enqueue(body.subarray(offset, nextOffset));
      offset = nextOffset;
    },
  });
  const headers = new Headers({ "content-type": "application/json" });
  if (contentLength !== undefined) {
    headers.set("content-length", contentLength);
  }
  const init: RequestInit & { duplex: "half" } = {
    body: stream,
    duplex: "half",
    headers,
    method: "POST",
  };

  return {
    cancelled: () => wasCancelled,
    request: new Request("https://example.test/api", init),
  };
}

describe("Studio JSON handling", () => {
  it("returns null for malformed JSON", async () => {
    await expect(
      readJsonBody(
        new Request("https://example.test/api", {
          body: "{broken",
          method: "POST",
        }),
      ),
    ).resolves.toBeNull();
  });

  it.each([undefined, "invalid", "2"])(
    "returns 413 and cancels an oversized stream with Content-Length %s",
    async (contentLength) => {
      const body = new Uint8Array(MAX_JSON_BODY_BYTES + 1);
      const streamed = streamedJsonRequest(body, contentLength);

      const response = await previewPost({
        request: streamed.request,
      } as never);

      expect(response.status).toBe(413);
      await expect(response.json()).resolves.toEqual({
        error: "要求內容超出大小限制。 Request body exceeds the size limit.",
      });
      expect(streamed.cancelled()).toBe(true);
    },
  );

  it("preserves an oversized-body error from the shared JSON boundary", async () => {
    const request = new Request("https://example.test/api", {
      body: "{}",
      headers: { "Content-Length": String(MAX_JSON_BODY_BYTES + 1) },
      method: "POST",
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      message: "要求內容超出大小限制。 Request body exceeds the size limit.",
      status: 413,
    });
  });

  it("preserves valid streamed JSON", async () => {
    const body = new TextEncoder().encode(
      JSON.stringify({ title: "虛構測試內容", visibility: "private" }),
    );
    const streamed = streamedJsonRequest(body);

    await expect(readJsonBody(streamed.request)).resolves.toEqual({
      title: "虛構測試內容",
      visibility: "private",
    });
    expect(streamed.cancelled()).toBe(false);
  });

  it("rejects preview Markdown beyond the publishing limit", async () => {
    const response = await previewPost({
      request: new Request("https://example.test/api/studio/preview", {
        body: JSON.stringify({
          bodyMd: "x".repeat(POST_INPUT_LIMITS.bodyMd + 1),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Markdown 格式不正確。 Invalid Markdown format.",
    });
  });

  it("exposes only approved request errors", async () => {
    const expected = errorResponse(new UserFacingError("請修正輸入。", 422));
    expect(expected.status).toBe(422);
    await expect(expected.json()).resolves.toEqual({ error: "請修正輸入。" });

    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const hidden = errorResponse(new Error("private provider detail"));
    expect(hidden.status).toBe(500);
    await expect(hidden.json()).resolves.toEqual({
      error: "暫時無法完成要求。 The request could not be completed right now.",
    });
    expect(log).toHaveBeenCalledWith("Studio request failed", {
      errorType: "Error",
    });
    log.mockRestore();
  });

  it("returns a bilingual conflict without exposing constraint details", async () => {
    const response = errorResponse(
      new Error("synthetic UNIQUE constraint failure"),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error:
        "內容網址已被使用，請更改網址識別。 This content URL is already in use; choose a different slug.",
    });
  });
});
