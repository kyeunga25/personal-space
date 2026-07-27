import type { APIRoute } from "astro";

import { SITE } from "../../config/site";
import { renderRssFeed } from "../../server/feeds/rss";
import { getBindings } from "../../server/platform/bindings";
import { D1PublishingRepository } from "../../server/publishing/repository";

export const GET: APIRoute = async ({ site }) => {
  const generatedAt = new Date().toISOString();
  const posts = await new D1PublishingRepository(
    getBindings().DB,
  ).listPublicFeedPosts("article", generatedAt);

  return new Response(
    renderRssFeed({
      description:
        "公開文章與較長篇內容。 Public articles and long-form writing.",
      generatedAt,
      posts,
      selfPath: "/feeds/articles.xml",
      site: site ?? new URL(`https://${SITE.domain}`),
      title: `${SITE.name} · 文章 Articles`,
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    },
  );
};
