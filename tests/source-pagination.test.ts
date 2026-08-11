import { describe, expect, it, vi } from "vitest";

import {
  parseSourcePageCursor,
  sourceLatestHref,
  sourcePageHref,
} from "../src/server/editions/source-pagination";
import { D1EditionRepository } from "../src/server/editions/repository";

function sourceRow(id: string, createdAt: string) {
  return {
    created_at: createdAt,
    etag: null,
    failure_count: 0,
    feed_url: `https://example.com/${id}.xml`,
    id,
    last_error_code: null,
    last_fetched_at: null,
    last_modified: null,
    last_success_at: null,
    name: `Source ${id}`,
    review_notes: null,
    review_status: "pending",
    reviewed_at: null,
    rights_basis: null,
    site_url: "https://example.com/",
    status: "paused",
    terms_url: null,
    updated_at: createdAt,
  };
}

function repositoryFixture(rows: ReturnType<typeof sourceRow>[]) {
  const all = vi.fn().mockResolvedValue({ results: rows });
  const bind = vi.fn().mockReturnValue({ all });
  const prepare = vi.fn().mockReturnValue({ bind });
  return {
    bind,
    prepare,
    repository: new D1EditionRepository({
      prepare,
    } as unknown as D1Database),
  };
}

describe("source pagination", () => {
  it("accepts only a complete cursor and emits a canonical link", () => {
    const cursor = {
      before: "2026-08-09T08:00:00.000Z",
      beforeId: "source-2",
    };

    expect(
      parseSourcePageCursor(
        new URLSearchParams({
          ignored: "private-fragment",
          sourceBefore: cursor.before,
          sourceBeforeId: cursor.beforeId,
        }),
      ),
    ).toEqual(cursor);
    expect(sourcePageHref(cursor)).toBe(
      "?sourceBefore=2026-08-09T08%3A00%3A00.000Z&sourceBeforeId=source-2#source-list-heading",
    );
    expect(sourceLatestHref()).toBe("/studio/sources#source-list-heading");

    for (const params of [
      {},
      { sourceBefore: cursor.before },
      { sourceBefore: "not-a-date", sourceBeforeId: cursor.beforeId },
      { sourceBefore: cursor.before, sourceBeforeId: "" },
      { sourceBefore: cursor.before, sourceBeforeId: "x".repeat(101) },
    ]) {
      expect(parseSourcePageCursor(new URLSearchParams(params))).toBeNull();
    }
  });

  it("returns a continuation cursor without mapping its lookahead row", async () => {
    const { bind, repository } = repositoryFixture([
      sourceRow("source-3", "2026-08-10T08:00:00.000Z"),
      sourceRow("source-2", "2026-08-09T08:00:00.000Z"),
      sourceRow("source-1", "2026-08-08T08:00:00.000Z"),
    ]);

    const page = await repository.listSourcePage(null, 2);

    expect(page.sources.map((source) => source.id)).toEqual([
      "source-3",
      "source-2",
    ]);
    expect(page.nextCursor).toEqual({
      before: "2026-08-09T08:00:00.000Z",
      beforeId: "source-2",
    });
    expect(bind).toHaveBeenCalledWith(3);
  });

  it("binds a stable time and id cursor", async () => {
    const { bind, prepare, repository } = repositoryFixture([]);
    const cursor = {
      before: "2026-08-09T08:00:00.000Z",
      beforeId: "source-2",
    };

    await repository.listSourcePage(cursor, 2);

    const sql = String(prepare.mock.calls[0]?.[0]);
    expect(sql).toContain("created_at < ?");
    expect(sql).toContain("created_at = ? AND id < ?");
    expect(sql).toContain("ORDER BY created_at DESC, id DESC");
    expect(bind).toHaveBeenCalledWith(
      cursor.before,
      cursor.before,
      cursor.beforeId,
      3,
    );
  });
});
