import { describe, expect, it } from "vitest";

import { EDITION_INPUT_LIMITS } from "../src/config/editions";
import { UserFacingError } from "../src/server/errors";
import {
  parseEditionSaveInput,
  parseSourceInput,
} from "../src/server/editions/input";

const approvedSource = {
  feedUrl: "https://example.com/feed.xml",
  name: "Example",
  reviewNotes: "Attribution retained in every Edition.",
  reviewStatus: "approved",
  rightsBasis: "The published terms permit linked feed summaries.",
  rightsConfirmed: true,
  siteUrl: "https://example.com/",
  status: "enabled",
  termsUrl: "https://example.com/terms",
};

describe("source rights review input", () => {
  it("accepts an explicitly confirmed and documented source", () => {
    expect(parseSourceInput(approvedSource)).toEqual(
      expect.objectContaining({
        reviewStatus: "approved",
        status: "enabled",
        termsUrl: "https://example.com/terms",
      }),
    );
  });

  it("rejects enabling a source before approval", () => {
    expect(() =>
      parseSourceInput({
        ...approvedSource,
        reviewStatus: "pending",
        status: "enabled",
      }),
    ).toThrow(
      new UserFacingError(
        "來源完成權利審核後才可啟用。 Sources can be enabled only after rights review is complete.",
        400,
      ),
    );
  });

  it("requires an explicit confirmation for approval", () => {
    expect(() =>
      parseSourceInput({ ...approvedSource, rightsConfirmed: false }),
    ).toThrow(
      new UserFacingError(
        "請明確確認已核對來源條款及使用權利。 Explicitly confirm that the source terms and usage rights have been reviewed.",
        400,
      ),
    );
  });

  it.each([{ termsUrl: "" }, { rightsBasis: "" }])(
    "requires documented rights evidence for approval",
    (override) => {
      expect(() =>
        parseSourceInput({ ...approvedSource, ...override }),
      ).toThrow(
        new UserFacingError(
          "核准來源需要條款網址及權利依據。 Approved sources require a terms URL and rights basis.",
          400,
        ),
      );
    },
  );

  it.each(["feedUrl", "siteUrl", "termsUrl"] as const)(
    "rejects an overlong %s instead of silently truncating it",
    (field) => {
      const prefix = "https://example.com/";
      const overlongUrl = `${prefix}${"a".repeat(2049 - prefix.length)}`;

      expect(() =>
        parseSourceInput({ ...approvedSource, [field]: overlongUrl }),
      ).toThrow(
        new UserFacingError("Feed 網址太長。 Feed URL is too long.", 400),
      );
    },
  );

  it("accepts a source URL at the 2,048-character boundary", () => {
    const prefix = "https://example.com/";
    const boundaryUrl = `${prefix}${"a".repeat(2048 - prefix.length)}`;

    expect(
      parseSourceInput({ ...approvedSource, feedUrl: boundaryUrl }),
    ).toEqual(expect.objectContaining({ feedUrl: boundaryUrl }));
  });

  it.each([
    ["name", 120],
    ["rightsBasis", 600],
    ["reviewNotes", 1000],
  ] as const)(
    "rejects an overlong %s instead of truncating review evidence",
    (field, limit) => {
      expect(
        parseSourceInput({
          ...approvedSource,
          [field]: "x".repeat(limit + 1),
        }),
      ).toBeNull();
    },
  );

  it.each([
    ["name", 120],
    ["rightsBasis", 600],
    ["reviewNotes", 1000],
  ] as const)("preserves %s exactly at its limit", (field, limit) => {
    const boundaryValue = "x".repeat(limit);

    expect(
      parseSourceInput({ ...approvedSource, [field]: boundaryValue }),
    ).toEqual(expect.objectContaining({ [field]: boundaryValue }));
  });

  it("defaults an incomplete source to paused and pending", () => {
    expect(
      parseSourceInput({
        feedUrl: "https://example.com/feed.xml",
        name: "Example",
      }),
    ).toEqual(
      expect.objectContaining({
        reviewStatus: "pending",
        status: "paused",
      }),
    );
  });
});

const validEdition = {
  action: "save",
  annotations: { "item-1": "已核對的虛構註解" },
  includedItemIds: ["item-1"],
  introMd: "虛構引言",
  title: "虛構 Edition",
};

describe("Edition save input", () => {
  it("preserves a valid bounded collection", () => {
    expect(parseEditionSaveInput(validEdition)).toEqual(validEdition);
  });

  it.each([
    ["title", EDITION_INPUT_LIMITS.title],
    ["introMd", EDITION_INPUT_LIMITS.introMd],
  ] as const)(
    "rejects an overlong %s instead of truncating it",
    (field, limit) => {
      expect(
        parseEditionSaveInput({
          ...validEdition,
          [field]: "x".repeat(limit + 1),
        }),
      ).toBeNull();
    },
  );

  it.each([
    ["title", EDITION_INPUT_LIMITS.title],
    ["introMd", EDITION_INPUT_LIMITS.introMd],
  ] as const)("preserves %s exactly at its limit", (field, limit) => {
    const boundaryValue = "x".repeat(limit);

    expect(
      parseEditionSaveInput({ ...validEdition, [field]: boundaryValue }),
    ).toEqual(expect.objectContaining({ [field]: boundaryValue }));
  });

  it.each([
    ["a missing item list", { ...validEdition, includedItemIds: undefined }],
    ["a non-array item list", { ...validEdition, includedItemIds: "item-1" }],
    ["a non-string item", { ...validEdition, includedItemIds: ["item-1", 2] }],
    ["a blank item", { ...validEdition, includedItemIds: [" "] }],
    [
      "an overlong item",
      {
        ...validEdition,
        includedItemIds: ["i".repeat(EDITION_INPUT_LIMITS.itemId + 1)],
      },
    ],
    [
      "too many items",
      {
        ...validEdition,
        includedItemIds: Array.from(
          { length: EDITION_INPUT_LIMITS.items + 1 },
          (_, index) => `item-${String(index)}`,
        ),
      },
    ],
    [
      "duplicate items",
      { ...validEdition, includedItemIds: ["item-1", " item-1 "] },
    ],
    ["a missing annotation map", { ...validEdition, annotations: undefined }],
    ["an annotation array", { ...validEdition, annotations: [] }],
    [
      "a non-string annotation",
      { ...validEdition, annotations: { "item-1": 2 } },
    ],
    [
      "an overlong annotation",
      {
        ...validEdition,
        annotations: {
          "item-1": "a".repeat(EDITION_INPUT_LIMITS.annotation + 1),
        },
      },
    ],
    [
      "an annotation for an unselected item",
      { ...validEdition, annotations: { "item-2": "未選取" } },
    ],
  ])("rejects %s", (_, input) => {
    expect(parseEditionSaveInput(input)).toBeNull();
  });

  it("allows an empty draft but requires an item before publishing", () => {
    expect(
      parseEditionSaveInput({
        ...validEdition,
        annotations: {},
        includedItemIds: [],
      }),
    ).toEqual(
      expect.objectContaining({ annotations: {}, includedItemIds: [] }),
    );
    expect(() =>
      parseEditionSaveInput({
        ...validEdition,
        action: "publish",
        annotations: {},
        includedItemIds: [],
      }),
    ).toThrow(
      "Edition 至少需要一項內容才可發佈。 Include at least one item before publishing.",
    );
  });
});
