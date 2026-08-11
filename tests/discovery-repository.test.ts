import { describe, expect, it, vi } from "vitest";

import { parseDiscoveryFilters } from "../src/server/discovery/filters";
import { D1PublishingRepository } from "../src/server/publishing/repository";

const now = "2026-08-10T00:00:00.000Z";

function postRow(
  id: string,
  publishedAt: string,
  searchRank: number,
): Record<string, number | string | null> {
  return {
    author_id: "owner",
    body_html: "<p>Public body</p>",
    body_md: "Public body",
    category_id: null,
    category_name: null,
    category_slug: null,
    created_at: publishedAt,
    excerpt: "Public excerpt",
    hero_media_id: null,
    id,
    kind: "article",
    pinned: 0,
    published_at: publishedAt,
    scheduled_at: null,
    search_rank: searchRank,
    slug: id,
    status: "published",
    tags_json: "[]",
    title: `Public ${id}`,
    updated_at: publishedAt,
    visibility: "public",
  };
}

function repositoryFixture(rows: Record<string, number | string | null>[]) {
  const all = vi.fn().mockResolvedValue({ results: rows });
  const bind = vi.fn().mockReturnValue({ all });
  const prepare = vi.fn().mockReturnValue({ bind });
  return {
    bind,
    prepare,
    repository: new D1PublishingRepository({
      prepare,
    } as unknown as D1Database),
  };
}

describe("public discovery repository pagination", () => {
  it("returns the last relevance rank in a continuation cursor", async () => {
    const { repository } = repositoryFixture([
      postRow("post-3", "2026-08-09T03:00:00.000Z", -3),
      postRow("post-2", "2026-08-09T02:00:00.000Z", -2),
      postRow("post-1", "2026-08-09T01:00:00.000Z", -1),
    ]);
    const filters = parseDiscoveryFilters(
      new URLSearchParams({ q: "Cloudflare", sort: "relevance" }),
      2,
    );

    const page = await repository.listPublicDiscovery(filters, now);

    expect(page.posts.map((post) => post.id)).toEqual(["post-3", "post-2"]);
    expect(page.nextCursor).toEqual({
      before: "2026-08-09T02:00:00.000Z",
      beforeId: "post-2",
      rank: -2,
    });
  });

  it("continues relevance order with a bound rank, time, and id cursor", async () => {
    const { bind, prepare, repository } = repositoryFixture([]);
    const filters = parseDiscoveryFilters(
      new URLSearchParams({
        before: "2026-08-09T02:00:00.000Z",
        beforeId: "post-2",
        beforeRank: "-2",
        q: "Cloudflare",
        sort: "relevance",
      }),
      2,
    );

    await repository.listPublicDiscovery(filters, now);

    expect(prepare.mock.calls[0]?.[0]).toContain(
      "bm25(posts_fts, 8.0, 4.0, 1.0) > ?",
    );
    expect(bind).toHaveBeenCalledWith(
      now,
      '"Cloudflare"',
      -2,
      -2,
      "2026-08-09T02:00:00.000Z",
      -2,
      "2026-08-09T02:00:00.000Z",
      "post-2",
      3,
    );
  });
});
