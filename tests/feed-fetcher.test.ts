import { describe, expect, it, vi } from "vitest";

import { UserFacingError } from "../src/server/errors";
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
  reviewNotes: null,
  reviewedAt: "2026-07-25T00:00:00.000Z",
  reviewStatus: "approved",
  rightsBasis: "Public feed terms reviewed.",
  siteUrl: "https://example.com/",
  status: "enabled",
  termsUrl: "https://example.com/terms",
  updatedAt: "2026-07-25T00:00:00.000Z",
};

describe("feed URL validation", () => {
  it("allows public HTTPS URLs", () => {
    expect(validateFeedUrl("https://example.com/feed").hostname).toBe(
      "example.com",
    );
    expect(validateFeedUrl("https://example.com./feed").hostname).toBe(
      "example.com.",
    );
  });

  it.each([
    "http://example.com/feed",
    "https://127.0.0.1/feed",
    "https://user:pass@example.com/feed",
    "https://localhost./feed",
    "https://service.internal./feed",
    "https://example.local./feed",
  ])("rejects a non-public HTTPS target: %s", (value) => {
    expect(() => validateFeedUrl(value)).toThrow(
      new UserFacingError(
        "只支援公開的 HTTPS feed 網址。 Only public HTTPS feed URLs are supported.",
        400,
      ),
    );
  });

  it("explains malformed and overlong URLs bilingually", () => {
    expect(() => validateFeedUrl("not a URL")).toThrow(
      new UserFacingError(
        "Feed 網址格式不正確。 Feed URL format is invalid.",
        400,
      ),
    );
    expect(() =>
      validateFeedUrl(`https://example.com/${"a".repeat(2040)}`),
    ).toThrow(
      new UserFacingError("Feed 網址太長。 Feed URL is too long.", 400),
    );
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

  it("stops reading a chunked response as soon as it exceeds the limit", async () => {
    const chunk = new Uint8Array(1024 * 1024);
    const chunkedFetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(chunk);
            controller.enqueue(chunk);
            controller.enqueue(new Uint8Array(1));
            controller.close();
          },
        }),
      ),
    );

    await expect(fetchFeedDocument(source, chunkedFetcher)).rejects.toEqual(
      new FeedFetchError("feed_too_large"),
    );
  });

  it("preserves the size error when stream cancellation fails", async () => {
    let wasCancelled = false;
    const largeBody = new ReadableStream<Uint8Array>({
      cancel() {
        wasCancelled = true;
        return Promise.reject(new Error("synthetic cancellation failure"));
      },
      start(controller) {
        controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1));
      },
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(largeBody));

    await expect(fetchFeedDocument(source, fetcher)).rejects.toEqual(
      new FeedFetchError("feed_too_large"),
    );
    expect(wasCancelled).toBe(true);
  });

  it("continues a safe redirect when response cleanup fails", async () => {
    const redirectBody = new ReadableStream<Uint8Array>({
      cancel() {
        return Promise.reject(new Error("synthetic cancellation failure"));
      },
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
      },
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(redirectBody, {
          headers: { location: "https://example.org/feed.xml" },
          status: 302,
        }),
      )
      .mockResolvedValueOnce(new Response("<rss><channel /></rss>"));

    const result = await fetchFeedDocument(source, fetcher);

    expect(result.finalUrl.toString()).toBe("https://example.org/feed.xml");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[1]?.signal).toBe(
      fetcher.mock.calls[1]?.[1]?.signal,
    );
  });

  it("cancels an HTTP error response before classifying it", async () => {
    let wasCancelled = false;
    const errorBody = new ReadableStream<Uint8Array>({
      cancel() {
        wasCancelled = true;
      },
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
      },
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(errorBody, { status: 502 }));

    await expect(fetchFeedDocument(source, fetcher)).rejects.toEqual(
      new FeedFetchError("http_502"),
    );
    expect(wasCancelled).toBe(true);
  });
});
