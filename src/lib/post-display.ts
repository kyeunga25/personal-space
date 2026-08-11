import type { PostKind } from "../server/publishing/domain";

interface PublicPostDisplayTitleInput {
  excerpt: string | null;
  kind: PostKind;
  title: string | null;
}

export interface PublicPostListEmptyState {
  description: string;
  descriptionEn: string;
  title: string;
  titleEn: string;
}

export function getPublicPostDisplayTitle({
  excerpt,
  kind,
  title,
}: PublicPostDisplayTitleInput): string {
  return (
    title?.trim() ||
    excerpt?.trim() ||
    (kind === "article" ? "未命名文章" : "無標題筆記")
  );
}

export function getPublicPostListEmptyState(
  kind: PostKind,
): PublicPostListEmptyState {
  return kind === "note"
    ? {
        description: "公開筆記發佈後，會按時間顯示在這裡。",
        descriptionEn:
          "Published notes will appear here in chronological order.",
        title: "暫未有公開筆記",
        titleEn: "No public notes yet",
      }
    : {
        description: "公開文章發佈後，會按時間顯示在這裡。",
        descriptionEn:
          "Published articles will appear here in chronological order.",
        title: "暫未有公開文章",
        titleEn: "No public articles yet",
      };
}
