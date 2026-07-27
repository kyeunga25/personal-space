import type { PostRecord } from "../publishing/domain";

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function publicPostPath(post: PostRecord): string | null {
  if (
    !post.slug ||
    post.visibility !== "public" ||
    (post.status !== "published" && post.status !== "scheduled")
  ) {
    return null;
  }
  const collection = post.kind === "note" ? "notes" : "articles";
  return `/${collection}/${encodeURIComponent(post.slug)}`;
}
