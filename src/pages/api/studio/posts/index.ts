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

export const POST: APIRoute = async ({ request }) => {
  try {
    const input = parseSavePostInput(await readJsonBody(request));
    if (!input || input.id) {
      return jsonResponse(
        { error: "內容格式不正確。 Invalid content format." },
        { status: 400 },
      );
    }

    const bindings = getBindings();
    const service = new PublishingService(
      new D1PublishingRepository(bindings.DB),
    );
    const post = await service.savePost(input);
    return jsonResponse({ post }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
};
