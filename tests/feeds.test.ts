import { describe, expect, it } from "vitest";

import type { EditionRecord } from "../src/server/editions/domain";
import { renderEditionRss } from "../src/server/feeds/edition-rss";
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
  hasWorkingCopy: false,
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

const publicEdition: EditionRecord = {
  createdAt: "2026-07-25T00:00:00.000Z",
  date: "2026-07-25",
  entries: [],
  hasWorkingCopy: false,
  id: "edition-2026-07-25",
  introMd: "已審閱的 **公開** 來源整理。",
  publishedAt: "2026-07-25T03:00:00.000Z",
  status: "published",
  title: "2026-07-25 每日整理 Daily Edition",
  updatedAt: "2026-07-25T04:00:00.000Z",
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
      entries: [
        {
          path: "/editions/2026-07-25",
          updatedAt: "2026-07-25T04:00:00.000Z",
        },
      ],
      generatedAt: "2026-07-25T03:00:00.000Z",
      paths: ["/", "/search"],
      posts: [publicPost],
      site: new URL("https://example.com"),
    });

    expect(xml).toContain("<loc>https://example.com/search</loc>");
    expect(xml).toContain(
      "<loc>https://example.com/articles/hello-world</loc>",
    );
    expect(xml).toContain("<lastmod>2026-07-25T02:00:00.000Z</lastmod>");
    expect(xml).toContain("<loc>https://example.com/editions/2026-07-25</loc>");
  });

  it("excludes future scheduled records even if a caller passes them in", () => {
    const scheduledPost: PostRecord = {
      ...publicPost,
      id: "future-post",
      scheduledAt: "2026-07-26T03:00:00.000Z",
      slug: "future-post",
      status: "scheduled",
    };
    const rss = renderRssFeed({
      description: "Test feed",
      generatedAt: "2026-07-25T03:00:00.000Z",
      posts: [scheduledPost],
      selfPath: "/rss.xml",
      site: new URL("https://example.com"),
      title: "Test feed",
    });
    const sitemap = renderSitemap({
      generatedAt: "2026-07-25T03:00:00.000Z",
      paths: [],
      posts: [scheduledPost],
      site: new URL("https://example.com"),
    });

    expect(rss).not.toContain("future-post");
    expect(sitemap).not.toContain("future-post");
  });

  it("renders only published Editions in their dedicated RSS feed", () => {
    const xml = renderEditionRss({
      description: "Reviewed editions",
      editions: [
        publicEdition,
        { ...publicEdition, id: "draft-edition", status: "draft" },
      ],
      generatedAt: "2026-07-25T05:00:00.000Z",
      selfPath: "/feeds/editions.xml",
      site: new URL("https://example.com"),
      title: "Editions & updates",
    });

    expect(xml).toContain("<title>Editions &amp; updates</title>");
    expect(xml).toContain("已審閱的 公開 來源整理。");
    expect(xml).toContain("https://example.com/editions/2026-07-25");
    expect(xml).not.toContain("draft-edition");
  });
});
