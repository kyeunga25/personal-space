import type { PostRevision } from "./domain";

export interface RevisionPageCursor {
  before: string;
  beforeId: string;
}

export interface RevisionPage {
  nextCursor: RevisionPageCursor | null;
  revisions: PostRevision[];
}

function normalizeTimestamp(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeId(value: string | null): string | null {
  if (!value || value !== value.trim() || value.length > 100) return null;
  return value;
}

export function parseRevisionPageCursor(
  params: URLSearchParams,
): RevisionPageCursor | null {
  const before = normalizeTimestamp(params.get("revisionBefore"));
  const beforeId = normalizeId(params.get("revisionBeforeId"));
  return before && beforeId ? { before, beforeId } : null;
}

export function revisionLatestHref(postId: string): string | null {
  const normalizedPostId = normalizeId(postId);
  return normalizedPostId
    ? `/studio/posts/${encodeURIComponent(normalizedPostId)}#revision-list-heading`
    : null;
}

export function revisionPageHref(
  postId: string,
  cursor: RevisionPageCursor,
): string | null {
  const normalizedPostId = normalizeId(postId);
  const before = normalizeTimestamp(cursor.before);
  const beforeId = normalizeId(cursor.beforeId);
  if (!normalizedPostId || !before || !beforeId) return null;
  const params = new URLSearchParams({
    revisionBefore: before,
    revisionBeforeId: beforeId,
  });
  return `/studio/posts/${encodeURIComponent(normalizedPostId)}?${params.toString()}#revision-list-heading`;
}
