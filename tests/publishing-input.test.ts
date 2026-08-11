import { describe, expect, it } from "vitest";

import {
  parseSavePostInput,
  POST_INPUT_LIMITS,
} from "../src/server/publishing/input";

const validInput = {
  action: "save",
  bodyMd: "虛構測試內容",
  kind: "note",
  visibility: "private",
};

describe("publishing input", () => {
  it("accepts absent, null, and string optional fields", () => {
    expect(parseSavePostInput(validInput)).toEqual(
      expect.objectContaining({
        bodyMd: "虛構測試內容",
        tags: [],
      }),
    );
    expect(
      parseSavePostInput({
        ...validInput,
        category: null,
        excerpt: "摘要",
        heroMediaId: null,
        id: "post-1",
        scheduledAt: null,
        slug: "sample",
        title: "標題",
      }),
    ).toEqual(
      expect.objectContaining({
        category: null,
        excerpt: "摘要",
        heroMediaId: null,
        id: "post-1",
        scheduledAt: null,
        slug: "sample",
        title: "標題",
      }),
    );
  });

  it.each([
    ["category", []],
    ["excerpt", 1],
    ["heroMediaId", false],
    ["id", 42],
    ["id", null],
    ["id", ""],
    ["scheduledAt", {}],
    ["slug", ["sample"]],
    ["title", { value: "標題" }],
  ])("rejects an invalid optional %s field", (field, invalidValue) => {
    expect(
      parseSavePostInput({ ...validInput, [field]: invalidValue }),
    ).toBeNull();
  });

  it("accepts values exactly at every publishing input limit", () => {
    expect(
      parseSavePostInput({
        ...validInput,
        bodyMd: "x".repeat(POST_INPUT_LIMITS.bodyMd),
        category: "x".repeat(POST_INPUT_LIMITS.category),
        excerpt: "x".repeat(POST_INPUT_LIMITS.excerpt),
        heroMediaId: "x".repeat(POST_INPUT_LIMITS.heroMediaId),
        id: "x".repeat(POST_INPUT_LIMITS.id),
        scheduledAt: "x".repeat(POST_INPUT_LIMITS.scheduledAt),
        slug: "x".repeat(POST_INPUT_LIMITS.slug),
        tags: Array.from({ length: POST_INPUT_LIMITS.tags }, () =>
          "x".repeat(POST_INPUT_LIMITS.tag),
        ),
        title: "x".repeat(POST_INPUT_LIMITS.title),
      }),
    ).not.toBeNull();
  });

  it.each([
    ["bodyMd", "bodyMd"],
    ["category", "category"],
    ["excerpt", "excerpt"],
    ["heroMediaId", "heroMediaId"],
    ["id", "id"],
    ["scheduledAt", "scheduledAt"],
    ["slug", "slug"],
    ["title", "title"],
  ] as const)("rejects an overlong %s field", (field, limitName) => {
    expect(
      parseSavePostInput({
        ...validInput,
        [field]: "x".repeat(POST_INPUT_LIMITS[limitName] + 1),
      }),
    ).toBeNull();
  });

  it("rejects too many or overlong tags", () => {
    expect(
      parseSavePostInput({
        ...validInput,
        tags: Array.from(
          { length: POST_INPUT_LIMITS.tags + 1 },
          () => "synthetic-tag",
        ),
      }),
    ).toBeNull();
    expect(
      parseSavePostInput({
        ...validInput,
        tags: ["x".repeat(POST_INPUT_LIMITS.tag + 1)],
      }),
    ).toBeNull();
  });
});
