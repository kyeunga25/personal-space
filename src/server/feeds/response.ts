interface FeedTimestampRecord {
  createdAt: string;
  publishedAt: string | null;
  scheduledAt?: string | null;
  updatedAt: string;
}

interface FeedResponseInput {
  body: string;
  cacheControl: string;
  ifNoneMatch: string | null;
}

interface XmlResponseInput extends FeedResponseInput {
  contentType: string;
}

const EMPTY_FEED_BUILD_DATE = "1970-01-01T00:00:00.000Z";

export function latestFeedBuildDate(
  records: readonly FeedTimestampRecord[],
): string {
  let latest = 0;
  for (const record of records) {
    for (const value of [
      record.createdAt,
      record.publishedAt,
      record.scheduledAt,
      record.updatedAt,
    ]) {
      if (!value) continue;
      const timestamp = Date.parse(value);
      if (Number.isFinite(timestamp) && timestamp > latest) latest = timestamp;
    }
  }
  return latest > 0 ? new Date(latest).toISOString() : EMPTY_FEED_BUILD_DATE;
}

function normalizeEntityTag(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("W/") ? trimmed.slice(2).trimStart() : trimmed;
}

function matchesEntityTag(header: string | null, etag: string): boolean {
  if (!header) return false;
  return header.split(",").some((candidate) => {
    const normalized = candidate.trim();
    return normalized === "*" || normalizeEntityTag(normalized) === etag;
  });
}

async function bodyEntityTag(body: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `"${hex}"`;
}

async function xmlResponse({
  body,
  cacheControl,
  contentType,
  ifNoneMatch,
}: XmlResponseInput): Promise<Response> {
  const etag = await bodyEntityTag(body);
  const headers = new Headers({
    "Cache-Control": cacheControl,
    "Content-Type": contentType,
    ETag: etag,
  });
  return matchesEntityTag(ifNoneMatch, etag)
    ? new Response(null, { headers, status: 304 })
    : new Response(body, { headers });
}

export function feedResponse(input: FeedResponseInput): Promise<Response> {
  return xmlResponse({
    ...input,
    contentType: "application/rss+xml; charset=utf-8",
  });
}

export function sitemapResponse(input: FeedResponseInput): Promise<Response> {
  return xmlResponse({
    ...input,
    contentType: "application/xml; charset=utf-8",
  });
}
