PRAGMA foreign_keys = ON;

CREATE TABLE authors (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('owner', 'system')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE media (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  alt_text TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('note', 'article')),
  author_id TEXT NOT NULL REFERENCES authors(id),
  category_id TEXT REFERENCES categories(id),
  hero_media_id TEXT REFERENCES media(id),
  title TEXT,
  slug TEXT UNIQUE,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'unlisted', 'private')),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  scheduled_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (kind != 'article' OR status = 'draft' OR title IS NOT NULL),
  CHECK (status NOT IN ('published', 'scheduled') OR slug IS NOT NULL),
  CHECK (status != 'scheduled' OR scheduled_at IS NOT NULL)
);

CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE post_revisions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  body_md TEXT NOT NULL,
  visibility TEXT NOT NULL,
  category_id TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_posts_public_list
  ON posts(kind, status, visibility, published_at DESC);
CREATE INDEX idx_posts_scheduled
  ON posts(status, scheduled_at);
CREATE INDEX idx_posts_owner_updated
  ON posts(updated_at DESC);
CREATE INDEX idx_post_revisions_post
  ON post_revisions(post_id, created_at DESC);
