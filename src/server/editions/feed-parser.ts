import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";

import type { FeedEntry } from "./domain";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseTagValue: false,
  removeNSPrefix: true,
  trimValues: true,
});

type XmlValue = Record<string, unknown> | string | number | null | undefined;

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value: XmlValue): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (!value || typeof value !== "object") return "";
  return textValue(value["#text"] as XmlValue);
}

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|apos|gt|lt|quot));/gi,
    (entity, decimal: string, hexadecimal: string, named: string) => {
      const codePoint = decimal
        ? Number(decimal)
        : hexadecimal
          ? Number.parseInt(hexadecimal, 16)
          : null;
      if (
        codePoint !== null &&
        Number.isInteger(codePoint) &&
        codePoint >= 0 &&
        codePoint <= 0x10ffff &&
        !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return String.fromCodePoint(codePoint);
      }
      if (codePoint !== null) return entity;
      return (
        {
          amp: "&",
          apos: "'",
          gt: ">",
          lt: "<",
          quot: '"',
        }[named.toLowerCase()] ?? entity
      );
    },
  );
}

function cleanText(value: string, limit: number): string {
  const decoded = decodeXmlEntities(value);
  return decodeXmlEntities(
    sanitizeHtml(decoded, { allowedAttributes: {}, allowedTags: [] }),
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function resolvedHttpUrl(value: string, baseUrl: URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function atomLink(entry: Record<string, unknown>, baseUrl: URL): string | null {
  const links = asArray(entry.link);
  for (const link of links) {
    if (typeof link === "string") {
      const resolved = resolvedHttpUrl(link, baseUrl);
      if (resolved) return resolved;
      continue;
    }
    if (!link || typeof link !== "object") continue;
    const record = link as Record<string, unknown>;
    const relation = textValue(record["@_rel"] as XmlValue) || "alternate";
    if (relation !== "alternate") continue;
    const resolved = resolvedHttpUrl(
      textValue(record["@_href"] as XmlValue),
      baseUrl,
    );
    if (resolved) return resolved;
  }
  return null;
}

function normalizedDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseRssItem(value: unknown, baseUrl: URL): FeedEntry | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const title = cleanText(textValue(item.title as XmlValue), 300);
  const url = resolvedHttpUrl(textValue(item.link as XmlValue), baseUrl);
  if (!title || !url) return null;
  const externalId = cleanText(textValue(item.guid as XmlValue), 500) || url;
  const summary = cleanText(
    textValue((item.description ?? item.encoded) as XmlValue),
    2000,
  );
  return {
    externalId,
    publishedAt: normalizedDate(
      textValue((item.pubDate ?? item.published ?? item.date) as XmlValue),
    ),
    summary: summary || null,
    title,
    url,
  };
}

function parseAtomEntry(value: unknown, baseUrl: URL): FeedEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  const title = cleanText(textValue(entry.title as XmlValue), 300);
  const url = atomLink(entry, baseUrl);
  if (!title || !url) return null;
  const externalId = cleanText(textValue(entry.id as XmlValue), 500) || url;
  const summary = cleanText(
    textValue((entry.summary ?? entry.content) as XmlValue),
    2000,
  );
  return {
    externalId,
    publishedAt: normalizedDate(
      textValue((entry.published ?? entry.updated) as XmlValue),
    ),
    summary: summary || null,
    title,
    url,
  };
}

export function parseSyndicationFeed(xml: string, baseUrl: URL): FeedEntry[] {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rss = parsed.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  if (channel) {
    return asArray(channel.item)
      .map((item) => parseRssItem(item, baseUrl))
      .filter((item): item is FeedEntry => item !== null);
  }

  const feed = parsed.feed as Record<string, unknown> | undefined;
  if (feed) {
    return asArray(feed.entry)
      .map((entry) => parseAtomEntry(entry, baseUrl))
      .filter((entry): entry is FeedEntry => entry !== null);
  }

  throw new Error("Unsupported feed document");
}
