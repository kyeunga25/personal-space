import { describe, expect, it } from "vitest";

import {
  DISCOVERY_QUERY_MAX_LENGTH,
  escapeFtsPhrase,
  escapeLikePattern,
  hktDateRange,
  isDiscoveryRelevanceAvailable,
  parseArchiveDiscoveryFilters,
  parseDiscoveryFilters,
  parseKindDiscoveryFilters,
  parseTaxonomyDiscoveryFilters,
  withCursor,
} from "../src/server/discovery/filters";

describe("public discovery filters", () => {
  it("normalizes supported filters and rejects unsupported values", () => {
    const filters = parseDiscoveryFilters(
      new URLSearchParams({
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
        beforeRank: "-3.25",
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
      beforeRank: -3.25,
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
          beforeRank: "not-a-rank",
          from: "2026-02-31",
          kind: "edition",
          sort: "relevance",
          to: "2026-99-99",
        }),
        200,
      ),
    ).toMatchObject({
      before: null,
      beforeRank: null,
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

  it.each([
    ["", false],
    ["A", false],
    ["AI", false],
    ["雲端", false],
    ["雲端站", true],
    ["A👨‍👩‍👧‍👦B", true],
  ] as const)(
    "allows relevance for %j only at the FTS grapheme threshold",
    (query, expected) => {
      expect(isDiscoveryRelevanceAvailable(query)).toBe(expected);
      expect(
        parseDiscoveryFilters(
          new URLSearchParams({ q: query, sort: "relevance" }),
        ).sort,
      ).toBe(expected ? "relevance" : "newest");
    },
  );

  it("escapes FTS phrases, LIKE patterns, and cursor links", () => {
    expect(escapeFtsPhrase('a "quoted" phrase')).toBe('"a ""quoted"" phrase"');
    expect(escapeLikePattern("100%_done\\ok")).toBe("100\\%\\_done\\\\ok");
    const filters = parseDiscoveryFilters(
      new URLSearchParams({
        before: "2026-07-20T12:00:00.000Z",
        beforeId: "old-post",
        ignored: "private-fragment",
        kind: "note",
        q: "  Cloudflare   Workers  ",
        sort: "relevance",
      }),
    );
    expect(
      withCursor(filters, {
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
        rank: -3.25,
      }),
    ).toBe(
      "?q=Cloudflare+Workers&kind=note&sort=relevance&before=2026-07-25T12%3A00%3A00.000Z&beforeId=post-id&beforeRank=-3.25",
    );
  });

  it("bounds canonical pagination queries", () => {
    const filters = parseDiscoveryFilters(
      new URLSearchParams({ q: "x".repeat(DISCOVERY_QUERY_MAX_LENGTH + 20) }),
    );

    expect(filters.query).toHaveLength(DISCOVERY_QUERY_MAX_LENGTH);
    expect(
      withCursor(filters, {
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
      }),
    ).toContain(`q=${"x".repeat(DISCOVERY_QUERY_MAX_LENGTH)}`);
  });

  it.each([
    ["category", "Cloud / 香港", "category=Cloud+%2F+%E9%A6%99%E6%B8%AF"],
    ["tag", "繁體中文", "tag=%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87"],
  ] as const)(
    "keeps only the %s route taxonomy and a valid continuation cursor",
    (taxonomy, slug, encodedTaxonomy) => {
      const filters = parseTaxonomyDiscoveryFilters(
        new URLSearchParams({
          before: "2026-07-25T12:00:00.000Z",
          beforeId: "post-id",
          beforeRank: "-3.25",
          category: "ignored-category",
          from: "2026-01-01",
          kind: "note",
          q: "ignored query",
          sort: "relevance",
          tag: "ignored-tag",
          to: "2026-12-31",
          unknown: "ignored-value",
        }),
        taxonomy,
        slug,
        50,
      );

      expect(filters).toMatchObject({
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
        beforeRank: null,
        category: taxonomy === "category" ? slug : null,
        from: null,
        kind: "all",
        limit: 50,
        query: "",
        sort: "newest",
        tag: taxonomy === "tag" ? slug : null,
        to: null,
      });
      expect(
        withCursor(filters, {
          before: "2026-07-20T12:00:00.000Z",
          beforeId: "older-post",
        }),
      ).toBe(
        `?${encodedTaxonomy}&before=2026-07-20T12%3A00%3A00.000Z&beforeId=older-post`,
      );
    },
  );

  it.each(["note", "article"] as const)(
    "keeps only the %s route kind and a valid continuation cursor",
    (kind) => {
      const filters = parseKindDiscoveryFilters(
        new URLSearchParams({
          before: "2026-07-25T12:00:00.000Z",
          beforeId: "post-id",
          beforeRank: "-3.25",
          category: "ignored-category",
          kind: kind === "note" ? "article" : "note",
          q: "ignored query",
          sort: "relevance",
          tag: "ignored-tag",
        }),
        kind,
        20,
      );

      expect(filters).toMatchObject({
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
        beforeRank: null,
        category: null,
        kind,
        limit: 20,
        query: "",
        sort: "newest",
        tag: null,
      });
      expect(
        withCursor(filters, {
          before: "2026-07-20T12:00:00.000Z",
          beforeId: "older-post",
        }),
      ).toBe(
        `?kind=${kind}&before=2026-07-20T12%3A00%3A00.000Z&beforeId=older-post`,
      );
    },
  );

  it.each([
    [null, null, ""],
    ["2026-01-01", "2026-12-31", "from=2026-01-01&to=2026-12-31&"],
  ] as const)(
    "pins the archive range %s to %s while preserving only its cursor",
    (from, to, encodedRange) => {
      const filters = parseArchiveDiscoveryFilters(
        new URLSearchParams({
          before: "2026-07-25T12:00:00.000Z",
          beforeId: "post-id",
          beforeRank: "-3.25",
          category: "ignored-category",
          from: "2000-01-01",
          kind: "article",
          q: "ignored query",
          sort: "relevance",
          tag: "ignored-tag",
          to: "2099-12-31",
        }),
        from,
        to,
        50,
      );

      expect(filters).toMatchObject({
        before: "2026-07-25T12:00:00.000Z",
        beforeId: "post-id",
        beforeRank: null,
        category: null,
        from,
        kind: "all",
        limit: 50,
        query: "",
        sort: "newest",
        tag: null,
        to,
      });
      expect(
        withCursor(filters, {
          before: "2026-07-20T12:00:00.000Z",
          beforeId: "older-post",
        }),
      ).toBe(
        `?${encodedRange}before=2026-07-20T12%3A00%3A00.000Z&beforeId=older-post`,
      );
    },
  );
});
