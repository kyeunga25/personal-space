export const PUBLIC_EDITION_PAGE_SIZE = 30;

export function normalizeEditionDate(value: string | null): string | null {
  if (!value || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10) === value ? value : null;
}

export function parseEditionPageCursor(params: URLSearchParams): string | null {
  return normalizeEditionDate(params.get("before"));
}

export function editionPageHref(cursor: string): string | null {
  const normalized = normalizeEditionDate(cursor);
  if (!normalized) return null;
  const params = new URLSearchParams({ before: normalized });
  return `?${params.toString()}#edition-list`;
}
