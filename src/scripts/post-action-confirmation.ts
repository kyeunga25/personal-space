import { getPostContentReadinessError } from "../config/publishing";

type PostKind = "article" | "note";
type Confirm = (message: string) => boolean;

interface PostArchiveInput {
  bodyMd: string;
  kind: string;
  title: string;
}

export type PostArchiveDecision = "cancelled" | "confirmed" | "invalid";

function isPostKind(value: string): value is PostKind {
  return value === "article" || value === "note";
}

export const POST_ARCHIVE_STATE_ERROR =
  "內容類型無效，封存已取消。 Content type is invalid; archiving was cancelled.";

export function buildPostArchiveMessage({
  bodyMd,
  kind,
  title,
}: PostArchiveInput): string | null {
  if (getPostArchiveReadinessError({ bodyMd, kind, title })) return null;
  if (!isPostKind(kind)) return null;

  const postTitle =
    title.trim() ||
    (kind === "article"
      ? "未命名文章 · Untitled article"
      : "無標題筆記 · Untitled note");
  return `確定封存「${postTitle}」？封存後不會出現在公開網站，內容仍保留在 Studio。 Archive “${postTitle}”? After archiving, it will not be available on the public site and will remain in Studio.`;
}

export function getPostArchiveReadinessError({
  bodyMd,
  kind,
  title,
}: PostArchiveInput): string | null {
  if (!isPostKind(kind)) return POST_ARCHIVE_STATE_ERROR;
  return getPostContentReadinessError({ bodyMd, kind, title });
}

export function confirmPostArchive(
  input: PostArchiveInput,
  confirm: Confirm,
): PostArchiveDecision {
  const message = buildPostArchiveMessage(input);
  if (!message) return "invalid";
  return confirm(message) ? "confirmed" : "cancelled";
}
