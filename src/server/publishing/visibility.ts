import type { PostRecord } from "./domain";

export function isDue(post: PostRecord, now: Date): boolean {
  return (
    post.status === "scheduled" &&
    post.scheduledAt !== null &&
    new Date(post.scheduledAt).getTime() <= now.getTime()
  );
}

export function isPublishedNow(post: PostRecord, now: Date): boolean {
  return post.status === "published" || isDue(post, now);
}

export function canListPublicly(post: PostRecord, now: Date): boolean {
  return post.visibility === "public" && isPublishedNow(post, now);
}

export function canReadExactPublicRoute(post: PostRecord, now: Date): boolean {
  return post.visibility !== "private" && isPublishedNow(post, now);
}
