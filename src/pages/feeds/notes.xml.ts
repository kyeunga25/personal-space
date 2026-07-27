import type { APIRoute } from "astro";

import { SITE } from "../../config/site";
import { renderRssFeed } from "../../server/feeds/rss";
import { getBindings } from "../../server/platform/bindings";
import { D1PublishingRepository } from "../../server/publishing/repository";

export const GET: APIRoute = async ({ site }) => {
  const generatedAt = new Date().toISOString();
  const posts = await new D1PublishingRepository(
    getBindings().DB,
  ).listPublicFeedPosts("note", generatedAt);

  return new Response(
    renderRssFeed({
      description: "公開筆記與短篇更新。 Public notes and short updates.",
      generatedAt,
      posts,
      selfPath: "/feeds/notes.xml",
      site: site ?? new URL(`https://${SITE.domain}`),
      title: `${SITE.name} · 筆記 Notes`,
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    },
  );
};
