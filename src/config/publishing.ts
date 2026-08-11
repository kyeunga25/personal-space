export const POST_INPUT_LIMITS = {
  bodyMd: 100_000,
  category: 80,
  excerpt: 500,
  heroMediaId: 200,
  id: 200,
  scheduledAt: 64,
  slug: 200,
  tag: 80,
  tags: 12,
  title: 180,
} as const;

export const POST_CONTENT_REQUIRED_ERROR =
  "發佈、排程或封存前必須有內容。 Content is required before publishing, scheduling, or archiving.";

export const ARTICLE_TITLE_REQUIRED_ERROR =
  "文章在發佈、排程或封存前必須有標題。 Articles require a title before publishing, scheduling, or archiving.";

export const SCHEDULE_FUTURE_REQUIRED_ERROR =
  "排程時間必須晚於現在。 Schedule time must be in the future.";

interface PostContentReadinessInput {
  bodyMd: string;
  kind: string;
  title: string | null | undefined;
}

export function getPostContentReadinessError({
  bodyMd,
  kind,
  title,
}: PostContentReadinessInput): string | null {
  if (!bodyMd.trim()) return POST_CONTENT_REQUIRED_ERROR;
  if (kind === "article" && !title?.trim()) {
    return ARTICLE_TITLE_REQUIRED_ERROR;
  }
  return null;
}
