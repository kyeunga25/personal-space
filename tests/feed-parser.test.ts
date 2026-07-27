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

  it("parses Atom alternate links and rejects non-http links", () => {
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

  it("rejects XML documents that are not RSS or Atom feeds", () => {
    expect(() =>
      parseSyndicationFeed(
        "<html><body>not a feed</body></html>",
        new URL("https://example.com/feed.xml"),
      ),
    ).toThrow("Unsupported feed document");
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
