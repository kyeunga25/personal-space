import { createExcerpt, renderMarkdown } from "../content/markdown";
import {
  getPostContentReadinessError,
  SCHEDULE_FUTURE_REQUIRED_ERROR,
} from "../../config/publishing";
import { UserFacingError } from "../errors";
import type {
  PostRecord,
  SavePostData,
  SavePostInput,
  TaxonomyTerm,
} from "./domain";
import { POST_INPUT_LIMITS } from "./input";
import type { PublishingRepository } from "./repository";
import { createPostSlug, createSlug } from "./slug";

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function createTerm(name: string, maxLength: number): TaxonomyTerm | null {
  const normalizedName = name.trim().slice(0, maxLength);
  const slug = createSlug(normalizedName);
  return normalizedName && slug
    ? { id: crypto.randomUUID(), name: normalizedName, slug }
    : null;
}

function createTerms(values: string[] | undefined): TaxonomyTerm[] {
  const bySlug = new Map<string, TaxonomyTerm>();
  for (const value of values ?? []) {
    const term = createTerm(value, POST_INPUT_LIMITS.tag);
    if (term) {
      bySlug.set(term.slug, term);
    }
  }
  return [...bySlug.values()].slice(0, POST_INPUT_LIMITS.tags);
}

function resolveStatus(
  input: SavePostInput,
  previous: PostRecord | null,
): PostRecord["status"] {
  if (input.action === "archive") return "archived";
  if (input.action === "publish") return "published";
  if (input.action === "schedule") return "scheduled";
  return previous?.status ?? "draft";
}

export class PublishingService {
  constructor(private readonly repository: PublishingRepository) {}

  async savePost(input: SavePostInput, now = new Date()): Promise<PostRecord> {
    const previous = input.id
      ? await this.repository.findOwnerPost(input.id)
      : null;
    if (input.id && !previous) {
      throw new UserFacingError(
        "找不到要更新的內容。 The content to update could not be found.",
        404,
      );
    }
    if (previous && previous.kind !== input.kind) {
      throw new UserFacingError(
        "內容類型不能在建立後更改。 Content type cannot be changed after creation.",
      );
    }

    const id = previous?.id ?? input.id ?? crypto.randomUUID();
    const title = normalizeOptional(input.title);
    const bodyMd = input.bodyMd.trim();
    const status = resolveStatus(input, previous);
    const persistence: SavePostData["persistence"] =
      input.action === "save" &&
      previous !== null &&
      (previous.status === "published" || previous.status === "scheduled")
        ? "working-copy"
        : "canonical";
    let scheduledAt: string | null = null;
    const requestedScheduledAt =
      input.scheduledAt === undefined
        ? (previous?.scheduledAt ?? null)
        : normalizeOptional(input.scheduledAt);

    if (input.action !== "save") {
      const readinessError = getPostContentReadinessError({
        bodyMd,
        kind: input.kind,
        title,
      });
      if (readinessError) throw new UserFacingError(readinessError);
    }
    if (
      status === "scheduled" ||
      (input.action === "save" &&
        status !== "published" &&
        requestedScheduledAt)
    ) {
      const scheduledTime = requestedScheduledAt
        ? Date.parse(requestedScheduledAt)
        : Number.NaN;
      if (!Number.isFinite(scheduledTime)) {
        throw new UserFacingError(
          "排程時間必須是有效日期。 Schedule time must be a valid date.",
        );
      }
      if (input.action === "schedule" && scheduledTime <= now.getTime()) {
        throw new UserFacingError(SCHEDULE_FUTURE_REQUIRED_ERROR);
      }
      scheduledAt = new Date(scheduledTime).toISOString();
    }
    if (input.action === "schedule") {
      if (previous?.status === "published") {
        throw new UserFacingError(
          "已發佈內容不可直接排程更新；請立即發佈，或建立另一篇內容。 Published content cannot be scheduled directly; publish the update now or create a separate post.",
        );
      }
    }

    const requestedSlug = normalizeOptional(input.slug);
    const slug =
      input.slug === undefined && previous?.slug
        ? previous.slug
        : status === "draft" && !requestedSlug && !previous?.slug
          ? null
          : createPostSlug(requestedSlug ?? title, now, id);
    const excerpt =
      normalizeOptional(input.excerpt) ??
      (bodyMd ? createExcerpt(bodyMd) : null);
    const nowIso = now.toISOString();
    const category = input.category
      ? createTerm(input.category, POST_INPUT_LIMITS.category)
      : null;
    const tags = createTerms(input.tags);
    const heroMediaId =
      input.heroMediaId === undefined
        ? (previous?.heroMediaId ?? null)
        : normalizeOptional(input.heroMediaId);
    if (heroMediaId) {
      const media = await this.repository.findMedia(heroMediaId, true);
      if (!media) {
        throw new UserFacingError(
          "找不到所選封面媒體。 The selected cover media could not be found.",
          404,
        );
      }
      const expectedVisibility =
        input.visibility === "private" ? "private" : "public";
      if (media.visibility !== expectedVisibility) {
        throw new UserFacingError(
          "封面媒體的可見性與內容不一致，請重新上傳或清除封面。 Cover media visibility does not match the content; upload it again or clear the cover.",
        );
      }
    }
    const snapshotPrevious =
      persistence === "canonical" &&
      previous !== null &&
      (previous.status === "published" || previous.status === "scheduled") &&
      input.action !== "save";

    const post: SavePostData["post"] = {
      authorId: "owner",
      bodyHtml: renderMarkdown(bodyMd),
      bodyMd,
      createdAt: previous?.createdAt ?? nowIso,
      excerpt,
      heroMediaId,
      id,
      kind: input.kind,
      pinned: previous?.pinned ?? false,
      publishedAt:
        status === "published"
          ? (previous?.publishedAt ?? nowIso)
          : status === "scheduled"
            ? scheduledAt
            : (previous?.publishedAt ?? null),
      scheduledAt,
      slug,
      status,
      title,
      updatedAt: nowIso,
      visibility: input.visibility,
    };

    return this.repository.savePost({
      category,
      persistence,
      post,
      snapshotPrevious,
      tags,
    });
  }

  async restoreRevision(
    postId: string,
    revisionId: string,
    now = new Date(),
  ): Promise<PostRecord> {
    const [post, revision] = await Promise.all([
      this.repository.findOwnerPost(postId),
      this.repository.findRevision(revisionId),
    ]);
    if (!post || !revision || revision.postId !== post.id) {
      throw new UserFacingError(
        "找不到要還原的修訂版本。 The revision to restore could not be found.",
        404,
      );
    }
    return this.repository.restoreRevision(
      post,
      revision,
      renderMarkdown(revision.bodyMd),
      now.toISOString(),
      post.status === "published" || post.status === "scheduled",
    );
  }
}
