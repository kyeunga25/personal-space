const WRITE_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);

export function isWriteMethod(method: string): boolean {
  return WRITE_METHODS.has(method.toUpperCase());
}

export function isSameOriginWrite(request: Request): boolean {
  if (!isWriteMethod(request.method)) {
    return true;
  }

  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (origin !== url.origin) {
    return false;
  }

  return fetchSite === null || fetchSite === "same-origin";
}
