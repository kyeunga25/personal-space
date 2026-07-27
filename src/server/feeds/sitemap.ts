import type { PostRecord } from "../publishing/domain";
import { escapeXml, publicPostPath } from "./xml";

interface SitemapOptions {
  paths: string[];
  posts: PostRecord[];
  site: URL;
}

export function renderSitemap({ paths, posts, site }: SitemapOptions): string {
  const staticUrls = paths.map((path) => ({ path, updatedAt: null }));
  const postUrls = posts.flatMap((post) => {
    const path = publicPostPath(post);
    return path ? [{ path, updatedAt: post.updatedAt }] : [];
  });
  const entries = [...staticUrls, ...postUrls].map(({ path, updatedAt }) => {
    const lastModified = updatedAt
      ? `\n    <lastmod>${escapeXml(updatedAt)}</lastmod>`
      : "";
    return `  <url>
    <loc>${escapeXml(new URL(path, site).toString())}</loc>${lastModified}
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}
