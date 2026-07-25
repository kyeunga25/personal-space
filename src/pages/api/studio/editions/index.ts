import type { APIRoute } from "astro";

import { D1EditionRepository } from "../../../../server/editions/repository";
import { EditionAutomationService } from "../../../../server/editions/service";
import { errorResponse, jsonResponse } from "../../../../server/http/json";
import { getBindings } from "../../../../server/platform/bindings";

export const POST: APIRoute = async () => {
  try {
    const edition = await new EditionAutomationService(
      new D1EditionRepository(getBindings().DB),
    ).generateDailyEdition();
    return jsonResponse({ edition }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
};
