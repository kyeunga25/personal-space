import { describe, expect, it } from "vitest";

import { parseSyndicationFeed } from "../src/server/editions/feed-parser";
import {
  normalizeStoryTitle,
  storyTitleSimilarity,
} from "../src/server/editions/similarity";

describe("syndication feed parsing", () => {
  it("parses RSS entries and strips markup", () => {
    const entries = parseSyndicationFeed(
      `<?xml version="1.0"?><rss><channel><item>
        <guid>item-1</guid><title>測試 &amp; 更新</title>
        <link>/news/1</link><pubDate>Fri, 25 Jul 2026 10:00:00 GMT</pubDate>
        <description><![CDATA[<p>安全的 <strong>摘要</strong></p>]]></description>
      </item></channel></rss>`,
      new URL("https://example.com/feed.xml"),
    );

    expect(entries).toEqual([
      expect.objectContaining({
        externalId: "item-1",
        summary: "安全的 摘要",
        title: "測試 & 更新",
        url: "https://example.com/news/1",
      }),
    ]);
  });

  it("parses Atom alternate links and rejects non-HTTPS links", () => {
    const entries = parseSyndicationFeed(
      `<feed><entry><id>tag:example,1</id><title>Example update</title>
        <link rel="alternate" href="https://example.com/posts/1" />
        <updated>2026-07-25T10:00:00Z</updated></entry>
        <entry><id>bad</id><title>Bad link</title><link href="javascript:x" /></entry>
      </feed>`,
      new URL("https://example.com/atom.xml"),
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toBe("https://example.com/posts/1");
  });

  it("preserves fragments on allowed public article links", () => {
    const entries = parseSyndicationFeed(
      "<rss><channel><item><guid>fragment</guid><title>Fragment link</title><link>https://example.com/posts/1#section</link></item></channel></rss>",
      new URL("https://example.com/feed.xml"),
    );

    expect(entries[0]?.url).toBe("https://example.com/posts/1#section");
  });

  it.each([
    ["plain HTTP", "http://example.com/posts/1"],
    ["localhost", "https://localhost/posts/1"],
    ["a literal IP", "https://127.0.0.1/posts/1"],
    ["embedded credentials", "https://user:pass@example.com/posts/1"],
    ["a non-standard port", "https://example.com:8443/posts/1"],
    ["an overlong URL", `https://example.com/${"a".repeat(2040)}`],
  ])("does not ingest %s article links", (_, url) => {
    const entries = parseSyndicationFeed(
      `<rss><channel><item><guid>unsafe-link</guid><title>Unsafe link</title><link>${url}</link></item></channel></rss>`,
      new URL("https://example.com/feed.xml"),
    );

    expect(entries).toEqual([]);
  });

  it("rejects XML documents that are not RSS or Atom feeds", () => {
    expect(() =>
      parseSyndicationFeed(
        "<html><body>not a feed</body></html>",
        new URL("https://example.com/feed.xml"),
      ),
    ).toThrow("Unsupported feed document");
  });

  it.each([
    [
      "a document type declaration",
      '<!DOCTYPE rss [<!ENTITY x "expanded">]><rss><channel /></rss>',
    ],
    ["an entity declaration", '<!ENTITY x "expanded"><rss><channel /></rss>'],
    ["excessive nesting", `${"<group>".repeat(65)}${"</group>".repeat(65)}`],
  ])("rejects %s before XML parsing", (_, xml) => {
    expect(() =>
      parseSyndicationFeed(xml, new URL("https://example.com/feed.xml")),
    ).toThrow();
  });

  it("bounds feed entry work before per-entry cleanup", () => {
    const items = Array.from({ length: 101 }, (_, index) => {
      const itemId = String(index);
      return `<item><guid>${itemId}</guid><title>Item ${itemId}</title><link>https://example.com/${itemId}</link></item>`;
    }).join("");
    expect(() =>
      parseSyndicationFeed(
        `<rss><channel>${items}</channel></rss>`,
        new URL("https://example.com/feed.xml"),
        5,
      ),
    ).toThrow("Feed contains too many entries");
  });

  it("maps only the caller-requested number of entries", () => {
    const entries = parseSyndicationFeed(
      `<rss><channel>
        <item><guid>1</guid><title>One</title><link>https://example.com/1</link></item>
        <item><guid>2</guid><title>Two</title><link>https://example.com/2</link></item>
      </channel></rss>`,
      new URL("https://example.com/feed.xml"),
      1,
    );
    expect(entries.map((entry) => entry.title)).toEqual(["One"]);
  });
});

describe("story title similarity", () => {
  it("normalizes punctuation and groups closely matching Chinese titles", () => {
    expect(normalizeStoryTitle("  新功能：正式推出！ ")).toBe(
      "新功能 正式推出",
    );
    expect(
      storyTitleSimilarity("新功能正式推出", "新功能今日正式推出"),
    ).toBeGreaterThan(0.55);
  });

  it("keeps unrelated titles apart", () => {
    expect(
      storyTitleSimilarity("Cloudflare 更新 Workers", "香港週末天氣預報"),
    ).toBeLessThan(0.2);
  });
});
