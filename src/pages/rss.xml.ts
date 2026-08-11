import type { APIRoute } from "astro";

import { SITE } from "../config/site";
import { feedResponse, latestFeedBuildDate } from "../server/feeds/response";
import { renderRssFeed } from "../server/feeds/rss";
import { getBindings } from "../server/platform/bindings";
import { D1PublishingRepository } from "../server/publishing/repository";

export const GET: APIRoute = async ({ request, site }) => {
  const now = new Date().toISOString();
  const posts = await new D1PublishingRepository(
    getBindings().DB,
  ).listPublicFeedPosts("all", now);
  const generatedAt = latestFeedBuildDate(posts);

  return feedResponse({
    body: renderRssFeed({
      description: `${SITE.description} ${SITE.descriptionEn}`,
      generatedAt,
      posts,
      selfPath: "/rss.xml",
      site: site ?? new URL(`https://${SITE.domain}`),
      title: SITE.name,
    }),
    cacheControl: "public, max-age=300",
    ifNoneMatch: request.headers.get("If-None-Match"),
  });
};
