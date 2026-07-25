import type { APIRoute } from "astro";

import { EditionAutomationService } from "../../../server/editions/service";
import { D1EditionRepository } from "../../../server/editions/repository";
import { errorResponse, jsonResponse } from "../../../server/http/json";
import { getBindings } from "../../../server/platform/bindings";

export const POST: APIRoute = async () => {
  try {
    const report = await new EditionAutomationService(
      new D1EditionRepository(getBindings().DB),
    ).ingest();
    return jsonResponse({ report });
  } catch (error) {
    return errorResponse(error);
  }
};
