import type { APIRoute } from "astro";

import {
  errorResponse,
  jsonResponse,
} from "../../../../../../server/http/json";
import { getBindings } from "../../../../../../server/platform/bindings";
import { D1PublishingRepository } from "../../../../../../server/publishing/repository";
import { PublishingService } from "../../../../../../server/publishing/service";

export const POST: APIRoute = async ({ params }) => {
  if (!params.id || !params.revisionId) {
    return jsonResponse({ error: "修訂版本識別資料不正確。" }, { status: 400 });
  }

  try {
    const bindings = getBindings();
    const service = new PublishingService(
      new D1PublishingRepository(bindings.DB),
    );
    const post = await service.restoreRevision(params.id, params.revisionId);
    return jsonResponse({ post });
  } catch (error) {
    return errorResponse(error);
  }
};
