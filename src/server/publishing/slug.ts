export function createSlug(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function createPostSlug(
  title: string | null | undefined,
  now: Date,
  randomId: string,
): string {
  const fromTitle = title ? createSlug(title) : "";
  if (fromTitle) {
    return fromTitle;
  }

  return `${now.toISOString().slice(0, 10)}-${randomId.replaceAll("-", "").slice(0, 8)}`;
}
