import { UserFacingError } from "../errors";

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
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    return null;
  }

  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_JSON_BODY_BYTES) {
      return null;
    }
    return JSON.parse(body) as unknown;
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
      { error: "內容網址已被使用，請更改網址識別。" },
      { status: 409 },
    );
  }

  console.error("Studio request failed", {
    errorType: error instanceof Error ? error.name : typeof error,
  });
  return jsonResponse(
    { error: "暫時無法完成要求。" },
    { status: fallbackStatus },
  );
}
