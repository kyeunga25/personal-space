import type { APIRoute } from "astro";

import { mediaUploadResponse } from "../../../../server/media/upload";
import { getBindings } from "../../../../server/platform/bindings";
import { D1PublishingRepository } from "../../../../server/publishing/repository";

export const POST: APIRoute = async ({ request }) => {
  const bindings = getBindings();
  const repository = new D1PublishingRepository(bindings.DB);

  return mediaUploadResponse(request, {
    createMedia: (media) => repository.createMedia(media),
    deleteMediaObject: async (key) => {
      await bindings.MEDIA.delete(key);
    },
    putMediaObject: async ({ body, customMetadata, httpMetadata, key }) => {
      await bindings.MEDIA.put(key, body, { customMetadata, httpMetadata });
    },
  });
};
