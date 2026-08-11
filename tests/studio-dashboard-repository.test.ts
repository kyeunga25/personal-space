import { describe, expect, it, vi } from "vitest";

import { D1PublishingRepository } from "../src/server/publishing/repository";

function repositoryFixture(
  row: {
    draft_count: number;
    published_count: number;
    scheduled_count: number;
  } | null,
) {
  const first = vi.fn().mockResolvedValue(row);
  const prepare = vi.fn().mockReturnValue({ first });
  return {
    prepare,
    repository: new D1PublishingRepository({
      prepare,
    } as unknown as D1Database),
  };
}

describe("Studio dashboard repository", () => {
  it("counts every canonical post status without a row limit", async () => {
    const { prepare, repository } = repositoryFixture({
      draft_count: 61,
      published_count: 23,
      scheduled_count: 7,
    });

    await expect(repository.countOwnerPostsByStatus()).resolves.toEqual({
      draft: 61,
      published: 23,
      scheduled: 7,
    });

    const sql = String(prepare.mock.calls[0]?.[0]);
    expect(sql).toContain("FROM posts");
    expect(sql).toContain("status = 'draft'");
    expect(sql).toContain("status = 'published'");
    expect(sql).toContain("status = 'scheduled'");
    expect(sql).not.toContain("LIMIT");
  });

  it("returns zero counts for an empty database", async () => {
    const { repository } = repositoryFixture(null);

    await expect(repository.countOwnerPostsByStatus()).resolves.toEqual({
      draft: 0,
      published: 0,
      scheduled: 0,
    });
  });
});
