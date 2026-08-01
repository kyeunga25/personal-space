import type { PostRecord } from "../publishing/domain";
import { escapeXml, publicPostPath } from "./xml";

interface SitemapOptions {
  entries?: SitemapEntry[];
  generatedAt: string;
  paths: string[];
  posts: PostRecord[];
  site: URL;
}

export interface SitemapEntry {
  path: string;
  updatedAt: string | null;
}

export function renderSitemap({
  entries = [],
  generatedAt,
  paths,
  posts,
  site,
}: SitemapOptions): string {
  const now = new Date(generatedAt);
  const staticUrls = paths.map((path) => ({ path, updatedAt: null }));
  const postUrls = posts.flatMap((post) => {
    const path = publicPostPath(post, now);
    return path ? [{ path, updatedAt: post.updatedAt }] : [];
  });
  const urls = [...staticUrls, ...postUrls, ...entries].map(
    ({ path, updatedAt }) => {
      const lastModified = updatedAt
        ? `\n    <lastmod>${escapeXml(updatedAt)}</lastmod>`
        : "";
      return `  <url>
    <loc>${escapeXml(new URL(path, site).toString())}</loc>${lastModified}
  </url>`;
    },
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}
