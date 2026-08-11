import { describe, expect, it } from "vitest";

import {
  feedResponse,
  latestFeedBuildDate,
  sitemapResponse,
} from "../src/server/feeds/response";

describe("public feed responses", () => {
  it("uses the newest valid content timestamp with a stable empty fallback", () => {
    expect(
      latestFeedBuildDate([
        {
          createdAt: "2026-08-08T08:00:00.000Z",
          publishedAt: "2026-08-09T08:00:00.000Z",
          scheduledAt: null,
          updatedAt: "2026-08-10T08:00:00.000Z",
        },
        {
          createdAt: "invalid",
          publishedAt: null,
          scheduledAt: "2026-08-11T08:00:00.000Z",
          updatedAt: "invalid",
        },
      ]),
    ).toBe("2026-08-11T08:00:00.000Z");
    expect(latestFeedBuildDate([])).toBe("1970-01-01T00:00:00.000Z");
  });

  it.each([
    (etag: string) => etag,
    (etag: string) => `W/${etag}`,
    (etag: string) => `"other", W/${etag}`,
    () => "*",
  ])("returns 304 for a matching entity tag", async (headerValue) => {
    const initial = await feedResponse({
      body: "<rss>stable</rss>",
      cacheControl: "public, max-age=300",
      ifNoneMatch: null,
    });
    const etag = initial.headers.get("etag");
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/);
    if (!etag) throw new TypeError("Expected an entity tag");

    const response = await feedResponse({
      body: "<rss>stable</rss>",
      cacheControl: "public, max-age=300",
      ifNoneMatch: headerValue(etag),
    });

    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
    expect(response.headers.get("etag")).toBe(etag);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("changes the entity tag only when the body changes", async () => {
    const first = await feedResponse({
      body: "<rss>first</rss>",
      cacheControl: "public, max-age=300",
      ifNoneMatch: null,
    });
    const same = await feedResponse({
      body: "<rss>first</rss>",
      cacheControl: "public, max-age=300",
      ifNoneMatch: null,
    });
    const changed = await feedResponse({
      body: "<rss>changed</rss>",
      cacheControl: "public, max-age=300",
      ifNoneMatch: null,
    });

    expect(same.headers.get("etag")).toBe(first.headers.get("etag"));
    expect(changed.headers.get("etag")).not.toBe(first.headers.get("etag"));
    expect(first.headers.get("content-type")).toBe(
      "application/rss+xml; charset=utf-8",
    );
    await expect(first.text()).resolves.toBe("<rss>first</rss>");
  });

  it("returns conditional sitemap responses with their XML media type", async () => {
    const initial = await sitemapResponse({
      body: "<urlset></urlset>",
      cacheControl: "public, max-age=900",
      ifNoneMatch: null,
    });
    const etag = initial.headers.get("etag");
    if (!etag) throw new TypeError("Expected an entity tag");

    const notModified = await sitemapResponse({
      body: "<urlset></urlset>",
      cacheControl: "public, max-age=900",
      ifNoneMatch: etag,
    });

    expect(initial.headers.get("content-type")).toBe(
      "application/xml; charset=utf-8",
    );
    expect(notModified.status).toBe(304);
    expect(notModified.body).toBeNull();
    expect(notModified.headers.get("etag")).toBe(etag);
  });
});
