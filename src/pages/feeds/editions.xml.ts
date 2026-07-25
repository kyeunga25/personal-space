import type { APIRoute } from "astro";

import { SITE } from "../../config/site";
import { D1EditionRepository } from "../../server/editions/repository";
import { renderEditionRss } from "../../server/feeds/edition-rss";
import { getBindings } from "../../server/platform/bindings";

export const GET: APIRoute = async ({ site }) => {
  const generatedAt = new Date().toISOString();
  const editions = await new D1EditionRepository(
    getBindings().DB,
  ).listPublicEditions(100);

  return new Response(
    renderEditionRss({
      description:
        "經站主審閱、附有原文連結的每日整理。 Owner-reviewed editions.",
      editions,
      generatedAt,
      selfPath: "/feeds/editions.xml",
      site: site ?? new URL(`https://${SITE.domain}`),
      title: `${SITE.name} · Editions`,
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=900",
        "Content-Type": "application/rss+xml; charset=utf-8",
      },
    },
  );
};
