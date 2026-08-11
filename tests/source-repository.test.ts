import { describe, expect, it, vi } from "vitest";

import type { SourceRecord } from "../src/server/editions/domain";
import type { SourceInput } from "../src/server/editions/input";
import { D1EditionRepository } from "../src/server/editions/repository";
import { UserFacingError } from "../src/server/errors";

const now = "2026-08-10T00:00:00.000Z";
const source: SourceRecord = {
  createdAt: now,
  etag: null,
  failureCount: 0,
  feedUrl: "https://example.com/feed.xml",
  id: "synthetic-source",
  lastErrorCode: null,
  lastFetchedAt: null,
  lastModified: null,
  lastSuccessAt: null,
  name: "Example",
  reviewNotes: null,
  reviewedAt: now,
  reviewStatus: "approved",
  rightsBasis: "Synthetic rights basis.",
  siteUrl: "https://example.com/",
  status: "enabled",
  termsUrl: "https://example.com/terms",
  updatedAt: now,
};
const input: SourceInput = {
  feedUrl: source.feedUrl,
  name: source.name,
  reviewNotes: source.reviewNotes,
  reviewStatus: source.reviewStatus,
  rightsBasis: source.rightsBasis,
  siteUrl: source.siteUrl,
  status: source.status,
  termsUrl: source.termsUrl,
};

function repositoryFixture() {
  const prepare = vi.fn();
  return {
    prepare,
    repository: new D1EditionRepository({ prepare } as unknown as D1Database),
  };
}

describe("Source repository public errors", () => {
  it("rejects a duplicate source with a bilingual 409 before writing", async () => {
    const { prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findSourceByFeedUrl").mockResolvedValue(source);

    await expect(repository.createSource(input, now)).rejects.toEqual(
      new UserFacingError(
        "這個 feed 已經加入。 This feed has already been added.",
        409,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rejects an unknown source with a bilingual 404 before writing", async () => {
    const { prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findSource").mockResolvedValue(null);

    await expect(
      repository.updateSource("missing-source", input, now),
    ).rejects.toEqual(
      new UserFacingError(
        "找不到這個來源。 The requested source could not be found.",
        404,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rejects changing to another source's feed with a bilingual 409", async () => {
    const { prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findSource").mockResolvedValue(source);
    vi.spyOn(repository, "findSourceByFeedUrl").mockResolvedValue({
      ...source,
      id: "another-source",
    });

    await expect(
      repository.updateSource(source.id, input, now),
    ).rejects.toEqual(
      new UserFacingError(
        "這個 feed 已經加入。 This feed has already been added.",
        409,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });
});
