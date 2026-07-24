import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  return Response.json(
    {
      service: "personal-space",
      status: "ok",
      phase: 0,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};
