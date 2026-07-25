import type { APIRoute } from "astro";

import { renderMarkdown } from "../../../server/content/markdown";
import { jsonResponse, readJsonBody } from "../../../server/http/json";

export const POST: APIRoute = async ({ request }) => {
  const value = await readJsonBody(request);
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as Record<string, unknown>).bodyMd !== "string"
  ) {
    return jsonResponse({ error: "Markdown 格式不正確。" }, { status: 400 });
  }

  return jsonResponse({
    html: renderMarkdown((value as { bodyMd: string }).bodyMd),
  });
};
