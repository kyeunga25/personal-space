import { parsePublicHttpsUrl } from "../../lib/public-https-url";
import { UserFacingError } from "../errors";
import type { SourceRecord } from "./domain";

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 10_000;

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
  const result = parsePublicHttpsUrl(value);
  if (result.ok) return result.url;

  switch (result.reason) {
    case "too-long":
      throw new UserFacingError("Feed 網址太長。 Feed URL is too long.", 400);
    case "invalid":
      throw new UserFacingError(
        "Feed 網址格式不正確。 Feed URL format is invalid.",
        400,
      );
    case "not-public-https":
      throw new UserFacingError(
        "只支援公開的 HTTPS feed 網址。 Only public HTTPS feed URLs are supported.",
        400,
      );
  }
}

function contentLength(response: Response): number | null {
  const value = Number(response.headers.get("content-length"));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

async function cancelResponseBody(
  response: Response,
  reason: string,
): Promise<void> {
  try {
    await response.body?.cancel(reason);
  } catch {
    // Cleanup must not replace the primary fetch result or error code.
  }
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
        try {
          await reader.cancel("feed_too_large");
        } catch {
          // The bounded size error remains the primary failure mode.
        }
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
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
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
        signal,
      });
    } catch {
      throw new FeedFetchError("network_error");
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        await cancelResponseBody(response, "redirect_error");
        throw new FeedFetchError("redirect_error");
      }
      await cancelResponseBody(response, "redirect_followed");
      url = validateFeedUrl(new URL(location, url).toString());
      continue;
    }

    if (response.status === 304) {
      await cancelResponseBody(response, "not_modified");
      return {
        body: null,
        etag: source.etag,
        finalUrl: url,
        lastModified: source.lastModified,
        notModified: true,
      };
    }
    if (!response.ok) {
      await cancelResponseBody(response, "http_error");
      throw new FeedFetchError(`http_${String(response.status)}`);
    }
    if ((contentLength(response) ?? 0) > MAX_FEED_BYTES) {
      await cancelResponseBody(response, "feed_too_large");
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
