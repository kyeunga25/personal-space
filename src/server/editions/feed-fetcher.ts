import { UserFacingError } from "../errors";
import type { SourceRecord } from "./domain";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;
const BLOCKED_HOST_SUFFIXES = [".internal", ".local", ".localhost"];

export class FeedFetchError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "FeedFetchError";
  }
}

export interface FeedFetchResult {
  body: string | null;
  etag: string | null;
  finalUrl: URL;
  lastModified: string | null;
  notModified: boolean;
}

export function validateFeedUrl(value: string): URL {
  if (value.length > 2048) {
    throw new UserFacingError("Feed 網址太長。", 400);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new UserFacingError("Feed 網址格式不正確。", 400);
  }

  const hostname = url.hostname.toLowerCase();
  const isLiteralIp =
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
  const isBlockedHostname =
    hostname === "localhost" ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    isLiteralIp ||
    isBlockedHostname
  ) {
    throw new UserFacingError("只支援公開的 HTTPS feed 網址。", 400);
  }
  url.hash = "";
  return url;
}

function contentLength(response: Response): number | null {
  const value = Number(response.headers.get("content-length"));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

async function readBoundedBody(
  response: Response,
  limit: number,
): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel("feed_too_large");
        throw new FeedFetchError("feed_too_large");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof FeedFetchError) throw error;
    throw new FeedFetchError("network_error");
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function fetchFeedDocument(
  source: SourceRecord,
  fetcher: typeof fetch = fetch,
): Promise<FeedFetchResult> {
  let url = validateFeedUrl(source.feedUrl);
  const headers = new Headers({
    Accept:
      "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9",
    "User-Agent": "Personal-Space-Feed-Reader/1.0",
  });
  if (source.etag) headers.set("If-None-Match", source.etag);
  if (source.lastModified) {
    headers.set("If-Modified-Since", source.lastModified);
  }

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    let response: Response;
    try {
      response = await fetcher(url, {
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      throw new FeedFetchError("network_error");
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        await response.body?.cancel();
        throw new FeedFetchError("redirect_error");
      }
      await response.body?.cancel();
      url = validateFeedUrl(new URL(location, url).toString());
      continue;
    }

    if (response.status === 304) {
      return {
        body: null,
        etag: source.etag,
        finalUrl: url,
        lastModified: source.lastModified,
        notModified: true,
      };
    }
    if (!response.ok) {
      throw new FeedFetchError(`http_${String(response.status)}`);
    }
    if ((contentLength(response) ?? 0) > MAX_FEED_BYTES) {
      await response.body?.cancel();
      throw new FeedFetchError("feed_too_large");
    }

    const bytes = await readBoundedBody(response, MAX_FEED_BYTES);
    const body = new TextDecoder().decode(bytes);
    if (!body.trimStart().startsWith("<")) {
      throw new FeedFetchError("invalid_feed");
    }
    return {
      body,
      etag: response.headers.get("etag"),
      finalUrl: url,
      lastModified: response.headers.get("last-modified"),
      notModified: false,
    };
  }

  throw new FeedFetchError("redirect_error");
}
