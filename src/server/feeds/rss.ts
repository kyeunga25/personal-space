import type { PostRecord } from "../publishing/domain";
import { escapeXml, publicPostPath } from "./xml";

interface RssFeedOptions {
  description: string;
  generatedAt: string;
  posts: PostRecord[];
  selfPath: string;
  site: URL;
  title: string;
}

function formatRssDate(value: string): string {
  return new Date(value).toUTCString();
}

export function renderRssFeed(options: RssFeedOptions): string {
  const { description, generatedAt, posts, selfPath, site, title } = options;
  const siteUrl = new URL("/", site).toString();
  const selfUrl = new URL(selfPath, site).toString();
  const now = new Date(generatedAt);
  const items = posts.flatMap((post) => {
    const path = publicPostPath(post, now);
    if (!path) return [];
    const link = new URL(path, site).toString();
    const publishedAt = post.publishedAt ?? post.scheduledAt ?? post.createdAt;
    const postTitle = post.title ?? post.excerpt ?? "無標題筆記";

    return [
      `    <item>
      <title>${escapeXml(postTitle)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${escapeXml(formatRssDate(publishedAt))}</pubDate>
      <description>${escapeXml(post.excerpt ?? "")}</description>
    </item>`,
    ];
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>zh-Hant-HK</language>
    <lastBuildDate>${escapeXml(formatRssDate(generatedAt))}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;
}
