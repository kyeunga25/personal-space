import { describe, expect, it } from "vitest";

import { renderRssFeed } from "../src/server/feeds/rss";
import { renderSitemap } from "../src/server/feeds/sitemap";
import type { PostRecord } from "../src/server/publishing/domain";

const publicPost: PostRecord = {
  authorId: "owner",
  bodyHtml: "<p>Body</p>",
  bodyMd: "Body",
  category: null,
  createdAt: "2026-07-25T00:00:00.000Z",
  excerpt: "A <safe> summary & update",
  heroMediaId: null,
  id: "post-1",
  kind: "article",
  pinned: false,
  publishedAt: "2026-07-25T01:00:00.000Z",
  scheduledAt: null,
  slug: "hello-world",
  status: "published",
  tags: [],
  title: "Hello & 世界",
  updatedAt: "2026-07-25T02:00:00.000Z",
  visibility: "public",
};

describe("public XML feeds", () => {
  it("renders escaped RSS entries with canonical post URLs", () => {
    const xml = renderRssFeed({
      description: "Test feed",
      generatedAt: "2026-07-25T03:00:00.000Z",
      posts: [publicPost],
      selfPath: "/rss.xml",
      site: new URL("https://example.com"),
      title: "Test & feed",
    });

    expect(xml).toContain("<title>Test &amp; feed</title>");
    expect(xml).toContain("A &lt;safe&gt; summary &amp; update");
    expect(xml).toContain("https://example.com/articles/hello-world");
  });

  it("fails closed when non-public records reach a feed renderer", () => {
    const xml = renderRssFeed({
      description: "Test feed",
      generatedAt: "2026-07-25T03:00:00.000Z",
      posts: [{ ...publicPost, id: "private-1", visibility: "private" }],
      selfPath: "/rss.xml",
      site: new URL("https://example.com"),
      title: "Test feed",
    });

    expect(xml).not.toContain("hello-world");
    expect(xml).not.toContain("private-1");
  });

  it("renders public sitemap locations and last-modified dates", () => {
    const xml = renderSitemap({
      paths: ["/", "/search"],
      posts: [publicPost],
      site: new URL("https://example.com"),
    });

    expect(xml).toContain("<loc>https://example.com/search</loc>");
    expect(xml).toContain(
      "<loc>https://example.com/articles/hello-world</loc>",
    );
    expect(xml).toContain("<lastmod>2026-07-25T02:00:00.000Z</lastmod>");
  });
});
