import { createExcerpt, renderMarkdown } from "../content/markdown";
import { UserFacingError } from "../errors";
import type {
  PostRecord,
  SavePostData,
  SavePostInput,
  TaxonomyTerm,
} from "./domain";
import type { PublishingRepository } from "./repository";
import { createPostSlug, createSlug } from "./slug";

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function createTerm(name: string): TaxonomyTerm | null {
  const normalizedName = name.trim().slice(0, 80);
  const slug = createSlug(normalizedName);
  return normalizedName && slug
    ? { id: crypto.randomUUID(), name: normalizedName, slug }
    : null;
}

function createTerms(values: string[] | undefined): TaxonomyTerm[] {
  const bySlug = new Map<string, TaxonomyTerm>();
  for (const value of values ?? []) {
    const term = createTerm(value);
    if (term) {
      bySlug.set(term.slug, term);
    }
  }
  return [...bySlug.values()].slice(0, 12);
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
      throw new UserFacingError("找不到要更新的內容。", 404);
    }
    if (previous && previous.kind !== input.kind) {
      throw new UserFacingError("內容類型不能在建立後更改。");
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
    const scheduledAt =
      status === "scheduled" ? normalizeOptional(input.scheduledAt) : null;

    if (status !== "draft" && bodyMd.length === 0) {
      throw new UserFacingError("發佈、排程或封存前必須有內容。");
    }
    if (input.kind === "article" && status !== "draft" && !title) {
      throw new UserFacingError("文章在發佈或排程前必須有標題。");
    }
    if (input.action === "schedule") {
      if (!scheduledAt || new Date(scheduledAt).getTime() <= now.getTime()) {
        throw new UserFacingError("排程時間必須晚於現在。");
      }
      if (previous?.status === "published") {
        throw new UserFacingError(
          "已發佈內容不可直接排程更新；請立即發佈，或建立另一篇內容。",
        );
      }
    }

    const requestedSlug = normalizeOptional(input.slug);
    const slug =
      status === "draft" && !requestedSlug && !previous?.slug
        ? null
        : createPostSlug(requestedSlug ?? title, now, id);
    const excerpt =
      normalizeOptional(input.excerpt) ??
      (bodyMd ? createExcerpt(bodyMd) : null);
    const nowIso = now.toISOString();
    const category = input.category ? createTerm(input.category) : null;
    const tags = createTerms(input.tags);
    const heroMediaId =
      input.heroMediaId === undefined
        ? (previous?.heroMediaId ?? null)
        : normalizeOptional(input.heroMediaId);
    if (heroMediaId) {
      const media = await this.repository.findMedia(heroMediaId, true);
      if (!media) {
        throw new UserFacingError("找不到所選封面媒體。", 404);
      }
      const expectedVisibility =
        input.visibility === "private" ? "private" : "public";
      if (media.visibility !== expectedVisibility) {
        throw new UserFacingError(
          "封面媒體的可見性與內容不一致，請重新上傳或清除封面。",
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
      throw new UserFacingError("找不到要還原的修訂版本。", 404);
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
