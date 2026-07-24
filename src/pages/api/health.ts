import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return Response.json(
    {
      service: "personal-space",
      status: "ok",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};
