import { describe, expect, it, vi } from "vitest";

import {
  applyRevisionRestoreRequest,
  parseRevisionRestoreResponse,
  REVISION_RESTORE_PENDING_LABEL,
  REVISION_RESTORE_RESPONSE_ERROR,
} from "../src/scripts/revision-api-response";

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
    textContent: "還原為草稿 Restore",
  };
}

const draftExpectation = {
  hasWorkingCopy: false,
  postId: "synthetic-post",
};

describe("Revision restore API response contracts", () => {
  it.each([false, true])(
    "accepts only an acknowledgement matching working-copy state %s",
    (hasWorkingCopy) => {
      expect(
        parseRevisionRestoreResponse(
          {
            post: {
              hasWorkingCopy,
              id: " synthetic-post ",
              ignored: "metadata",
            },
          },
          { hasWorkingCopy, postId: "synthetic-post" },
        ),
      ).toEqual({ hasWorkingCopy, postId: "synthetic-post" });
    },
  );

  it.each([
    null,
    [],
    {},
    { post: null },
    { post: { hasWorkingCopy: false, id: 7 } },
    { post: { hasWorkingCopy: false, id: "another-post" } },
    { post: { hasWorkingCopy: true, id: "synthetic-post" } },
  ])("rejects an invalid or mismatched restore acknowledgement", (value) => {
    expect(parseRevisionRestoreResponse(value, draftExpectation)).toBeNull();
  });

  it("locks the button until a valid acknowledgement reloads the page", async () => {
    const button = buttonFixture();
    const reload = vi.fn();
    let resolveResponse: (response: Response) => void = () => undefined;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const pending = applyRevisionRestoreRequest(
      button,
      draftExpectation,
      () => response,
      reload,
    );
    await Promise.resolve();

    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe(REVISION_RESTORE_PENDING_LABEL);
    expect(button.attributes.get("aria-busy")).toBe("true");
    expect(reload).not.toHaveBeenCalled();

    resolveResponse(
      Response.json({
        post: { hasWorkingCopy: false, id: "synthetic-post" },
      }),
    );
    await pending;

    expect(reload).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("還原為草稿 Restore");
    expect(button.attributes.has("aria-busy")).toBe(false);
  });

  it("preserves a button disabled by an outer request lock", async () => {
    const button = buttonFixture(true);
    const reload = vi.fn();

    await applyRevisionRestoreRequest(
      button,
      draftExpectation,
      () =>
        Promise.resolve(
          Response.json({
            post: { hasWorkingCopy: false, id: "synthetic-post" },
          }),
        ),
      reload,
    );

    expect(reload).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("還原為草稿 Restore");
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
      () => Promise.resolve(Response.json({ post: { id: 7 } })),
    ],
    [
      "a mismatched post",
      () =>
        Promise.resolve(
          Response.json({
            post: { hasWorkingCopy: false, id: "another-post" },
          }),
        ),
    ],
    [
      "an offline request",
      () => Promise.reject(new TypeError("Failed to fetch")),
    ],
  ])("keeps the page retryable for %s", async (_, request) => {
    const button = buttonFixture();
    const reload = vi.fn();

    await expect(
      applyRevisionRestoreRequest(button, draftExpectation, request, reload),
    ).rejects.toThrow(REVISION_RESTORE_RESPONSE_ERROR);

    expect(reload).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("還原為草稿 Restore");
    expect(button.attributes.has("aria-busy")).toBe(false);
  });

  it("preserves an approved bilingual API error", async () => {
    const button = buttonFixture();
    const reload = vi.fn();

    await expect(
      applyRevisionRestoreRequest(
        button,
        draftExpectation,
        () =>
          Promise.resolve(
            Response.json(
              {
                error:
                  "找不到要還原的修訂版本。 The revision to restore could not be found.",
              },
              { status: 404 },
            ),
          ),
        reload,
      ),
    ).rejects.toThrow(
      "找不到要還原的修訂版本。 The revision to restore could not be found.",
    );
    expect(reload).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
  });
});
