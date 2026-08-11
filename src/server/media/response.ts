interface MediaObject {
  body: BodyInit | null;
  httpEtag: string;
}

interface MediaObjectResponseInput {
  cacheControl: string;
  ifNoneMatch?: string | null;
  mimeType: string;
  object: MediaObject;
}

function normalizeEntityTag(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("W/") ? trimmed.slice(2).trimStart() : trimmed;
}

function matchesEntityTag(header: string | null | undefined, etag: string) {
  if (!header) return false;
  return header.split(",").some((candidate) => {
    const normalized = candidate.trim();
    return normalized === "*" || normalizeEntityTag(normalized) === etag;
  });
}

export function mediaObjectResponse({
  cacheControl,
  ifNoneMatch,
  mimeType,
  object,
}: MediaObjectResponseInput): Response {
  const headers = new Headers({
    "Cache-Control": cacheControl,
    "Content-Type": mimeType,
    ETag: object.httpEtag,
  });

  if (matchesEntityTag(ifNoneMatch, object.httpEtag)) {
    return new Response(null, { headers, status: 304 });
  }

  return new Response(object.body, { headers });
}
