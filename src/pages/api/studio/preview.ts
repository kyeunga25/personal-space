import type { APIRoute } from "astro";

import { renderMarkdown } from "../../../server/content/markdown";
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
} from "../../../server/http/json";
import { POST_INPUT_LIMITS } from "../../../server/publishing/input";

export const POST: APIRoute = async ({ request }) => {
  try {
    const value = await readJsonBody(request);
    if (
      typeof value !== "object" ||
      value === null ||
      typeof (value as Record<string, unknown>).bodyMd !== "string" ||
      (value as { bodyMd: string }).bodyMd.length > POST_INPUT_LIMITS.bodyMd
    ) {
      return jsonResponse(
        { error: "Markdown 格式不正確。 Invalid Markdown format." },
        { status: 400 },
      );
    }

    return jsonResponse({
      html: renderMarkdown((value as { bodyMd: string }).bodyMd),
    });
  } catch (error) {
    return errorResponse(error);
  }
};
