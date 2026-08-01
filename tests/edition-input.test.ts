import { describe, expect, it } from "vitest";

import { parseSourceInput } from "../src/server/editions/input";

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
    ).toThrow("來源完成權利審核後才可啟用。");
  });

  it("requires an explicit confirmation for approval", () => {
    expect(() =>
      parseSourceInput({ ...approvedSource, rightsConfirmed: false }),
    ).toThrow("請明確確認已核對來源條款及使用權利。");
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
