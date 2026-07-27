import type { APIRoute } from "astro";

import { SITE } from "../config/site";
import { renderSitemap } from "../server/feeds/sitemap";
import { getBindings } from "../server/platform/bindings";
import { D1PublishingRepository } from "../server/publishing/repository";

const PUBLIC_PATHS = [
  "/",
  "/notes",
  "/articles",
  "/stream",
  "/archive",
  "/search",
  "/about",
] as const;

export const GET: APIRoute = async ({ site }) => {
  const now = new Date().toISOString();
  const posts = await new D1PublishingRepository(
    getBindings().DB,
  ).listPublicFeedPosts("all", now, 1000);

  return new Response(
    renderSitemap({
      paths: [...PUBLIC_PATHS],
      posts,
      site: site ?? new URL(`https://${SITE.domain}`),
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=900",
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
};
