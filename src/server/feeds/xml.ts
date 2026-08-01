import type { PostRecord } from "../publishing/domain";

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function publicPostPath(post: PostRecord, now: Date): string | null {
  const scheduledIsDue =
    post.status === "scheduled" &&
    post.scheduledAt !== null &&
    new Date(post.scheduledAt).getTime() <= now.getTime();
  if (
    !post.slug ||
    post.visibility !== "public" ||
    (post.status !== "published" && !scheduledIsDue)
  ) {
    return null;
  }
  const collection = post.kind === "note" ? "notes" : "articles";
  return `/${collection}/${encodeURIComponent(post.slug)}`;
}
