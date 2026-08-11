export interface SavedPostResponse {
  hasWorkingCopy: boolean;
  id: string;
}

export interface PostMutationResponse extends SavedPostResponse {
  status: PostStatus;
}

type PostAction = "archive" | "publish" | "save" | "schedule";
type PostStatus = "archived" | "draft" | "published" | "scheduled";

const POST_STATUSES: PostStatus[] = [
  "archived",
  "draft",
  "published",
  "scheduled",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function identifier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 200 ? normalized : null;
}

export function parseSavedPostResponse(
  value: unknown,
): SavedPostResponse | null {
  const response = asRecord(value);
  const post = asRecord(response?.post);
  const id = identifier(post?.id);
  if (!id || typeof post?.hasWorkingCopy !== "boolean") return null;
  return { hasWorkingCopy: post.hasWorkingCopy, id };
}

export function parsePostMutationResponse(
  value: unknown,
  action: string,
): PostMutationResponse | null {
  const actions: PostAction[] = ["archive", "publish", "save", "schedule"];
  if (!actions.includes(action as PostAction)) return null;

  const saved = parseSavedPostResponse(value);
  const post = asRecord(asRecord(value)?.post);
  const status = post?.status;
  if (!saved || !POST_STATUSES.includes(status as PostStatus)) return null;

  const expectedStatus =
    action === "archive"
      ? "archived"
      : action === "publish"
        ? "published"
        : action === "schedule"
          ? "scheduled"
          : null;
  if (expectedStatus && status !== expectedStatus) return null;

  return { ...saved, status: status as PostStatus };
}
