import { describe, expect, it } from "vitest";

import {
  parseIngestionMutationResponse,
  parseSourceMutationResponse,
  requestSourceMutationResponse,
} from "../src/scripts/source-api-response";

const SOURCE_SAVE_ERROR =
  "儲存來源失敗，請重新登入或稍後再試。 Source save failed; sign in again or retry later.";

function buttonFixture(disabled = false) {
  const attributes = new Map<string, string>();
  return {
    attributes,
    disabled,
    removeAttribute(name: string) {
      attributes.delete(name);
    },
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
  };
}

describe("Source API response contracts", () => {
  it("accepts a source mutation acknowledgement with a non-empty id", () => {
    expect(
      parseSourceMutationResponse({ source: { id: "synthetic-source" } }),
    ).toEqual({ sourceId: "synthetic-source" });
  });

  it.each([
    null,
    [],
    {},
    { source: null },
    { source: { id: "" } },
    { source: { id: 7 } },
    { source: { id: "x".repeat(201) } },
  ])("rejects an invalid source mutation acknowledgement", (value) => {
    expect(parseSourceMutationResponse(value)).toBeNull();
  });

  it("accepts a source update acknowledgement matching the edited source", async () => {
    await expect(
      requestSourceMutationResponse(
        () =>
          Promise.resolve(
            Response.json({ source: { id: " synthetic-source " } }),
          ),
        SOURCE_SAVE_ERROR,
        "synthetic-source",
      ),
    ).resolves.toEqual({ sourceId: "synthetic-source" });
  });

  it("locks and restores the save button around the request", async () => {
    const button = buttonFixture();
    let resolveResponse: (response: Response) => void = () => undefined;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const pending = requestSourceMutationResponse(
      () => response,
      SOURCE_SAVE_ERROR,
      "synthetic-source",
      button,
    );
    await Promise.resolve();

    expect(button.disabled).toBe(true);
    expect(button.attributes.get("aria-busy")).toBe("true");

    resolveResponse(Response.json({ source: { id: "synthetic-source" } }));
    await pending;

    expect(button.disabled).toBe(false);
    expect(button.attributes.has("aria-busy")).toBe(false);
  });

  it.each([
    [
      "an HTML response",
      () => Promise.resolve(new Response("<html>Access</html>")),
    ],
    ["malformed JSON", () => Promise.resolve(new Response("{broken"))],
    [
      "an invalid success shape",
      () => Promise.resolve(Response.json({ source: { id: 7 } })),
    ],
    [
      "a mismatched source",
      () =>
        Promise.resolve(Response.json({ source: { id: "another-source" } })),
    ],
    [
      "an offline request",
      () => Promise.reject(new TypeError("Failed to fetch")),
    ],
  ])("rejects %s without accepting the source update", async (_, request) => {
    await expect(
      requestSourceMutationResponse(
        request,
        SOURCE_SAVE_ERROR,
        "synthetic-source",
      ),
    ).rejects.toThrow(SOURCE_SAVE_ERROR);
  });

  it("preserves an approved bilingual source API error", async () => {
    await expect(
      requestSourceMutationResponse(
        () =>
          Promise.resolve(
            Response.json(
              { error: "來源格式不正確。 Source data is invalid." },
              { status: 400 },
            ),
          ),
        SOURCE_SAVE_ERROR,
      ),
    ).rejects.toThrow("來源格式不正確。 Source data is invalid.");
  });

  it.each(["partial", "skipped", "succeeded"] as const)(
    "accepts a completed ingestion acknowledgement with status %s",
    (status) => {
      expect(
        parseIngestionMutationResponse({
          result: { runId: "synthetic-run", status },
        }),
      ).toEqual({ runId: "synthetic-run", status });
    },
  );

  it.each([
    null,
    [],
    {},
    { result: null },
    { result: { runId: "", status: "succeeded" } },
    { result: { runId: "x".repeat(201), status: "succeeded" } },
    { result: { runId: "synthetic-run", status: "running" } },
    { result: { runId: "synthetic-run", status: "failed" } },
  ])("rejects an invalid ingestion acknowledgement", (value) => {
    expect(parseIngestionMutationResponse(value)).toBeNull();
  });
});
