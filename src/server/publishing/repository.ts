import type {
  MediaRecord,
  PostKind,
  PostRecord,
  PostRevision,
  SavePostData,
  TaxonomyTerm,
} from "./domain";

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
  slug: string | null;
  status: PostRecord["status"];
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
  id: string;
  post_id: string;
  slug: string | null;
  tags_json: string;
  title: string | null;
  visibility: PostRecord["visibility"];
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

export interface PublishingRepository {
  findOwnerPost(id: string): Promise<PostRecord | null>;
  findRevision(id: string): Promise<PostRevision | null>;
  restoreRevision(
    post: PostRecord,
    revision: PostRevision,
    bodyHtml: string,
    now: string,
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
    return result.results.map(mapPost);
  }

  async findOwnerPost(id: string): Promise<PostRecord | null> {
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
    const { category, post, snapshotPrevious, tags } = data;
    const resolvedCategory = category
      ? await this.resolveTerm("categories", category)
      : null;
    const resolvedTags = await Promise.all(
      tags.map((tag) => this.resolveTerm("tags", tag)),
    );
    const previous = snapshotPrevious
      ? await this.findOwnerPost(post.id)
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
               category_id, tags_json, created_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  async listRevisions(postId: string): Promise<PostRevision[]> {
    const result = await this.database
      .prepare(
        `SELECT * FROM post_revisions
         WHERE post_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
      )
      .bind(postId)
      .all<RevisionRow>();
    return result.results.map((row) => ({
      bodyMd: row.body_md,
      categoryId: row.category_id,
      createdAt: row.created_at,
      excerpt: row.excerpt,
      id: row.id,
      postId: row.post_id,
      slug: row.slug,
      tags: parseTags(row.tags_json),
      title: row.title,
      visibility: row.visibility,
    }));
  }

  async findRevision(id: string): Promise<PostRevision | null> {
    const row = await this.database
      .prepare("SELECT * FROM post_revisions WHERE id = ? LIMIT 1")
      .bind(id)
      .first<RevisionRow>();
    return row
      ? {
          bodyMd: row.body_md,
          categoryId: row.category_id,
          createdAt: row.created_at,
          excerpt: row.excerpt,
          id: row.id,
          postId: row.post_id,
          slug: row.slug,
          tags: parseTags(row.tags_json),
          title: row.title,
          visibility: row.visibility,
        }
      : null;
  }

  async restoreRevision(
    post: PostRecord,
    revision: PostRevision,
    bodyHtml: string,
    now: string,
  ): Promise<PostRecord> {
    await this.database.batch([
      this.database
        .prepare(
          `INSERT INTO post_revisions (
             id, post_id, title, slug, excerpt, body_md, visibility,
             category_id, tags_json, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          JSON.stringify(post.tags),
          now,
        ),
      this.database
        .prepare(
          `UPDATE posts SET
             title = ?, slug = ?, excerpt = ?, body_md = ?, body_html = ?,
             visibility = ?, category_id = ?, status = 'draft',
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
          now,
          post.id,
        ),
      this.database
        .prepare("DELETE FROM post_tags WHERE post_id = ?")
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
}
