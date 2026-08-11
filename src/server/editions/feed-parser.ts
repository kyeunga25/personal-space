import { XMLParser } from "fast-xml-parser";
import sanitizeHtml from "sanitize-html";

import type { FeedEntry } from "./domain";
import { validateFeedUrl } from "./feed-fetcher";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: false,
  removeNSPrefix: true,
  trimValues: true,
});

const MAX_FEED_ELEMENTS = 4_096;
const MAX_FEED_ENTRIES = 100;
const MAX_XML_DEPTH = 64;
const MAX_XML_TAG_BYTES = 4_096;

type XmlValue = Record<string, unknown> | string | number | null | undefined;

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function findTagEnd(xml: string, start: number): number {
  let quote: '"' | "'" | null = null;
  for (let index = start; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === ">") return index;
  }
  return -1;
}

function localElementName(name: string): string {
  return (name.split(":").at(-1) ?? name).toLowerCase();
}

function assertBoundedXmlStructure(xml: string): void {
  let depth = 0;
  let elementCount = 0;
  let entryCount = 0;
  let offset = 0;

  while (offset < xml.length) {
    const opening = xml.indexOf("<", offset);
    if (opening === -1) break;

    if (xml.startsWith("<!--", opening)) {
      const end = xml.indexOf("-->", opening + 4);
      if (end === -1) throw new Error("Invalid feed document");
      offset = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", opening)) {
      const end = xml.indexOf("]]>", opening + 9);
      if (end === -1) throw new Error("Invalid feed document");
      offset = end + 3;
      continue;
    }
    if (xml.startsWith("<?", opening)) {
      const end = xml.indexOf("?>", opening + 2);
      if (end === -1) throw new Error("Invalid feed document");
      offset = end + 2;
      continue;
    }
    if (xml.startsWith("<!", opening)) {
      throw new Error("Feed declarations are not supported");
    }

    const end = findTagEnd(xml, opening + 1);
    if (end === -1 || end - opening + 1 > MAX_XML_TAG_BYTES) {
      throw new Error("Invalid feed document");
    }
    const token = xml.slice(opening + 1, end).trim();
    const closing = token.startsWith("/");
    const selfClosing = token.endsWith("/");
    const name = (closing ? token.slice(1) : token).match(
      /^([A-Za-z_][\w:.-]*)/u,
    )?.[1];
    if (!name) throw new Error("Invalid feed document");

    if (closing) {
      depth -= 1;
      if (depth < 0) throw new Error("Invalid feed document");
    } else {
      elementCount += 1;
      if (elementCount > MAX_FEED_ELEMENTS) {
        throw new Error("Feed contains too many elements");
      }
      const localName = localElementName(name);
      if (localName === "item" || localName === "entry") {
        entryCount += 1;
        if (entryCount > MAX_FEED_ENTRIES) {
          throw new Error("Feed contains too many entries");
        }
      }
      if (!selfClosing) {
        depth += 1;
        if (depth > MAX_XML_DEPTH) {
          throw new Error("Feed nesting is too deep");
        }
      }
    }
    offset = end + 1;
  }

  if (depth !== 0) throw new Error("Invalid feed document");
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

function resolvedPublicHttpsUrl(value: string, baseUrl: URL): string | null {
  if (!value) return null;
  try {
    const resolved = new URL(value, baseUrl);
    const fragment = resolved.hash;
    const validated = validateFeedUrl(resolved.toString());
    validated.hash = fragment;
    return validated.toString();
  } catch {
    return null;
  }
}

function atomLink(entry: Record<string, unknown>, baseUrl: URL): string | null {
  const links = asArray(entry.link);
  for (const link of links) {
    if (typeof link === "string") {
      const resolved = resolvedPublicHttpsUrl(link, baseUrl);
      if (resolved) return resolved;
      continue;
    }
    if (!link || typeof link !== "object") continue;
    const record = link as Record<string, unknown>;
    const relation = textValue(record["@_rel"] as XmlValue) || "alternate";
    if (relation !== "alternate") continue;
    const resolved = resolvedPublicHttpsUrl(
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
  const url = resolvedPublicHttpsUrl(textValue(item.link as XmlValue), baseUrl);
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

export function parseSyndicationFeed(
  xml: string,
  baseUrl: URL,
  entryLimit = MAX_FEED_ENTRIES,
): FeedEntry[] {
  assertBoundedXmlStructure(xml);
  const boundedEntryLimit = Math.min(
    Math.max(Math.trunc(entryLimit), 1),
    MAX_FEED_ENTRIES,
  );
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rss = parsed.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  if (channel) {
    return asArray(channel.item)
      .slice(0, boundedEntryLimit)
      .map((item) => parseRssItem(item, baseUrl))
      .filter((item): item is FeedEntry => item !== null);
  }

  const feed = parsed.feed as Record<string, unknown> | undefined;
  if (feed) {
    return asArray(feed.entry)
      .slice(0, boundedEntryLimit)
      .map((entry) => parseAtomEntry(entry, baseUrl))
      .filter((entry): entry is FeedEntry => entry !== null);
  }

  throw new Error("Unsupported feed document");
}
