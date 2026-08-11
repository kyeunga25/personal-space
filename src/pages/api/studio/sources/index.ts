import type { APIRoute } from "astro";

import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "../../../../server/http/json";
import { parseSourceInput } from "../../../../server/editions/input";
import { D1EditionRepository } from "../../../../server/editions/repository";
import { parseSourcePageCursor } from "../../../../server/editions/source-pagination";
import { getBindings } from "../../../../server/platform/bindings";

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = await new D1EditionRepository(getBindings().DB).listSourcePage(
      parseSourcePageCursor(url.searchParams),
    );
    return jsonResponse({
      nextCursor: page.nextCursor,
      sources: page.sources,
    });
  } catch (error) {
    return errorResponse(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const input = parseSourceInput(await readJsonBody(request));
    if (!input) {
      return jsonResponse(
        { error: "來源格式不正確。 Source data is invalid." },
        { status: 400 },
      );
    }
    const source = await new D1EditionRepository(getBindings().DB).createSource(
      input,
      new Date().toISOString(),
    );
    return jsonResponse({ source }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
};
