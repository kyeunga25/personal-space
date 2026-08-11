export interface SourcePageCursor {
  before: string;
  beforeId: string;
}

function normalizeTimestamp(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeSourceId(value: string | null): string | null {
  if (!value || value !== value.trim() || value.length > 100) return null;
  return value;
}

export function parseSourcePageCursor(
  params: URLSearchParams,
): SourcePageCursor | null {
  const before = normalizeTimestamp(params.get("sourceBefore"));
  const beforeId = normalizeSourceId(params.get("sourceBeforeId"));
  return before && beforeId ? { before, beforeId } : null;
}

export function sourcePageHref(cursor: SourcePageCursor): string | null {
  const before = normalizeTimestamp(cursor.before);
  const beforeId = normalizeSourceId(cursor.beforeId);
  if (!before || !beforeId) return null;
  const params = new URLSearchParams({
    sourceBefore: before,
    sourceBeforeId: beforeId,
  });
  return `?${params.toString()}#source-list-heading`;
}

export function sourceLatestHref(): string {
  return "/studio/sources#source-list-heading";
}
