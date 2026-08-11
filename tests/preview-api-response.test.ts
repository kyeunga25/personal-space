import { describe, expect, it } from "vitest";

import {
  EMPTY_PREVIEW_HTML,
  parsePreviewResponse,
  PREVIEW_RESPONSE_ERROR,
  PreviewRequestCoordinator,
  updatePreviewOutput,
} from "../src/scripts/preview-api-response";

function deferred<T>(): {
  promise: Promise<T>;
  reject: (error: Error) => void;
  resolve: (value: T) => void;
} {
  let reject: (error: Error) => void = () => undefined;
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((accept, decline) => {
    reject = decline;
    resolve = accept;
  });
  return { promise, reject, resolve };
}

function coordinatedOutputFixture() {
  const attributes = new Map<string, string>();
  return {
    attributes,
    innerHTML: "<p>上一個預覽</p>",
    removeAttribute(name: string) {
      attributes.delete(name);
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
  };
}

describe("Preview API response contracts", () => {
  it("keeps the newest preview when an older response finishes last", async () => {
    const output = coordinatedOutputFixture();
    const coordinator = new PreviewRequestCoordinator();
    const olderResponse = deferred<Response>();
    const newerResponse = deferred<Response>();
    let olderSignal: AbortSignal | undefined;

    const older = coordinator.update(output, (signal) => {
      olderSignal = signal;
      return olderResponse.promise;
    });
    const newer = coordinator.update(output, () => newerResponse.promise);

    expect(olderSignal?.aborted).toBe(true);
    expect(output.attributes.get("aria-busy")).toBe("true");

    newerResponse.resolve(Response.json({ html: "<h2>最新預覽</h2>" }));
    await expect(newer).resolves.toBe(true);
    expect(output.innerHTML).toBe("<h2>最新預覽</h2>");
    expect(output.attributes.has("aria-busy")).toBe(false);

    olderResponse.resolve(Response.json({ html: "<h2>較舊預覽</h2>" }));
    await expect(older).resolves.toBe(false);
    expect(output.innerHTML).toBe("<h2>最新預覽</h2>");
    expect(output.attributes.has("aria-busy")).toBe(false);
  });

  it("silences a stale failure after a newer preview succeeds", async () => {
    const output = coordinatedOutputFixture();
    const coordinator = new PreviewRequestCoordinator();
    const olderResponse = deferred<Response>();

    const older = coordinator.update(output, () => olderResponse.promise);
    await coordinator.update(output, () =>
      Promise.resolve(Response.json({ html: "<p>最新預覽</p>" })),
    );
    olderResponse.reject(new Error("synthetic stale failure"));

    await expect(older).resolves.toBe(false);
    expect(output.innerHTML).toBe("<p>最新預覽</p>");
  });

  it("cancels a pending preview when local input preparation fails", async () => {
    const output = coordinatedOutputFixture();
    const coordinator = new PreviewRequestCoordinator();
    const response = deferred<Response>();
    let signal: AbortSignal | undefined;

    const pending = coordinator.update(output, (requestSignal) => {
      signal = requestSignal;
      return response.promise;
    });
    expect(output.attributes.get("aria-busy")).toBe("true");

    coordinator.cancel(output);
    expect(signal?.aborted).toBe(true);
    expect(output.attributes.has("aria-busy")).toBe(false);

    response.resolve(Response.json({ html: "<p>不應套用</p>" }));
    await expect(pending).resolves.toBe(false);
    expect(output.innerHTML).toBe("<p>上一個預覽</p>");
  });

  it("reports the latest failure while preserving the previous preview", async () => {
    const output = coordinatedOutputFixture();
    const coordinator = new PreviewRequestCoordinator();

    await expect(
      coordinator.update(output, () =>
        Promise.resolve(Response.json({ html: 7 })),
      ),
    ).rejects.toThrow(PREVIEW_RESPONSE_ERROR);
    expect(output.innerHTML).toBe("<p>上一個預覽</p>");
    expect(output.attributes.has("aria-busy")).toBe(false);
  });

  it.each(["<h2>虛構預覽</h2>", ""])(
    "accepts a string preview payload",
    (html) => {
      expect(parsePreviewResponse({ html })).toEqual({ html });
    },
  );

  it.each([
    null,
    [],
    {},
    { html: null },
    { html: 7 },
    { html: { value: "<p>unexpected</p>" } },
  ])("rejects an invalid preview payload", (value) => {
    expect(parsePreviewResponse(value)).toBeNull();
  });

  it("updates the preview only after a valid response", async () => {
    const output = { innerHTML: "<p>上一個預覽</p>" };

    await updatePreviewOutput(output, () =>
      Promise.resolve(Response.json({ html: "<h2>新預覽</h2>" })),
    );

    expect(output.innerHTML).toBe("<h2>新預覽</h2>");
  });

  it("uses the empty-state copy for a valid empty response", async () => {
    const output = { innerHTML: "<p>上一個預覽</p>" };

    await updatePreviewOutput(output, () =>
      Promise.resolve(Response.json({ html: "" })),
    );

    expect(output.innerHTML).toBe(EMPTY_PREVIEW_HTML);
  });

  it.each([
    [
      "an HTML response",
      () => Promise.resolve(new Response("<html>Access</html>")),
    ],
    ["malformed JSON", () => Promise.resolve(new Response("{broken"))],
    [
      "an invalid success shape",
      () => Promise.resolve(Response.json({ html: 7 })),
    ],
    [
      "an offline request",
      () => Promise.reject(new TypeError("Failed to fetch")),
    ],
  ])("preserves the previous preview for %s", async (_, request) => {
    const output = { innerHTML: "<p>上一個預覽</p>" };

    await expect(updatePreviewOutput(output, request)).rejects.toThrow(
      PREVIEW_RESPONSE_ERROR,
    );
    expect(output.innerHTML).toBe("<p>上一個預覽</p>");
  });

  it("preserves an approved API error and the previous preview", async () => {
    const output = { innerHTML: "<p>上一個預覽</p>" };

    await expect(
      updatePreviewOutput(output, () =>
        Promise.resolve(
          Response.json(
            { error: "Markdown 格式不正確。 Invalid Markdown format." },
            { status: 400 },
          ),
        ),
      ),
    ).rejects.toThrow("Markdown 格式不正確。 Invalid Markdown format.");
    expect(output.innerHTML).toBe("<p>上一個預覽</p>");
  });
});
