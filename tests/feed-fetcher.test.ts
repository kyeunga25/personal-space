import { describe, expect, it, vi } from "vitest";

import type { SourceRecord } from "../src/server/editions/domain";
import {
  FeedFetchError,
  fetchFeedDocument,
  validateFeedUrl,
} from "../src/server/editions/feed-fetcher";

const source: SourceRecord = {
  createdAt: "2026-07-25T00:00:00.000Z",
  etag: '"old"',
  failureCount: 0,
  feedUrl: "https://example.com/feed.xml",
  id: "source-1",
  lastErrorCode: null,
  lastFetchedAt: null,
  lastModified: "Fri, 25 Jul 2026 00:00:00 GMT",
  lastSuccessAt: null,
  name: "Example",
  siteUrl: "https://example.com/",
  status: "enabled",
  updatedAt: "2026-07-25T00:00:00.000Z",
};

describe("feed URL validation", () => {
  it("allows public HTTPS URLs and rejects local or credentialed targets", () => {
    expect(validateFeedUrl("https://example.com/feed").hostname).toBe(
      "example.com",
    );
    expect(() => validateFeedUrl("http://example.com/feed")).toThrow();
    expect(() => validateFeedUrl("https://127.0.0.1/feed")).toThrow();
    expect(() =>
      validateFeedUrl("https://user:pass@example.com/feed"),
    ).toThrow();
  });
});

describe("feed fetching", () => {
  it("sends validators and accepts a bounded XML response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<rss><channel /></rss>", {
        headers: { etag: '"new"' },
      }),
    );
    const result = await fetchFeedDocument(source, fetcher);

    expect(result.body).toContain("<rss>");
    const request = fetcher.mock.calls[0];
    const headers = new Headers(request?.[1]?.headers);
    expect(headers.get("if-none-match")).toBe('"old"');
  });

  it("revalidates redirect targets and rejects oversized bodies", async () => {
    const redirectFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "http://localhost/feed" },
      }),
    );
    await expect(fetchFeedDocument(source, redirectFetcher)).rejects.toThrow();

    const largeFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<rss />", {
        headers: { "content-length": String(2 * 1024 * 1024 + 1) },
      }),
    );
    await expect(fetchFeedDocument(source, largeFetcher)).rejects.toEqual(
      new FeedFetchError("feed_too_large"),
    );
  });
});
