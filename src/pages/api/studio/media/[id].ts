import type { APIRoute } from "astro";

import { getBindings } from "../../../../server/platform/bindings";
import { D1PublishingRepository } from "../../../../server/publishing/repository";

export const GET: APIRoute = async ({ params }) => {
  if (!params.id) return new Response("Not found", { status: 404 });
  const bindings = getBindings();
  const media = await new D1PublishingRepository(bindings.DB).findMedia(
    params.id,
    true,
  );
  if (!media) return new Response("Not found", { status: 404 });
  const object = await bindings.MEDIA.get(media.objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": media.mimeType,
    ETag: object.httpEtag,
  });
  return new Response(object.body, { headers });
};
