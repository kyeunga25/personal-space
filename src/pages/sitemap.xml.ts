import type { APIRoute } from "astro";

import { SITE } from "../config/site";
import { D1EditionRepository } from "../server/editions/repository";
import { renderSitemap } from "../server/feeds/sitemap";
import { getBindings } from "../server/platform/bindings";
import { D1PublishingRepository } from "../server/publishing/repository";

const PUBLIC_PATHS = [
  "/",
  "/notes",
  "/articles",
  "/editions",
  "/stream",
  "/archive",
  "/search",
  "/about",
] as const;

export const GET: APIRoute = async ({ site }) => {
  const now = new Date().toISOString();
  const database = getBindings().DB;
  const [posts, editions] = await Promise.all([
    new D1PublishingRepository(database).listPublicFeedPosts("all", now, 1000),
    new D1EditionRepository(database).listPublicEditions(100),
  ]);

  return new Response(
    renderSitemap({
      entries: editions.map((edition) => ({
        path: `/editions/${edition.date}`,
        updatedAt: edition.updatedAt,
      })),
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
