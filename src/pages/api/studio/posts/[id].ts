import type { APIRoute } from "astro";

import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "../../../../server/http/json";
import { getBindings } from "../../../../server/platform/bindings";
import { parseSavePostInput } from "../../../../server/publishing/input";
import { D1PublishingRepository } from "../../../../server/publishing/repository";
import { PublishingService } from "../../../../server/publishing/service";

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  const input = parseSavePostInput(await readJsonBody(request));
  if (!id || !input || (input.id !== undefined && input.id !== id)) {
    return jsonResponse({ error: "內容格式不正確。" }, { status: 400 });
  }

  try {
    const bindings = getBindings();
    const service = new PublishingService(
      new D1PublishingRepository(bindings.DB),
    );
    const post = await service.savePost({ ...input, id });
    return jsonResponse({ post });
  } catch (error) {
    return errorResponse(error);
  }
};
