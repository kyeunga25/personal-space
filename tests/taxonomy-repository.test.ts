import { describe, expect, it, vi } from "vitest";

import { D1PublishingRepository } from "../src/server/publishing/repository";

const now = "2026-08-10T00:00:00.000Z";

function repositoryFixture(
  row: { count: number; name: string; slug: string } | null,
) {
  const first = vi.fn().mockResolvedValue(row);
  const bind = vi.fn().mockReturnValue({ first });
  const prepare = vi.fn().mockReturnValue({ bind });
  return {
    bind,
    prepare,
    repository: new D1PublishingRepository({
      prepare,
    } as unknown as D1Database),
  };
}

describe("public taxonomy lookup", () => {
  it.each([
    ["category", "categories c", "posts p ON p.category_id = c.id"],
    ["tag", "tags t", "post_tags pt ON pt.tag_id = t.id"],
  ] as const)(
    "queries only the requested %s aggregate",
    async (kind, table, join) => {
      const row = { count: 3, name: "Cloud", slug: "cloud" };
      const { bind, prepare, repository } = repositoryFixture(row);

      await expect(
        repository.findPublicTaxonomyTerm(kind, "cloud", now),
      ).resolves.toEqual(row);

      const sql = String(prepare.mock.calls[0]?.[0]);
      expect(prepare).toHaveBeenCalledTimes(1);
      expect(sql).toContain(`FROM ${table}`);
      expect(sql).toContain(join);
      expect(sql).toContain("visibility = 'public'");
      expect(sql).toContain("status = 'published'");
      expect(sql).toContain("slug = ?");
      expect(bind).toHaveBeenCalledWith("cloud", now);
    },
  );

  it("returns null when no public taxonomy term matches", async () => {
    const { repository } = repositoryFixture(null);

    await expect(
      repository.findPublicTaxonomyTerm("tag", "missing", now),
    ).resolves.toBeNull();
  });
});
