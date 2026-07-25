export function jsonResponse(
  data: unknown,
  { headers, status = 200 }: { headers?: HeadersInit; status?: number } = {},
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");
  return Response.json(data, { headers: responseHeaders, status });
}

export function errorResponse(error: unknown, fallbackStatus = 400): Response {
  const message = error instanceof Error ? error.message : "無法完成要求。";
  const status = message.includes("UNIQUE constraint") ? 409 : fallbackStatus;
  return jsonResponse({ error: message }, { status });
}
