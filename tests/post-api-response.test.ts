import { describe, expect, it } from "vitest";

import {
  parsePostMutationResponse,
  parseSavedPostResponse,
} from "../src/scripts/post-api-response";

describe("Post API response contracts", () => {
  it.each([false, true])(
    "accepts a saved post acknowledgement with working-copy state %s",
    (hasWorkingCopy) => {
      expect(
        parseSavedPostResponse({
          post: { hasWorkingCopy, id: "synthetic-post" },
        }),
      ).toEqual({ hasWorkingCopy, id: "synthetic-post" });
    },
  );

  it.each([
    null,
    [],
    {},
    { post: null },
    { post: { hasWorkingCopy: false, id: "" } },
    { post: { hasWorkingCopy: false, id: 7 } },
    { post: { hasWorkingCopy: false, id: "x".repeat(201) } },
    { post: { id: "synthetic-post" } },
    { post: { hasWorkingCopy: "false", id: "synthetic-post" } },
  ])("rejects an invalid saved post acknowledgement", (value) => {
    expect(parseSavedPostResponse(value)).toBeNull();
  });
});

describe("Post mutation response contracts", () => {
  it.each([
    ["archive", "archived"],
    ["publish", "published"],
    ["schedule", "scheduled"],
    ["save", "draft"],
    ["save", "published"],
  ])("accepts %s only with a compatible %s state", (action, status) => {
    expect(
      parsePostMutationResponse(
        {
          post: {
            hasWorkingCopy: action === "save" && status === "published",
            id: "synthetic-post",
            status,
          },
        },
        action,
      ),
    ).toEqual({
      hasWorkingCopy: action === "save" && status === "published",
      id: "synthetic-post",
      status,
    });
  });

  it.each([
    ["archive", "published"],
    ["publish", "draft"],
    ["schedule", "archived"],
    ["save", "deleted"],
    ["delete", "archived"],
  ])("rejects %s with incompatible state %s", (action, status) => {
    expect(
      parsePostMutationResponse(
        {
          post: {
            hasWorkingCopy: false,
            id: "synthetic-post",
            status,
          },
        },
        action,
      ),
    ).toBeNull();
  });

  it("rejects an acknowledgement without status", () => {
    expect(
      parsePostMutationResponse(
        { post: { hasWorkingCopy: false, id: "synthetic-post" } },
        "save",
      ),
    ).toBeNull();
  });
});
