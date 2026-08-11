import type { APIRoute } from "astro";

import { mediaObjectResponse } from "../../server/media/response";
import { getBindings } from "../../server/platform/bindings";
import { D1PublishingRepository } from "../../server/publishing/repository";

export const GET: APIRoute = async ({ params, request }) => {
  if (!params.id) return new Response("Not found", { status: 404 });
  const bindings = getBindings();
  const media = await new D1PublishingRepository(bindings.DB).findPublicMedia(
    params.id,
    new Date().toISOString(),
  );
  if (!media || media.visibility !== "public") {
    return new Response("Not found", { status: 404 });
  }
  const object = await bindings.MEDIA.get(media.objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  return mediaObjectResponse({
    cacheControl: "public, max-age=300, stale-while-revalidate=60",
    ifNoneMatch: request.headers.get("If-None-Match"),
    mimeType: media.mimeType,
    object,
  });
};
