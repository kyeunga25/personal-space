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
  ).listPublicFeedPosts("note", now);
  const generatedAt = latestFeedBuildDate(posts);

  return feedResponse({
    body: renderRssFeed({
      description: "公開筆記與短篇更新。 Public notes and short updates.",
      generatedAt,
      posts,
      selfPath: "/feeds/notes.xml",
      site: site ?? new URL(`https://${SITE.domain}`),
      title: `${SITE.name} · 筆記 Notes`,
    }),
    cacheControl: "public, max-age=300",
    ifNoneMatch: request.headers.get("If-None-Match"),
  });
};
