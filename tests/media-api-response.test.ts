import { describe, expect, it } from "vitest";

import { POST_INPUT_LIMITS } from "../src/config/publishing";
import {
  applyMediaUploadRequest,
  getMediaSelectionFeedback,
  MEDIA_UPLOAD_ALT_TEXT_ERROR,
  MEDIA_UPLOAD_FAILED_STATE,
  MEDIA_UPLOAD_PENDING_STATE,
  MEDIA_UPLOAD_REQUIRED_ERROR,
  MEDIA_UPLOAD_RESPONSE_ERROR,
  MEDIA_UPLOAD_SIZE_ERROR,
  MEDIA_UPLOAD_SUCCESS_STATE,
  MEDIA_UPLOAD_TYPE_ERROR,
  parseMediaUploadResponse,
  prepareMediaUploadSelection,
  updateMediaPreviewOutput,
  updateMediaSelectionFeedback,
} from "../src/scripts/media-api-response";
import {
  MEDIA_UPLOAD_LIMITS,
  MEDIA_UPLOAD_MIME_TYPES,
} from "../src/config/media";
import { runWithPostRequestControls } from "../src/scripts/post-request-controls";

function controlsFixture() {
  return {
    clearButton: { disabled: false },
    link: { value: "existing-media" },
    saveState: {
      innerHTML: '已儲存 <span lang="en">Saved</span>',
    },
    state: { textContent: "已連結封面圖片。 Cover image linked." },
    uploadButton: { disabled: false },
  };
}

function busyTargetFixture() {
  const attributes = new Map<string, string>();
  return {
    attributes,
    getAttribute(name: string) {
      return attributes.get(name) ?? null;
    },
    removeAttribute(name: string) {
      attributes.delete(name);
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
  };
}

describe("Media upload API response contracts", () => {
  it("describes empty, incomplete, invalid, and ready media selections", () => {
    expect(getMediaSelectionFeedback(undefined, "")).toEqual({
      label: "尚未選擇待上傳圖片。 No upload selected.",
      ready: false,
      state: "empty",
    });
    expect(
      getMediaSelectionFeedback(
        { name: "synthetic-cover.png", size: 1024 * 1024, type: "image/png" },
        "",
      ),
    ).toEqual({
      label:
        "已選擇 Selected：synthetic-cover.png · 請填寫替代文字 Add alt text",
      ready: false,
      state: "needs-alt",
    });
    expect(
      getMediaSelectionFeedback(
        { name: "synthetic-cover.gif", size: 10, type: "image/gif" },
        "替代文字",
      ),
    ).toEqual({
      label: MEDIA_UPLOAD_TYPE_ERROR,
      ready: false,
      state: "invalid",
    });
    expect(
      getMediaSelectionFeedback(
        { name: "synthetic-cover.png", size: 1024 * 1024, type: "image/png" },
        "替代文字",
      ),
    ).toEqual({
      label: "準備上傳 Ready to upload：synthetic-cover.png · 1.0 MiB",
      ready: true,
      state: "ready",
    });
  });

  it("updates selection feedback using text only", () => {
    const target = {
      dataset: { state: "previous" },
      textContent: "previous",
    };

    expect(
      updateMediaSelectionFeedback(
        target,
        {
          name: '<img src=x onerror="alert(1)">.png',
          size: 512,
          type: "image/png",
        },
        "替代文字",
      ),
    ).toBe(true);
    expect(target.textContent).toBe(
      '準備上傳 Ready to upload：<img src=x onerror="alert(1)">.png · 512 B',
    );
    expect(target.dataset.state).toBe("ready");
  });

  it.each([
    [undefined, "替代文字", MEDIA_UPLOAD_REQUIRED_ERROR],
    [{ size: 10, type: "image/png" }, "   ", MEDIA_UPLOAD_REQUIRED_ERROR],
    [{ size: 0, type: "image/png" }, "替代文字", MEDIA_UPLOAD_SIZE_ERROR],
    [
      { size: MEDIA_UPLOAD_LIMITS.fileBytes + 1, type: "image/jpeg" },
      "替代文字",
      MEDIA_UPLOAD_SIZE_ERROR,
    ],
    [{ size: 10, type: "image/gif" }, "替代文字", MEDIA_UPLOAD_TYPE_ERROR],
    [
      { size: 10, type: "image/png" },
      "字".repeat(MEDIA_UPLOAD_LIMITS.altText + 1),
      MEDIA_UPLOAD_ALT_TEXT_ERROR,
    ],
  ])(
    "rejects an invalid browser selection without preparing a request",
    (file, altText, error) => {
      expect(prepareMediaUploadSelection(file, altText)).toEqual({ error });
    },
  );

  it.each(MEDIA_UPLOAD_MIME_TYPES)(
    "accepts a bounded %s selection and trims alt text",
    (type) => {
      const file = { size: MEDIA_UPLOAD_LIMITS.fileBytes, type };

      expect(
        prepareMediaUploadSelection(
          file,
          `  ${"字".repeat(MEDIA_UPLOAD_LIMITS.altText)}  `,
        ),
      ).toEqual({
        altText: "字".repeat(MEDIA_UPLOAD_LIMITS.altText),
        file,
      });
    },
  );

  it("accepts and normalizes a bounded media id", () => {
    expect(
      parseMediaUploadResponse({
        media: { id: " synthetic-media ", ignored: "metadata" },
      }),
    ).toEqual({ mediaId: "synthetic-media", preview: null });
  });

  it("accepts bounded preview metadata without trusting a response URL", () => {
    expect(
      parseMediaUploadResponse({
        media: {
          altText: "  合成封面  ",
          height: 630,
          id: "synthetic-media",
          url: "https://attacker.invalid/image.png",
          width: 1200,
        },
      }),
    ).toEqual({
      mediaId: "synthetic-media",
      preview: {
        altText: "合成封面",
        height: 630,
        mediaId: "synthetic-media",
        width: 1200,
      },
    });
    expect(
      parseMediaUploadResponse({
        media: {
          altText: "超界封面",
          height: MEDIA_UPLOAD_LIMITS.imageDimension + 1,
          id: "synthetic-media",
          width: 1200,
        },
      }),
    ).toEqual({ mediaId: "synthetic-media", preview: null });
  });

  it("updates and clears a cover preview using an owner-only path", () => {
    const removed: string[] = [];
    const output = {
      container: { hidden: true },
      image: {
        alt: "previous alt",
        height: 1,
        removeAttribute(name: string) {
          removed.push(name);
        },
        src: "previous-src",
        width: 1,
      },
    };

    updateMediaPreviewOutput(output, {
      altText: '<img src=x onerror="alert(1)">',
      height: 630,
      mediaId: "synthetic/media",
      width: 1200,
    });
    expect(output.container.hidden).toBe(false);
    expect(output.image).toMatchObject({
      alt: '<img src=x onerror="alert(1)">',
      height: 630,
      src: "/api/studio/media/synthetic%2Fmedia",
      width: 1200,
    });

    updateMediaPreviewOutput(output, null);
    expect(output.container.hidden).toBe(true);
    expect(output.image.alt).toBe("");
    expect(removed).toEqual(["src"]);
  });

  it.each([
    null,
    [],
    {},
    { media: null },
    { media: {} },
    { media: { id: "" } },
    { media: { id: "   " } },
    { media: { id: 7 } },
    { media: { id: "x".repeat(POST_INPUT_LIMITS.heroMediaId + 1) } },
  ])("rejects an invalid media upload acknowledgement", (value) => {
    expect(parseMediaUploadResponse(value)).toBeNull();
  });

  it("locks controls until a valid response updates the media link", async () => {
    const controls = controlsFixture();
    controls.clearButton.disabled = true;
    controls.link.value = "";
    controls.state.textContent = "尚未選擇圖片。 No image selected.";
    let resolveResponse: (response: Response) => void = () => undefined;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const pending = applyMediaUploadRequest(controls, () => response);
    await Promise.resolve();

    expect(controls.uploadButton.disabled).toBe(true);
    expect(controls.clearButton.disabled).toBe(true);
    expect(controls.state.textContent).toBe(MEDIA_UPLOAD_PENDING_STATE);
    expect(controls.link.value).toBe("");

    resolveResponse(Response.json({ media: { id: "synthetic-media" } }));
    await pending;

    expect(controls).toEqual({
      clearButton: { disabled: false },
      link: { value: "synthetic-media" },
      saveState: {
        innerHTML: '未儲存 <span lang="en">Unsaved</span>',
      },
      state: { textContent: MEDIA_UPLOAD_SUCCESS_STATE },
      uploadButton: { disabled: false },
    });
  });

  it("restores media action states after a failed request", async () => {
    const controls = controlsFixture();
    let rejectRequest: (error: Error) => void = () => undefined;
    const request = new Promise<Response>((_, reject) => {
      rejectRequest = reject;
    });

    const pending = applyMediaUploadRequest(controls, () => request);
    await Promise.resolve();

    expect(controls.uploadButton.disabled).toBe(true);
    expect(controls.clearButton.disabled).toBe(true);

    rejectRequest(new Error("synthetic upload failure"));
    await expect(pending).rejects.toThrow(MEDIA_UPLOAD_RESPONSE_ERROR);
    expect(controls.uploadButton.disabled).toBe(false);
    expect(controls.clearButton.disabled).toBe(false);
  });

  it("preserves an upload button disabled by an outer request lock", async () => {
    const controls = controlsFixture();
    controls.uploadButton.disabled = true;

    await applyMediaUploadRequest(controls, () =>
      Promise.resolve(Response.json({ media: { id: "synthetic-media" } })),
    );

    expect(controls.uploadButton.disabled).toBe(true);
    expect(controls.clearButton.disabled).toBe(false);
  });

  it("composes with the shared content mutation lock", async () => {
    const controls = controlsFixture();
    controls.clearButton.disabled = true;
    const saveButton = { disabled: false };
    const busyTarget = busyTargetFixture();
    let resolveResponse: (response: Response) => void = () => undefined;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const pending = runWithPostRequestControls([saveButton], busyTarget, () =>
      applyMediaUploadRequest(controls, () => response),
    );
    await Promise.resolve();

    expect(saveButton.disabled).toBe(true);
    expect(busyTarget.attributes.get("aria-busy")).toBe("true");
    expect(controls.uploadButton.disabled).toBe(true);
    expect(controls.clearButton.disabled).toBe(true);

    resolveResponse(Response.json({ media: { id: "synthetic-media" } }));
    await pending;

    expect(saveButton.disabled).toBe(false);
    expect(busyTarget.attributes.has("aria-busy")).toBe(false);
    expect(controls.uploadButton.disabled).toBe(false);
    expect(controls.clearButton.disabled).toBe(false);
  });

  it.each([
    [
      "an HTML response",
      () => Promise.resolve(new Response("<html>Access</html>")),
    ],
    ["malformed JSON", () => Promise.resolve(new Response("{broken"))],
    [
      "an invalid success shape",
      () => Promise.resolve(Response.json({ media: { id: 7 } })),
    ],
    [
      "an offline request",
      () => Promise.reject(new TypeError("Failed to fetch")),
    ],
  ])("preserves the existing link for %s", async (_, request) => {
    const controls = controlsFixture();

    await expect(applyMediaUploadRequest(controls, request)).rejects.toThrow(
      MEDIA_UPLOAD_RESPONSE_ERROR,
    );
    expect(controls).toEqual({
      clearButton: { disabled: false },
      link: { value: "existing-media" },
      saveState: {
        innerHTML: '已儲存 <span lang="en">Saved</span>',
      },
      state: { textContent: MEDIA_UPLOAD_FAILED_STATE },
      uploadButton: { disabled: false },
    });
  });

  it("preserves an approved API error and existing link", async () => {
    const controls = controlsFixture();

    await expect(
      applyMediaUploadRequest(controls, () =>
        Promise.resolve(
          Response.json(
            {
              error:
                "圖片檔案大小不符合限制。 Image size is outside the allowed limit.",
            },
            { status: 400 },
          ),
        ),
      ),
    ).rejects.toThrow(
      "圖片檔案大小不符合限制。 Image size is outside the allowed limit.",
    );
    expect(controls.link.value).toBe("existing-media");
    expect(controls.uploadButton.disabled).toBe(false);
    expect(controls.state.textContent).toBe(MEDIA_UPLOAD_FAILED_STATE);
  });
});
