import type { APIRoute } from "astro";

import { EditionAutomationService } from "../../../server/editions/service";
import { D1EditionRepository } from "../../../server/editions/repository";
import { UserFacingError } from "../../../server/errors";
import { errorResponse, jsonResponse } from "../../../server/http/json";
import { getBindings } from "../../../server/platform/bindings";

export const POST: APIRoute = async () => {
  try {
    const result = await new EditionAutomationService(
      new D1EditionRepository(getBindings().DB),
    ).runIngestion();
    if (result.status === "failed") {
      throw new UserFacingError(
        "所有已啟用來源均同步失敗，請查看執行紀錄。",
        502,
      );
    }
    return jsonResponse({ result });
  } catch (error) {
    return errorResponse(error);
  }
};
