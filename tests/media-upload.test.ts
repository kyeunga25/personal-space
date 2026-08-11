import { describe, expect, it, vi } from "vitest";

import { UserFacingError } from "../src/server/errors";
import {
  MAX_MEDIA_UPLOAD_BODY_BYTES,
  type MediaUploadDependencies,
  mediaUploadResponse,
} from "../src/server/media/upload";
import { pngFixture } from "./helpers/image-fixtures";

function dependencyFixture(): {
  createMedia: ReturnType<typeof vi.fn>;
  deleteMediaObject: ReturnType<typeof vi.fn>;
  putMediaObject: ReturnType<typeof vi.fn>;
  uploadDependencies: MediaUploadDependencies;
} {
  const createMedia = vi.fn(() => Promise.resolve());
  const deleteMediaObject = vi.fn(() => Promise.resolve());
  const putMediaObject = vi.fn(() => Promise.resolve());

  return {
    createMedia,
    deleteMediaObject,
    putMediaObject,
    uploadDependencies: {
      createMedia,
      deleteMediaObject,
      putMediaObject,
    },
  };
}

async function encodedForm(form: FormData): Promise<{
  body: Uint8Array<ArrayBuffer>;
  contentType: string;
}> {
  const response = new Response(form);
  const contentType = response.headers.get("content-type");
  if (!contentType) throw new Error("Multipart fixture has no content type.");
  return {
    body: new Uint8Array(await response.arrayBuffer()),
    contentType,
  };
}

function byteRequest(
  body: Uint8Array<ArrayBuffer>,
  contentType: string,
  contentLength = String(body.byteLength),
): Request {
  return new Request("https://example.test/api/studio/media", {
    body: body.buffer,
    headers: {
      "content-length": contentLength,
      "content-type": contentType,
    },
    method: "POST",
  });
}

function streamedRequest(
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
  const headers = new Headers({
    "content-type": "multipart/form-data; boundary=bounded-test",
  });
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
    request: new Request("https://example.test/api/studio/media", init),
  };
}

async function expectRejectedWithoutWrites(
  request: Request,
  fixture: ReturnType<typeof dependencyFixture>,
): Promise<void> {
  const response = await mediaUploadResponse(
    request,
    fixture.uploadDependencies,
  );

  expect(response.status).toBe(413);
  await expect(response.json()).resolves.toEqual({
    error: "要求內容超出大小限制。 Request body exceeds the size limit.",
  });
  expect(fixture.putMediaObject).not.toHaveBeenCalled();
  expect(fixture.createMedia).not.toHaveBeenCalled();
  expect(fixture.deleteMediaObject).not.toHaveBeenCalled();
}

describe("owner media upload body limits", () => {
  it("returns a bilingual validation error before storage writes", async () => {
    const form = new FormData();
    form.set("visibility", "private");
    const encoded = await encodedForm(form);
    const fixture = dependencyFixture();

    const response = await mediaUploadResponse(
      byteRequest(encoded.body, encoded.contentType),
      fixture.uploadDependencies,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "請選擇圖片、填寫替代文字並設定可見度。 Choose an image, enter alt text, and set visibility.",
    });
    expect(fixture.putMediaObject).not.toHaveBeenCalled();
    expect(fixture.createMedia).not.toHaveBeenCalled();
    expect(fixture.deleteMediaObject).not.toHaveBeenCalled();
  });

  it("returns a bilingual error for an empty image", async () => {
    const form = new FormData();
    form.set("altText", "合成圖片");
    form.set("file", new File([], "empty.png", { type: "image/png" }));
    form.set("visibility", "private");
    const encoded = await encodedForm(form);
    const fixture = dependencyFixture();

    const response = await mediaUploadResponse(
      byteRequest(encoded.body, encoded.contentType),
      fixture.uploadDependencies,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "圖片檔案大小不符合限制。 Image size is outside the allowed limit.",
    });
    expect(fixture.putMediaObject).not.toHaveBeenCalled();
    expect(fixture.createMedia).not.toHaveBeenCalled();
    expect(fixture.deleteMediaObject).not.toHaveBeenCalled();
  });

  it.each([undefined, "invalid"])(
    "streams and cancels an oversized body with Content-Length %s",
    async (contentLength) => {
      const body = new Uint8Array(MAX_MEDIA_UPLOAD_BODY_BYTES + 1024);
      const streamed = streamedRequest(body, contentLength);
      await expectRejectedWithoutWrites(streamed.request, dependencyFixture());
      expect(streamed.cancelled()).toBe(true);
    },
  );

  it("rejects an oversized ignored multipart field before storage", async () => {
    const form = new FormData();
    form.set("ignored", "x".repeat(MAX_MEDIA_UPLOAD_BODY_BYTES));
    const encoded = await encodedForm(form);

    await expectRejectedWithoutWrites(
      byteRequest(encoded.body, encoded.contentType),
      dependencyFixture(),
    );
  });

  it("rejects a small image hidden inside an oversized multipart body", async () => {
    const form = new FormData();
    form.set("altText", "合成圖片");
    form.set(
      "file",
      new File([pngFixture()], "fixture.png", { type: "image/png" }),
    );
    form.set("visibility", "private");
    form.set("padding", "x".repeat(MAX_MEDIA_UPLOAD_BODY_BYTES));
    const encoded = await encodedForm(form);

    await expectRejectedWithoutWrites(
      byteRequest(encoded.body, encoded.contentType),
      dependencyFixture(),
    );
  });

  it("preserves a valid bounded image upload", async () => {
    const image = pngFixture();
    const form = new FormData();
    form.set("altText", "合成圖片");
    form.set("file", new File([image], "fixture.png", { type: "image/png" }));
    form.set("visibility", "private");
    const encoded = await encodedForm(form);
    const fixture = dependencyFixture();

    const response = await mediaUploadResponse(
      byteRequest(encoded.body, encoded.contentType),
      fixture.uploadDependencies,
    );

    expect(response.status).toBe(201);
    expect(fixture.putMediaObject).toHaveBeenCalledTimes(1);
    expect(fixture.createMedia).toHaveBeenCalledTimes(1);
    expect(fixture.deleteMediaObject).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      media: {
        altText: "合成圖片",
        byteSize: image.byteLength,
        height: 630,
        mimeType: "image/png",
        visibility: "private",
        width: 1200,
      },
    });
  });

  it("preserves the metadata error when object cleanup also fails", async () => {
    const form = new FormData();
    form.set("altText", "合成圖片");
    form.set(
      "file",
      new File([pngFixture()], "fixture.png", { type: "image/png" }),
    );
    form.set("visibility", "private");
    const encoded = await encodedForm(form);
    const fixture = dependencyFixture();
    fixture.createMedia.mockRejectedValue(
      new UserFacingError(
        "媒體中繼資料發生衝突。 Media metadata has a conflict.",
        409,
      ),
    );
    fixture.deleteMediaObject.mockRejectedValue(
      new Error("synthetic cleanup failure"),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await mediaUploadResponse(
      byteRequest(encoded.body, encoded.contentType),
      fixture.uploadDependencies,
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "媒體中繼資料發生衝突。 Media metadata has a conflict.",
    });
    expect(fixture.putMediaObject).toHaveBeenCalledTimes(1);
    expect(fixture.createMedia).toHaveBeenCalledTimes(1);
    expect(fixture.deleteMediaObject).toHaveBeenCalledWith(
      expect.stringMatching(/^private\/[0-9a-f-]+\.png$/u),
    );
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({
        errorType: "Error",
        message: "Media object cleanup failed",
      }),
    );
    log.mockRestore();
  });
});
