import { UserFacingError } from "../errors";
import { readBoundedBody } from "./bounded-body";

export const MAX_JSON_BODY_BYTES = 1024 * 1024;

export function jsonResponse(
  data: unknown,
  { headers, status = 200 }: { headers?: HeadersInit; status?: number } = {},
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return Response.json(data, { headers: responseHeaders, status });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const body = await readBoundedBody(request, MAX_JSON_BODY_BYTES);
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    return null;
  }
}

export function errorResponse(error: unknown, fallbackStatus = 500): Response {
  if (error instanceof UserFacingError) {
    return jsonResponse({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
    return jsonResponse(
      {
        error:
          "內容網址已被使用，請更改網址識別。 This content URL is already in use; choose a different slug.",
      },
      { status: 409 },
    );
  }

  console.error("Studio request failed", {
    errorType: error instanceof Error ? error.name : typeof error,
  });
  return jsonResponse(
    {
      error: "暫時無法完成要求。 The request could not be completed right now.",
    },
    { status: fallbackStatus },
  );
}
