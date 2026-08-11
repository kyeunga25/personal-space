import type {
  MediaRecord,
  PostKind,
  PostRecord,
  PostRevision,
  SavePostData,
  TaxonomyTerm,
} from "./domain";
import {
  escapeFtsPhrase,
  escapeLikePattern,
  hktDateRange,
  isDiscoveryRelevanceAvailable,
} from "../discovery/filters";
import type {
  ArchiveMonth,
  DiscoveryFilters,
  DiscoveryKind,
  DiscoveryPage,
  PublicTaxonomy,
  TaxonomyCount,
} from "../discovery/types";
import type { RevisionPage, RevisionPageCursor } from "./revision-pagination";

interface PostRow {
  author_id: string;
  body_html: string;
  body_md: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  created_at: string;
  excerpt: string | null;
  hero_media_id: string | null;
  id: string;
  kind: PostKind;
  pinned: number;
  published_at: string | null;
  scheduled_at: string | null;
  search_rank?: number;
  slug: string | null;
  status: PostRecord["status"];
  tags_json: string;
  title: string | null;
  updated_at: string;
  visibility: PostRecord["visibility"];
}

interface PostWorkingCopyRow {
  body_html: string;
  body_md: string;
  category_json: string | null;
  excerpt: string | null;
  hero_media_id: string | null;
  post_id: string;
  scheduled_at: string | null;
  slug: string | null;
  tags_json: string;
  title: string | null;
  updated_at: string;
  visibility: PostRecord["visibility"];
}

interface MediaRow {
  alt_text: string;
  byte_size: number;
  created_at: string;
  height: number;
  id: string;
  mime_type: string;
  object_key: string;
  updated_at: string;
  visibility: MediaRecord["visibility"];
  width: number;
}

interface RevisionRow {
  body_md: string;
  category_id: string | null;
  created_at: string;
  excerpt: string | null;
  hero_media_id: string | null;
  id: string;
  post_id: string;
  slug: string | null;
  tags_json: string;
  title: string | null;
  visibility: PostRecord["visibility"];
}

interface TaxonomyCountRow {
  count: number;
  name: string;
  slug: string;
}

interface OwnerPostStatusCountRow {
  draft_count: number;
  published_count: number;
  scheduled_count: number;
}

const POST_SELECT = `
  SELECT
    p.*,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    COALESCE(
      json_group_array(
        json_object('id', t.id, 'name', t.name, 'slug', t.slug)
      ) FILTER (WHERE t.id IS NOT NULL),
      '[]'
    ) AS tags_json
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN post_tags pt ON pt.post_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id
`;

const DISCOVERY_POST_SELECT = `
  SELECT
    p.*,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    COALESCE(
      (
        SELECT json_group_array(
          json_object('id', t.id, 'name', t.name, 'slug', t.slug)
        )
        FROM post_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id
      ),
      '[]'
    ) AS tags_json
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
`;

const DISCOVERY_SEARCH_RANK = "bm25(posts_fts, 8.0, 4.0, 1.0)";

const DISCOVERY_FTS_SELECT = `
  SELECT
    p.*,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    ${DISCOVERY_SEARCH_RANK} AS search_rank,
    COALESCE(
      (
        SELECT json_group_array(
          json_object('id', t.id, 'name', t.name, 'slug', t.slug)
        )
        FROM post_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id
      ),
      '[]'
    ) AS tags_json
  FROM posts_fts
  JOIN posts p ON p.rowid = posts_fts.rowid
  LEFT JOIN categories c ON c.id = p.category_id
`;

const PUBLIC_POST_STATE = `
  p.visibility = 'public'
  AND (
    p.status = 'published'
    OR (p.status = 'scheduled' AND p.scheduled_at <= ?)
  )
`;

function mapTaxonomyCount(row: TaxonomyCountRow): TaxonomyCount {
  return {
    count: row.count,
    name: row.name,
    slug: row.slug,
  };
}

function parseTags(value: string): TaxonomyTerm[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (item): item is TaxonomyTerm =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as TaxonomyTerm).id === "string" &&
      typeof (item as TaxonomyTerm).name === "string" &&
      typeof (item as TaxonomyTerm).slug === "string",
  );
}

function parseTerm(value: string | null): TaxonomyTerm | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      typeof parsed.id === "string" &&
      "name" in parsed &&
      typeof parsed.name === "string" &&
      "slug" in parsed &&
      typeof parsed.slug === "string"
      ? { id: parsed.id, name: parsed.name, slug: parsed.slug }
      : null;
  } catch {
    return null;
  }
}

function mapPost(row: PostRow): PostRecord {
  const category =
    row.category_id && row.category_name && row.category_slug
      ? {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
        }
      : null;

  return {
    authorId: row.author_id,
    bodyHtml: row.body_html,
    bodyMd: row.body_md,
    category,
    createdAt: row.created_at,
    excerpt: row.excerpt,
    hasWorkingCopy: false,
    heroMediaId: row.hero_media_id,
    id: row.id,
    kind: row.kind,
    pinned: row.pinned === 1,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    slug: row.slug,
    status: row.status,
    tags: parseTags(row.tags_json),
    title: row.title,
    updatedAt: row.updated_at,
    visibility: row.visibility,
  };
}

function mergeWorkingCopy(
  post: PostRecord,
  working: PostWorkingCopyRow,
): PostRecord {
  return {
    ...post,
    bodyHtml: working.body_html,
    bodyMd: working.body_md,
    category: parseTerm(working.category_json),
    excerpt: working.excerpt,
    hasWorkingCopy: true,
    heroMediaId: working.hero_media_id,
    scheduledAt: working.scheduled_at,
    slug: working.slug,
    tags: parseTags(working.tags_json),
    title: working.title,
    updatedAt: working.updated_at,
    visibility: working.visibility,
  };
}

function mapMedia(row: MediaRow): MediaRecord {
  return {
    altText: row.alt_text,
    byteSize: row.byte_size,
    createdAt: row.created_at,
    height: row.height,
    id: row.id,
    mimeType: row.mime_type,
    objectKey: row.object_key,
    updatedAt: row.updated_at,
    visibility: row.visibility,
    width: row.width,
  };
}

function mapRevision(row: RevisionRow): PostRevision {
  return {
    bodyMd: row.body_md,
    categoryId: row.category_id,
    createdAt: row.created_at,
    excerpt: row.excerpt,
    heroMediaId: row.hero_media_id,
    id: row.id,
    postId: row.post_id,
    slug: row.slug,
    tags: parseTags(row.tags_json),
    title: row.title,
    visibility: row.visibility,
  };
}

export interface PublishingRepository {
  findMedia(id: string, owner?: boolean): Promise<MediaRecord | null>;
  findOwnerPost(id: string): Promise<PostRecord | null>;
  findRevision(id: string): Promise<PostRevision | null>;
  restoreRevision(
    post: PostRecord,
    revision: PostRevision,
    bodyHtml: string,
    now: string,
    asWorkingCopy: boolean,
  ): Promise<PostRecord>;
  savePost(data: SavePostData): Promise<PostRecord>;
}

export class D1PublishingRepository implements PublishingRepository {
  constructor(private readonly database: D1Database) {}

  async listPublicPosts(
    kind: PostKind,
    now: string,
    limit = 20,
  ): Promise<PostRecord[]> {
    const result = await this.database
      .prepare(
        `${POST_SELECT}
         WHERE p.kind = ?
           AND p.visibility = 'public'
           AND (
             p.status = 'published'
             OR (p.status = 'scheduled' AND p.scheduled_at <= ?)
           )
         GROUP BY p.id
         ORDER BY COALESCE(p.published_at, p.scheduled_at) DESC
         LIMIT ?`,
      )
      .bind(kind, now, limit)
      .all<PostRow>();

    return result.results.map(mapPost);
  }

  async findPublicPost(
    kind: PostKind,
    slug: string,
    now: string,
  ): Promise<PostRecord | null> {
    const row = await this.database
      .prepare(
        `${POST_SELECT}
         WHERE p.kind = ?
           AND p.slug = ?
           AND p.visibility IN ('public', 'unlisted')
           AND (
             p.status = 'published'
             OR (p.status = 'scheduled' AND p.scheduled_at <= ?)
           )
         GROUP BY p.id
         LIMIT 1`,
      )
      .bind(kind, slug, now)
      .first<PostRow>();

    return row ? mapPost(row) : null;
  }

  async countOwnerPostsByStatus(): Promise<{
    draft: number;
    published: number;
    scheduled: number;
  }> {
    const row = await this.database
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0)
             AS draft_count,
           COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0)
             AS published_count,
           COALESCE(SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END), 0)
             AS scheduled_count
         FROM posts`,
      )
      .first<OwnerPostStatusCountRow>();

    return {
      draft: row?.draft_count ?? 0,
      published: row?.published_count ?? 0,
      scheduled: row?.scheduled_count ?? 0,
    };
  }

  async listOwnerPosts(limit = 50): Promise<PostRecord[]> {
    const result = await this.database
      .prepare(
        `${POST_SELECT}
         GROUP BY p.id
         ORDER BY p.updated_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<PostRow>();
    const posts = result.results.map(mapPost);
    if (posts.length === 0) return posts;
    const placeholders = posts.map(() => "?").join(", ");
    const working = await this.database
      .prepare(
        `SELECT post_id FROM post_working_copies
         WHERE post_id IN (${placeholders})`,
      )
      .bind(...posts.map((post) => post.id))
      .all<{ post_id: string }>();
    const workingIds = new Set(working.results.map((row) => row.post_id));
    return posts.map((post) => ({
      ...post,
      hasWorkingCopy: workingIds.has(post.id),
    }));
  }

  async listPublicDiscovery(
    filters: DiscoveryFilters,
    now: string,
  ): Promise<DiscoveryPage> {
    const bindings: (number | string)[] = [now];
    const conditions = [PUBLIC_POST_STATE];
    const useFts = isDiscoveryRelevanceAvailable(filters.query);
    const useRelevance = useFts && filters.sort === "relevance";

    if (filters.query) {
      if (useFts) {
        conditions.push("posts_fts MATCH ?");
        bindings.push(escapeFtsPhrase(filters.query));
      } else {
        conditions.push(`(
          COALESCE(p.title, '') LIKE ? ESCAPE '\\'
          OR COALESCE(p.excerpt, '') LIKE ? ESCAPE '\\'
          OR p.body_md LIKE ? ESCAPE '\\'
        )`);
        const pattern = `%${escapeLikePattern(filters.query)}%`;
        bindings.push(pattern, pattern, pattern);
      }
    }

    if (filters.kind !== "all") {
      conditions.push("p.kind = ?");
      bindings.push(filters.kind);
    }
    if (filters.category) {
      conditions.push("c.slug = ?");
      bindings.push(filters.category);
    }
    if (filters.tag) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM post_tags selected_pt
        JOIN tags selected_tag ON selected_tag.id = selected_pt.tag_id
        WHERE selected_pt.post_id = p.id AND selected_tag.slug = ?
      )`);
      bindings.push(filters.tag);
    }

    const { fromUtc, toExclusiveUtc } = hktDateRange(filters.from, filters.to);
    const publicationTime = "COALESCE(p.published_at, p.scheduled_at)";
    if (fromUtc) {
      conditions.push(`${publicationTime} >= ?`);
      bindings.push(fromUtc);
    }
    if (toExclusiveUtc) {
      conditions.push(`${publicationTime} < ?`);
      bindings.push(toExclusiveUtc);
    }
    if (
      useRelevance &&
      filters.before &&
      filters.beforeId &&
      filters.beforeRank !== null
    ) {
      conditions.push(`(
        ${DISCOVERY_SEARCH_RANK} > ?
        OR (
          ${DISCOVERY_SEARCH_RANK} = ?
          AND ${publicationTime} < ?
        )
        OR (
          ${DISCOVERY_SEARCH_RANK} = ?
          AND ${publicationTime} = ?
          AND p.id < ?
        )
      )`);
      bindings.push(
        filters.beforeRank,
        filters.beforeRank,
        filters.before,
        filters.beforeRank,
        filters.before,
        filters.beforeId,
      );
    } else if (!useRelevance && filters.before && filters.beforeId) {
      conditions.push(`(
        ${publicationTime} < ?
        OR (${publicationTime} = ? AND p.id < ?)
      )`);
      bindings.push(filters.before, filters.before, filters.beforeId);
    }

    const relevanceOrder = useRelevance ? "search_rank ASC," : "";
    bindings.push(filters.limit + 1);
    const result = await this.database
      .prepare(
        `${useFts ? DISCOVERY_FTS_SELECT : DISCOVERY_POST_SELECT}
         WHERE ${conditions.join(" AND ")}
         ORDER BY ${relevanceOrder} ${publicationTime} DESC, p.id DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<PostRow>();

    const hasMore = result.results.length > filters.limit;
    const pageRows = hasMore
      ? result.results.slice(0, filters.limit)
      : result.results;
    const posts = pageRows.map(mapPost);
    const last = posts.at(-1);
    const lastRow = pageRows.at(-1);
    const before = last?.publishedAt ?? last?.scheduledAt ?? null;
    const rank =
      useRelevance &&
      typeof lastRow?.search_rank === "number" &&
      Number.isFinite(lastRow.search_rank)
        ? lastRow.search_rank
        : null;
    let nextCursor: DiscoveryPage["nextCursor"] = null;
    if (hasMore && last && before && (!useRelevance || rank !== null)) {
      nextCursor = {
        before,
        beforeId: last.id,
        ...(rank === null ? {} : { rank }),
      };
    }

    return {
      nextCursor,
      posts,
    };
  }

  async listPublicArchiveMonths(now: string): Promise<ArchiveMonth[]> {
    interface ArchiveMonthRow {
      article_count: number;
      month: string;
      note_count: number;
      total: number;
    }

    const result = await this.database
      .prepare(
        `SELECT
           strftime(
             '%Y-%m',
             COALESCE(p.published_at, p.scheduled_at),
             '+8 hours'
           ) AS month,
           COUNT(*) AS total,
           SUM(CASE WHEN p.kind = 'note' THEN 1 ELSE 0 END) AS note_count,
           SUM(CASE WHEN p.kind = 'article' THEN 1 ELSE 0 END) AS article_count
         FROM posts p
         WHERE ${PUBLIC_POST_STATE}
         GROUP BY month
         ORDER BY month DESC`,
      )
      .bind(now)
      .all<ArchiveMonthRow>();

    return result.results.map((row) => ({
      articleCount: row.article_count,
      month: row.month,
      noteCount: row.note_count,
      total: row.total,
    }));
  }

  async listPublicTaxonomy(now: string): Promise<PublicTaxonomy> {
    const [categories, tags] = await Promise.all([
      this.database
        .prepare(
          `SELECT c.name, c.slug, COUNT(DISTINCT p.id) AS count
           FROM categories c
           JOIN posts p ON p.category_id = c.id
           WHERE ${PUBLIC_POST_STATE}
           GROUP BY c.id
           ORDER BY c.name`,
        )
        .bind(now)
        .all<TaxonomyCountRow>(),
      this.database
        .prepare(
          `SELECT t.name, t.slug, COUNT(DISTINCT p.id) AS count
           FROM tags t
           JOIN post_tags pt ON pt.tag_id = t.id
           JOIN posts p ON p.id = pt.post_id
           WHERE ${PUBLIC_POST_STATE}
           GROUP BY t.id
           ORDER BY t.name`,
        )
        .bind(now)
        .all<TaxonomyCountRow>(),
    ]);

    return {
      categories: categories.results.map(mapTaxonomyCount),
      tags: tags.results.map(mapTaxonomyCount),
    };
  }

  async findPublicTaxonomyTerm(
    kind: "category" | "tag",
    slug: string,
    now: string,
  ): Promise<TaxonomyCount | null> {
    const query =
      kind === "category"
        ? `SELECT c.name, c.slug, COUNT(DISTINCT p.id) AS count
           FROM categories c
           JOIN posts p ON p.category_id = c.id
           WHERE c.slug = ? AND ${PUBLIC_POST_STATE}
           GROUP BY c.id, c.name, c.slug
           LIMIT 1`
        : `SELECT t.name, t.slug, COUNT(DISTINCT p.id) AS count
           FROM tags t
           JOIN post_tags pt ON pt.tag_id = t.id
           JOIN posts p ON p.id = pt.post_id
           WHERE t.slug = ? AND ${PUBLIC_POST_STATE}
           GROUP BY t.id, t.name, t.slug
           LIMIT 1`;
    const row = await this.database
      .prepare(query)
      .bind(slug, now)
      .first<TaxonomyCountRow>();
    return row ? mapTaxonomyCount(row) : null;
  }

  async listPublicFeedPosts(
    kind: DiscoveryKind,
    now: string,
    limit = 50,
  ): Promise<PostRecord[]> {
    const bindings: (number | string)[] = [now];
    const conditions = [PUBLIC_POST_STATE];
    if (kind !== "all") {
      conditions.push("p.kind = ?");
      bindings.push(kind);
    }
    bindings.push(Math.min(Math.max(Math.trunc(limit), 1), 1000));

    const result = await this.database
      .prepare(
        `${DISCOVERY_POST_SELECT}
         WHERE ${conditions.join(" AND ")}
         ORDER BY COALESCE(p.published_at, p.scheduled_at) DESC, p.id DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<PostRow>();
    return result.results.map(mapPost);
  }

  async findOwnerPost(id: string): Promise<PostRecord | null> {
    const post = await this.findCanonicalPost(id);
    if (!post) return null;
    const working = await this.database
      .prepare("SELECT * FROM post_working_copies WHERE post_id = ? LIMIT 1")
      .bind(id)
      .first<PostWorkingCopyRow>();
    return working ? mergeWorkingCopy(post, working) : post;
  }

  private async findCanonicalPost(id: string): Promise<PostRecord | null> {
    const row = await this.database
      .prepare(
        `${POST_SELECT}
         WHERE p.id = ?
         GROUP BY p.id
         LIMIT 1`,
      )
      .bind(id)
      .first<PostRow>();
    return row ? mapPost(row) : null;
  }

  async savePost(data: SavePostData): Promise<PostRecord> {
    const { category, persistence, post, snapshotPrevious, tags } = data;
    if (persistence === "working-copy") {
      await this.database
        .prepare(
          `INSERT INTO post_working_copies (
             post_id, title, slug, excerpt, body_md, body_html, visibility,
             category_json, hero_media_id, tags_json, scheduled_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(post_id) DO UPDATE SET
             title = excluded.title,
             slug = excluded.slug,
             excerpt = excluded.excerpt,
             body_md = excluded.body_md,
             body_html = excluded.body_html,
             visibility = excluded.visibility,
             category_json = excluded.category_json,
             hero_media_id = excluded.hero_media_id,
             tags_json = excluded.tags_json,
             scheduled_at = excluded.scheduled_at,
             updated_at = excluded.updated_at`,
        )
        .bind(
          post.id,
          post.title,
          post.slug,
          post.excerpt,
          post.bodyMd,
          post.bodyHtml,
          post.visibility,
          category ? JSON.stringify(category) : null,
          post.heroMediaId,
          JSON.stringify(tags),
          post.scheduledAt,
          post.updatedAt,
        )
        .run();
      const savedWorkingCopy = await this.findOwnerPost(post.id);
      if (!savedWorkingCopy) {
        throw new Error("儲存後無法重新讀取工作副本。");
      }
      return savedWorkingCopy;
    }

    const resolvedCategory = category
      ? await this.resolveTerm("categories", category)
      : null;
    const resolvedTags = await Promise.all(
      tags.map((tag) => this.resolveTerm("tags", tag)),
    );
    const previous = snapshotPrevious
      ? await this.findCanonicalPost(post.id)
      : null;
    const statements: D1PreparedStatement[] = [
      this.database
        .prepare(
          `INSERT INTO authors (
             id, handle, display_name, kind, created_at, updated_at
           ) VALUES ('owner', 'owner', 'Personal Space', 'owner', ?, ?)
           ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
        )
        .bind(post.createdAt, post.updatedAt),
    ];

    if (previous) {
      statements.push(
        this.database
          .prepare(
            `INSERT INTO post_revisions (
               id, post_id, title, slug, excerpt, body_md, visibility,
               category_id, hero_media_id, tags_json, created_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            previous.id,
            previous.title,
            previous.slug,
            previous.excerpt,
            previous.bodyMd,
            previous.visibility,
            previous.category?.id ?? null,
            previous.heroMediaId,
            JSON.stringify(previous.tags),
            post.updatedAt,
          ),
      );
    }

    if (resolvedCategory) {
      statements.push(
        this.database
          .prepare(
            `INSERT INTO categories (id, slug, name, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(slug) DO UPDATE SET
               name = excluded.name,
               updated_at = excluded.updated_at`,
          )
          .bind(
            resolvedCategory.id,
            resolvedCategory.slug,
            resolvedCategory.name,
            post.updatedAt,
            post.updatedAt,
          ),
      );
    }

    for (const tag of resolvedTags) {
      statements.push(
        this.database
          .prepare(
            `INSERT INTO tags (id, slug, name, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(slug) DO UPDATE SET
               name = excluded.name,
               updated_at = excluded.updated_at`,
          )
          .bind(tag.id, tag.slug, tag.name, post.updatedAt, post.updatedAt),
      );
    }

    statements.push(
      this.database
        .prepare(
          `INSERT INTO posts (
             id, kind, author_id, category_id, hero_media_id, title, slug,
             excerpt, body_md, body_html, status, visibility, pinned,
             scheduled_at, published_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             category_id = excluded.category_id,
             hero_media_id = excluded.hero_media_id,
             title = excluded.title,
             slug = excluded.slug,
             excerpt = excluded.excerpt,
             body_md = excluded.body_md,
             body_html = excluded.body_html,
             status = excluded.status,
             visibility = excluded.visibility,
             pinned = excluded.pinned,
             scheduled_at = excluded.scheduled_at,
             published_at = excluded.published_at,
             updated_at = excluded.updated_at`,
        )
        .bind(
          post.id,
          post.kind,
          post.authorId,
          resolvedCategory?.id ?? null,
          post.heroMediaId,
          post.title,
          post.slug,
          post.excerpt,
          post.bodyMd,
          post.bodyHtml,
          post.status,
          post.visibility,
          post.pinned ? 1 : 0,
          post.scheduledAt,
          post.publishedAt,
          post.createdAt,
          post.updatedAt,
        ),
      this.database
        .prepare("DELETE FROM post_tags WHERE post_id = ?")
        .bind(post.id),
      this.database
        .prepare("DELETE FROM post_working_copies WHERE post_id = ?")
        .bind(post.id),
    );

    for (const tag of resolvedTags) {
      statements.push(
        this.database
          .prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)")
          .bind(post.id, tag.id),
      );
    }

    await this.database.batch(statements);
    const saved = await this.findOwnerPost(post.id);
    if (!saved) {
      throw new Error("儲存後無法重新讀取內容。");
    }
    return saved;
  }

  private async resolveTerm(
    table: "categories" | "tags",
    term: TaxonomyTerm,
  ): Promise<TaxonomyTerm> {
    const existing = await this.database
      .prepare(`SELECT id, name, slug FROM ${table} WHERE slug = ? LIMIT 1`)
      .bind(term.slug)
      .first<TaxonomyTerm>();
    return existing ?? term;
  }

  async listRevisionPage(
    postId: string,
    cursor: RevisionPageCursor | null,
    limit = 20,
  ): Promise<RevisionPage> {
    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 50);
    const bindings: (number | string)[] = [postId];
    if (cursor) {
      bindings.push(cursor.before, cursor.before, cursor.beforeId);
    }
    bindings.push(pageSize + 1);
    const result = await this.database
      .prepare(
        `SELECT * FROM post_revisions
         WHERE post_id = ?
         ${cursor ? "AND (created_at < ? OR (created_at = ? AND id < ?))" : ""}
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<RevisionRow>();
    const hasMore = result.results.length > pageSize;
    const pageRows = hasMore
      ? result.results.slice(0, pageSize)
      : result.results;
    const last = pageRows.at(-1);
    return {
      nextCursor:
        hasMore && last ? { before: last.created_at, beforeId: last.id } : null,
      revisions: pageRows.map(mapRevision),
    };
  }

  async findRevision(id: string): Promise<PostRevision | null> {
    const row = await this.database
      .prepare("SELECT * FROM post_revisions WHERE id = ? LIMIT 1")
      .bind(id)
      .first<RevisionRow>();
    return row ? mapRevision(row) : null;
  }

  async restoreRevision(
    post: PostRecord,
    revision: PostRevision,
    bodyHtml: string,
    now: string,
    asWorkingCopy: boolean,
  ): Promise<PostRecord> {
    if (asWorkingCopy) {
      const category = revision.categoryId
        ? await this.database
            .prepare(
              "SELECT id, name, slug FROM categories WHERE id = ? LIMIT 1",
            )
            .bind(revision.categoryId)
            .first<TaxonomyTerm>()
        : null;
      await this.database
        .prepare(
          `INSERT INTO post_working_copies (
             post_id, title, slug, excerpt, body_md, body_html, visibility,
             category_json, hero_media_id, tags_json, scheduled_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(post_id) DO UPDATE SET
             title = excluded.title,
             slug = excluded.slug,
             excerpt = excluded.excerpt,
             body_md = excluded.body_md,
             body_html = excluded.body_html,
             visibility = excluded.visibility,
             category_json = excluded.category_json,
             hero_media_id = excluded.hero_media_id,
             tags_json = excluded.tags_json,
             scheduled_at = excluded.scheduled_at,
             updated_at = excluded.updated_at`,
        )
        .bind(
          post.id,
          revision.title,
          revision.slug,
          revision.excerpt,
          revision.bodyMd,
          bodyHtml,
          revision.visibility,
          category ? JSON.stringify(category) : null,
          revision.heroMediaId,
          JSON.stringify(revision.tags),
          post.scheduledAt,
          now,
        )
        .run();
      const restoredWorkingCopy = await this.findOwnerPost(post.id);
      if (!restoredWorkingCopy) {
        throw new Error("還原後無法重新讀取工作副本。");
      }
      return restoredWorkingCopy;
    }

    await this.database.batch([
      this.database
        .prepare(
          `INSERT INTO post_revisions (
             id, post_id, title, slug, excerpt, body_md, visibility,
             category_id, hero_media_id, tags_json, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          post.id,
          post.title,
          post.slug,
          post.excerpt,
          post.bodyMd,
          post.visibility,
          post.category?.id ?? null,
          post.heroMediaId,
          JSON.stringify(post.tags),
          now,
        ),
      this.database
        .prepare(
          `UPDATE posts SET
             title = ?, slug = ?, excerpt = ?, body_md = ?, body_html = ?,
             visibility = ?, category_id = ?, hero_media_id = ?, status = 'draft',
             scheduled_at = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          revision.title,
          revision.slug,
          revision.excerpt,
          revision.bodyMd,
          bodyHtml,
          revision.visibility,
          revision.categoryId,
          revision.heroMediaId,
          now,
          post.id,
        ),
      this.database
        .prepare("DELETE FROM post_tags WHERE post_id = ?")
        .bind(post.id),
      this.database
        .prepare("DELETE FROM post_working_copies WHERE post_id = ?")
        .bind(post.id),
      ...revision.tags.map((tag) =>
        this.database
          .prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)")
          .bind(post.id, tag.id),
      ),
    ]);
    const restored = await this.findOwnerPost(post.id);
    if (!restored) {
      throw new Error("還原後無法重新讀取內容。");
    }
    return restored;
  }

  async createMedia(media: MediaRecord): Promise<void> {
    await this.database
      .prepare(
        `INSERT INTO media (
           id, object_key, mime_type, byte_size, width, height, alt_text,
           visibility, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        media.id,
        media.objectKey,
        media.mimeType,
        media.byteSize,
        media.width,
        media.height,
        media.altText,
        media.visibility,
        media.createdAt,
        media.updatedAt,
      )
      .run();
  }

  async findMedia(id: string, owner = false): Promise<MediaRecord | null> {
    const row = await this.database
      .prepare(
        `SELECT * FROM media
         WHERE id = ? ${owner ? "" : "AND visibility = 'public'"}
         LIMIT 1`,
      )
      .bind(id)
      .first<MediaRow>();
    return row ? mapMedia(row) : null;
  }

  async findPublicMedia(id: string, now: string): Promise<MediaRecord | null> {
    const row = await this.database
      .prepare(
        `SELECT DISTINCT m.*
         FROM media m
         JOIN posts p ON p.hero_media_id = m.id
         WHERE m.id = ?
           AND m.visibility = 'public'
           AND p.visibility IN ('public', 'unlisted')
           AND (
             p.status = 'published'
             OR (
               p.status = 'scheduled'
               AND p.scheduled_at IS NOT NULL
               AND p.scheduled_at <= ?
             )
           )
         LIMIT 1`,
      )
      .bind(id, now)
      .first<MediaRow>();
    return row ? mapMedia(row) : null;
  }
}
