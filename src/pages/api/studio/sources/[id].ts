import type { APIRoute } from "astro";

import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "../../../../server/http/json";
import { parseSourceInput } from "../../../../server/editions/input";
import { D1EditionRepository } from "../../../../server/editions/repository";
import { getBindings } from "../../../../server/platform/bindings";

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id ?? "";
    const input = parseSourceInput(await readJsonBody(request));
    if (!id || !input) {
      return jsonResponse(
        { error: "來源格式不正確。 Source data is invalid." },
        { status: 400 },
      );
    }
    const source = await new D1EditionRepository(getBindings().DB).updateSource(
      id,
      input,
      new Date().toISOString(),
    );
    return jsonResponse({ source });
  } catch (error) {
    return errorResponse(error);
  }
};
