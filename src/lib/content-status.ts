import type { EditionStatus } from "../server/editions/domain";
import type { PostStatus } from "../server/publishing/domain";

type StudioContentStatus = EditionStatus | PostStatus;

const CONTENT_STATUS_LABELS = {
  archived: "已封存 Archived",
  draft: "草稿 Draft",
  published: "已發佈 Published",
  scheduled: "已排程 Scheduled",
} satisfies Record<PostStatus, string>;

export function formatContentStatus(status: StudioContentStatus): string {
  return Object.hasOwn(CONTENT_STATUS_LABELS, status)
    ? CONTENT_STATUS_LABELS[status]
    : "未識別內容狀態 Unknown content status";
}

export function formatEditionItemCount(count: number): string {
  if (!Number.isSafeInteger(count) || count < 0) {
    return "項目數量不明 Item count unavailable";
  }
  return `${String(count)} 個項目 ${String(count)} ${count === 1 ? "item" : "items"}`;
}
