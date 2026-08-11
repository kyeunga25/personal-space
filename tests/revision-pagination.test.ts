import { describe, expect, it, vi } from "vitest";

import {
  parseRevisionPageCursor,
  revisionLatestHref,
  revisionPageHref,
} from "../src/server/publishing/revision-pagination";
import { D1PublishingRepository } from "../src/server/publishing/repository";

function revisionRow(id: string, postId: string, createdAt: string) {
  return {
    body_md: `Body ${id}`,
    category_id: null,
    created_at: createdAt,
    excerpt: null,
    hero_media_id: null,
    id,
    post_id: postId,
    slug: null,
    tags_json: "[]",
    title: `Revision ${id}`,
    visibility: "private",
  };
}

function repositoryFixture(rows: ReturnType<typeof revisionRow>[]) {
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

describe("revision pagination", () => {
  it("accepts only a complete cursor and emits a canonical editor link", () => {
    const cursor = {
      before: "2026-08-10T08:00:00.000Z",
      beforeId: "revision-2",
    };

    expect(
      parseRevisionPageCursor(
        new URLSearchParams({
          ignored: "private-fragment",
          revisionBefore: cursor.before,
          revisionBeforeId: cursor.beforeId,
        }),
      ),
    ).toEqual(cursor);
    expect(revisionPageHref("post/with space", cursor)).toBe(
      "/studio/posts/post%2Fwith%20space?revisionBefore=2026-08-10T08%3A00%3A00.000Z&revisionBeforeId=revision-2#revision-list-heading",
    );
    expect(revisionLatestHref("post/with space")).toBe(
      "/studio/posts/post%2Fwith%20space#revision-list-heading",
    );

    for (const params of [
      {},
      { revisionBefore: cursor.before },
      { revisionBefore: "not-a-date", revisionBeforeId: cursor.beforeId },
      { revisionBefore: cursor.before, revisionBeforeId: " revision-2" },
      { revisionBefore: cursor.before, revisionBeforeId: "x".repeat(101) },
    ]) {
      expect(parseRevisionPageCursor(new URLSearchParams(params))).toBeNull();
    }
    expect(revisionPageHref("", cursor)).toBeNull();
    expect(revisionLatestHref(" post-1")).toBeNull();
  });

  it("returns a continuation cursor without mapping its lookahead row", async () => {
    const postId = "post-1";
    const { bind, repository } = repositoryFixture([
      revisionRow("revision-3", postId, "2026-08-10T09:00:00.000Z"),
      revisionRow("revision-2", postId, "2026-08-10T08:00:00.000Z"),
      revisionRow("revision-1", postId, "2026-08-10T07:00:00.000Z"),
    ]);

    const page = await repository.listRevisionPage(postId, null, 2);

    expect(page.revisions.map((revision) => revision.id)).toEqual([
      "revision-3",
      "revision-2",
    ]);
    expect(page.nextCursor).toEqual({
      before: "2026-08-10T08:00:00.000Z",
      beforeId: "revision-2",
    });
    expect(bind).toHaveBeenCalledWith(postId, 3);
  });

  it("binds a stable post-scoped time and id cursor", async () => {
    const { bind, prepare, repository } = repositoryFixture([]);
    const cursor = {
      before: "2026-08-10T08:00:00.000Z",
      beforeId: "revision-2",
    };

    await repository.listRevisionPage("post-1", cursor, 2);

    const sql = String(prepare.mock.calls[0]?.[0]);
    expect(sql).toContain("post_id = ?");
    expect(sql).toContain("created_at < ?");
    expect(sql).toContain("created_at = ? AND id < ?");
    expect(sql).toContain("ORDER BY created_at DESC, id DESC");
    expect(bind).toHaveBeenCalledWith(
      "post-1",
      cursor.before,
      cursor.before,
      cursor.beforeId,
      3,
    );
  });
});
