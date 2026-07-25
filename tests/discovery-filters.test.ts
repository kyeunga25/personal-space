import { describe, expect, it } from "vitest";

import {
  escapeFtsPhrase,
  escapeLikePattern,
  hktDateRange,
  parseDiscoveryFilters,
  withCursor,
} from "../src/server/discovery/filters";

describe("public discovery filters", () => {
  it("normalizes supported filters and rejects unsupported values", () => {
    const filters = parseDiscoveryFilters(
      new URLSearchParams({
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
        category: " Project ",
        from: "2026-07-01",
        kind: "article",
        q: "  Cloudflare   Workers  ",
        sort: "relevance",
        tag: "cloudflare",
        to: "2026-07-31",
      }),
    );

    expect(filters).toMatchObject({
      before: "2026-07-25T12:00:00.000Z",
      beforeId: "post-id",
      category: "Project",
      from: "2026-07-01",
      kind: "article",
      query: "Cloudflare Workers",
      sort: "relevance",
      tag: "cloudflare",
      to: "2026-07-31",
    });

    expect(
      parseDiscoveryFilters(
        new URLSearchParams({
          before: "not-a-date",
          from: "2026-02-31",
          kind: "edition",
          sort: "relevance",
          to: "2026-99-99",
        }),
        200,
      ),
    ).toMatchObject({
      before: null,
      from: null,
      kind: "all",
      limit: 50,
      sort: "newest",
      to: null,
    });
  });

  it("builds Hong Kong inclusive date boundaries", () => {
    expect(hktDateRange("2026-07-01", "2026-07-31")).toEqual({
      fromUtc: "2026-06-30T16:00:00.000Z",
      toExclusiveUtc: "2026-07-31T16:00:00.000Z",
    });
  });

  it("escapes FTS phrases, LIKE patterns, and cursor links", () => {
    expect(escapeFtsPhrase('a "quoted" phrase')).toBe('"a ""quoted"" phrase"');
    expect(escapeLikePattern("100%_done\\ok")).toBe("100\\%\\_done\\\\ok");
    expect(
      withCursor(new URLSearchParams({ kind: "note" }), {
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
      }),
    ).toBe("?kind=note&before=2026-07-25T12%3A00%3A00.000Z&beforeId=post-id");
  });
});
