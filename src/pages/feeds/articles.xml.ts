import type { APIRoute } from "astro";

import { SITE } from "../../config/site";
import { feedResponse, latestFeedBuildDate } from "../../server/feeds/response";
import { renderRssFeed } from "../../server/feeds/rss";
import { getBindings } from "../../server/platform/bindings";
import { D1PublishingRepository } from "../../server/publishing/repository";

export const GET: APIRoute = async ({ request, site }) => {
  const now = new Date().toISOString();
  const posts = await new D1PublishingRepository(
    getBindings().DB,
  ).listPublicFeedPosts("article", now);
  const generatedAt = latestFeedBuildDate(posts);

  return feedResponse({
    body: renderRssFeed({
      description:
        "公開文章與較長篇內容。 Public articles and long-form writing.",
      generatedAt,
      posts,
      selfPath: "/feeds/articles.xml",
      site: site ?? new URL(`https://${SITE.domain}`),
      title: `${SITE.name} · 文章 Articles`,
    }),
    cacheControl: "public, max-age=300",
    ifNoneMatch: request.headers.get("If-None-Match"),
  });
};
