import type { EditionRecord } from "../editions/domain";
import { createExcerpt } from "../content/markdown";
import { escapeXml } from "./xml";

interface EditionRssOptions {
  description: string;
  editions: EditionRecord[];
  generatedAt: string;
  selfPath: string;
  site: URL;
  title: string;
}

function formatRssDate(value: string): string {
  return new Date(value).toUTCString();
}

export function renderEditionRss(options: EditionRssOptions): string {
  const { description, editions, generatedAt, selfPath, site, title } = options;
  const siteUrl = new URL("/editions", site).toString();
  const selfUrl = new URL(selfPath, site).toString();
  const items = editions.flatMap((edition) => {
    if (edition.status !== "published") return [];
    const link = new URL(`/editions/${edition.date}`, site).toString();
    const publishedAt = edition.publishedAt ?? edition.updatedAt;

    return [
      `    <item>
      <title>${escapeXml(edition.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${escapeXml(formatRssDate(publishedAt))}</pubDate>
      <description>${escapeXml(createExcerpt(edition.introMd, 280))}</description>
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
