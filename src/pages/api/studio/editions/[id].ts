import type { APIRoute } from "astro";

import { parseEditionSaveInput } from "../../../../server/editions/input";
import { D1EditionRepository } from "../../../../server/editions/repository";
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "../../../../server/http/json";
import { getBindings } from "../../../../server/platform/bindings";

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id ?? "";
    const input = parseEditionSaveInput(await readJsonBody(request));
    if (!id || !input) {
      return jsonResponse(
        { error: "Edition 格式不正確。 Edition data is invalid." },
        { status: 400 },
      );
    }
    const edition = await new D1EditionRepository(getBindings().DB).saveEdition(
      id,
      input,
      new Date().toISOString(),
    );
    return jsonResponse({ edition });
  } catch (error) {
    return errorResponse(error);
  }
};
