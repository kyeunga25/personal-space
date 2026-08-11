import { describe, expect, it } from "vitest";

import { POST_INPUT_LIMITS } from "../src/config/publishing";
import {
  CREATE_EDITION_ERROR,
  parseEditionMutationResponse,
  requestEditionMutationResponse,
  SAVE_EDITION_ERROR,
} from "../src/scripts/edition-api-response";

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

describe("Edition API response contracts", () => {
  it.each([false, true])(
    "accepts a bounded Edition acknowledgement with working-copy state %s",
    (hasWorkingCopy) => {
      expect(
        parseEditionMutationResponse({
          edition: {
            hasWorkingCopy,
            id: " synthetic-edition ",
            ignored: "metadata",
          },
        }),
      ).toEqual({ editionId: "synthetic-edition", hasWorkingCopy });
    },
  );

  it.each([
    null,
    [],
    {},
    { edition: null },
    { edition: {} },
    { edition: { hasWorkingCopy: false, id: "" } },
    { edition: { hasWorkingCopy: false, id: "   " } },
    { edition: { hasWorkingCopy: false, id: 7 } },
    {
      edition: {
        hasWorkingCopy: false,
        id: "x".repeat(POST_INPUT_LIMITS.id + 1),
      },
    },
    { edition: { id: "synthetic-edition" } },
    { edition: { hasWorkingCopy: "false", id: "synthetic-edition" } },
  ])("rejects a partial or invalid Edition acknowledgement", (value) => {
    expect(parseEditionMutationResponse(value)).toBeNull();
  });

  it("accepts a valid response matching the edited Edition", async () => {
    await expect(
      requestEditionMutationResponse(
        () =>
          Promise.resolve(
            Response.json({
              edition: {
                hasWorkingCopy: true,
                id: "synthetic-edition",
              },
            }),
          ),
        SAVE_EDITION_ERROR,
        "synthetic-edition",
      ),
    ).resolves.toEqual({
      editionId: "synthetic-edition",
      hasWorkingCopy: true,
    });
  });

  it("locks controls and restores their original states after the request", async () => {
    const submitButton = buttonFixture();
    const alreadyDisabled = buttonFixture(true);
    let resolveResponse: (response: Response) => void = () => undefined;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });

    const pending = requestEditionMutationResponse(
      () => response,
      SAVE_EDITION_ERROR,
      "synthetic-edition",
      {
        busyButton: submitButton,
        buttons: [submitButton, alreadyDisabled],
      },
    );
    await Promise.resolve();

    expect(submitButton.disabled).toBe(true);
    expect(alreadyDisabled.disabled).toBe(true);
    expect(submitButton.attributes.get("aria-busy")).toBe("true");

    resolveResponse(
      Response.json({
        edition: { hasWorkingCopy: false, id: "synthetic-edition" },
      }),
    );
    await pending;

    expect(submitButton.disabled).toBe(false);
    expect(alreadyDisabled.disabled).toBe(true);
    expect(submitButton.attributes.has("aria-busy")).toBe(false);
  });

  it.each([
    [
      "an HTML response",
      () => Promise.resolve(new Response("<html>Access</html>")),
    ],
    ["malformed JSON", () => Promise.resolve(new Response("{broken"))],
    [
      "a partial success shape",
      () =>
        Promise.resolve(
          Response.json({ edition: { id: "synthetic-edition" } }),
        ),
    ],
    [
      "a mismatched Edition",
      () =>
        Promise.resolve(
          Response.json({
            edition: { hasWorkingCopy: false, id: "another-edition" },
          }),
        ),
    ],
    [
      "an offline request",
      () => Promise.reject(new TypeError("Failed to fetch")),
    ],
  ])("rejects %s without accepting the save", async (_, request) => {
    await expect(
      requestEditionMutationResponse(
        request,
        SAVE_EDITION_ERROR,
        "synthetic-edition",
      ),
    ).rejects.toThrow(SAVE_EDITION_ERROR);
  });

  it("preserves an approved bilingual API error", async () => {
    await expect(
      requestEditionMutationResponse(
        () =>
          Promise.resolve(
            Response.json(
              {
                error: "Edition 格式不正確。 Edition data is invalid.",
              },
              { status: 400 },
            ),
          ),
        CREATE_EDITION_ERROR,
      ),
    ).rejects.toThrow("Edition 格式不正確。 Edition data is invalid.");
  });
});
