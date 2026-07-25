import { createExcerpt, renderMarkdown } from "../content/markdown";
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
      throw new Error("找不到要更新的內容。");
    }
    if (previous && previous.kind !== input.kind) {
      throw new Error("內容類型不能在建立後更改。");
    }

    const id = previous?.id ?? input.id ?? crypto.randomUUID();
    const title = normalizeOptional(input.title);
    const bodyMd = input.bodyMd.trim();
    const status = resolveStatus(input, previous);
    const scheduledAt =
      status === "scheduled" ? normalizeOptional(input.scheduledAt) : null;

    if (status !== "draft" && bodyMd.length === 0) {
      throw new Error("發佈、排程或封存前必須有內容。");
    }
    if (input.kind === "article" && status !== "draft" && !title) {
      throw new Error("文章在發佈或排程前必須有標題。");
    }
    if (status === "scheduled") {
      if (!scheduledAt || new Date(scheduledAt).getTime() <= now.getTime()) {
        throw new Error("排程時間必須晚於現在。");
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
    const snapshotPrevious =
      previous !== null &&
      (previous.status === "published" || previous.status === "scheduled") &&
      (previous.bodyMd !== bodyMd ||
        previous.title !== title ||
        previous.excerpt !== excerpt ||
        previous.visibility !== input.visibility);

    const post: SavePostData["post"] = {
      authorId: "owner",
      bodyHtml: renderMarkdown(bodyMd),
      bodyMd,
      createdAt: previous?.createdAt ?? nowIso,
      excerpt,
      heroMediaId: input.heroMediaId ?? previous?.heroMediaId ?? null,
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
      throw new Error("找不到要還原的修訂版本。");
    }
    return this.repository.restoreRevision(
      post,
      revision,
      renderMarkdown(revision.bodyMd),
      now.toISOString(),
    );
  }
}
