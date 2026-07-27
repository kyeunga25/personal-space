import type { DiscoveryFilters, DiscoveryKind, DiscoverySort } from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_QUERY_LENGTH = 120;
const MAX_TERM_LENGTH = 80;

function normalizeDate(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    return null;
  }
  return value;
}

function normalizeCursor(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeTerm(value: string | null): string | null {
  const normalized = value?.trim().slice(0, MAX_TERM_LENGTH);
  return normalized || null;
}

function normalizeQuery(value: string | null): string {
  return value?.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH) ?? "";
}

export function escapeFtsPhrase(query: string): string {
  return `"${query.replaceAll('"', '""')}"`;
}

export function escapeLikePattern(query: string): string {
  return query
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

export function hktDateRange(
  from: string | null,
  to: string | null,
): { fromUtc: string | null; toExclusiveUtc: string | null } {
  const normalizedFrom = normalizeDate(from);
  const normalizedTo = normalizeDate(to);
  const fromUtc = normalizedFrom
    ? new Date(`${normalizedFrom}T00:00:00+08:00`).toISOString()
    : null;
  const toExclusiveUtc = normalizedTo
    ? new Date(
        new Date(`${normalizedTo}T00:00:00+08:00`).getTime() + 86_400_000,
      ).toISOString()
    : null;
  return { fromUtc, toExclusiveUtc };
}

export function parseDiscoveryFilters(
  params: URLSearchParams,
  requestedLimit = DEFAULT_LIMIT,
): DiscoveryFilters {
  const rawKind = params.get("kind");
  const kind: DiscoveryKind =
    rawKind === "note" || rawKind === "article" ? rawKind : "all";
  const query = normalizeQuery(params.get("q"));
  const rawSort = params.get("sort");
  const sort: DiscoverySort =
    rawSort === "relevance" && query ? "relevance" : "newest";

  return {
    before: normalizeCursor(params.get("before")),
    beforeId: normalizeTerm(params.get("beforeId")),
    category: normalizeTerm(params.get("category")),
    from: normalizeDate(params.get("from")),
    kind,
    limit: Math.min(Math.max(Math.trunc(requestedLimit), 1), MAX_LIMIT),
    query,
    sort,
    tag: normalizeTerm(params.get("tag")),
    to: normalizeDate(params.get("to")),
  };
}

export function withCursor(
  params: URLSearchParams,
  cursor: DiscoveryPageCursor,
): string {
  const next = new URLSearchParams(params);
  next.set("before", cursor.before);
  next.set("beforeId", cursor.beforeId);
  return `?${next.toString()}`;
}

type DiscoveryPageCursor = NonNullable<
  import("./types").DiscoveryPage["nextCursor"]
>;
