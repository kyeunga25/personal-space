import type { APIRoute } from "astro";

import { SITE } from "../../config/site";

export const GET: APIRoute = () => {
  return Response.json(
    {
      service: "personal-space",
      status: "ok",
      version: SITE.version,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};
