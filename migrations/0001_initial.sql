PRAGMA foreign_keys = ON;

CREATE TABLE authors (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('owner', 'system')),
  bio TEXT,
  avatar_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  author_id TEXT NOT NULL REFERENCES authors(id),
  accent_token TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  editorial_config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE media (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('note', 'article', 'edition')),
  author_id TEXT NOT NULL REFERENCES authors(id),
  channel_id TEXT REFERENCES channels(id),
  title TEXT,
  slug TEXT UNIQUE,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  body_html TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived')),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'unlisted', 'private')),
  hero_media_id TEXT REFERENCES media(id),
  quoted_post_id TEXT REFERENCES posts(id),
  quoted_url TEXT,
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  coverage_start TEXT,
  coverage_end TEXT,
  scheduled_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (kind != 'article' OR title IS NOT NULL),
  CHECK (kind != 'edition' OR (title IS NOT NULL AND channel_id IS NOT NULL))
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
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

CREATE TABLE post_categories (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
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
  excerpt TEXT,
  body_md TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'atom', 'json_feed', 'api', 'manual', 'html')),
  url TEXT NOT NULL,
  feed_url TEXT,
  language TEXT,
  region TEXT,
  trust_level REAL NOT NULL DEFAULT 0.5,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 720,
  etag TEXT,
  last_modified TEXT,
  last_checked_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE source_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  external_id TEXT,
  canonical_url TEXT,
  original_title TEXT NOT NULL,
  original_author TEXT,
  original_published_at TEXT,
  fetched_at TEXT NOT NULL,
  language TEXT,
  excerpt TEXT,
  processing_text TEXT,
  raw_payload_json TEXT,
  content_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('new', 'processed', 'clustered', 'reviewed', 'ignored', 'error')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (source_id, external_id)
);

CREATE UNIQUE INDEX idx_source_items_canonical_url
  ON source_items(canonical_url)
  WHERE canonical_url IS NOT NULL;

CREATE TABLE story_clusters (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),
  normalized_title TEXT NOT NULL,
  summary_draft TEXT,
  importance_score REAL NOT NULL DEFAULT 0,
  novelty_score REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('open', 'reviewed', 'selected', 'ignored')),
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE cluster_items (
  cluster_id TEXT NOT NULL REFERENCES story_clusters(id) ON DELETE CASCADE,
  source_item_id TEXT NOT NULL REFERENCES source_items(id) ON DELETE CASCADE,
  PRIMARY KEY (cluster_id, source_item_id)
);

CREATE TABLE edition_items (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL REFERENCES story_clusters(id),
  position INTEGER NOT NULL,
  section TEXT NOT NULL DEFAULT 'main',
  editor_note TEXT,
  PRIMARY KEY (post_id, cluster_id)
);

CREATE TABLE ingestion_runs (
  id TEXT PRIMARY KEY,
  schedule_window TEXT NOT NULL CHECK (schedule_window IN ('asia', 'americas', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'success', 'partial', 'failed')),
  started_at TEXT,
  completed_at TEXT,
  metrics_json TEXT NOT NULL DEFAULT '{}',
  error_text TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE editorial_runs (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id),
  digest_type TEXT NOT NULL CHECK (digest_type IN ('daily', 'weekly', 'manual')),
  coverage_start TEXT NOT NULL,
  coverage_end TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'review', 'success', 'no_significant_updates', 'failed')),
  post_id TEXT REFERENCES posts(id),
  selected_count INTEGER NOT NULL DEFAULT 0,
  provider TEXT,
  model TEXT,
  prompt_version TEXT,
  started_at TEXT,
  completed_at TEXT,
  error_text TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (channel_id, digest_type, coverage_start, coverage_end)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_posts_public_stream
  ON posts(status, visibility, published_at DESC);
CREATE INDEX idx_posts_kind_published
  ON posts(kind, published_at DESC);
CREATE INDEX idx_posts_channel_published
  ON posts(channel_id, published_at DESC);
CREATE INDEX idx_posts_scheduled
  ON posts(status, scheduled_at);
CREATE INDEX idx_source_items_source_date
  ON source_items(source_id, original_published_at DESC);
CREATE INDEX idx_source_items_hash
  ON source_items(content_hash);
CREATE INDEX idx_clusters_channel_seen
  ON story_clusters(channel_id, last_seen_at DESC);
CREATE INDEX idx_clusters_status_score
  ON story_clusters(status, importance_score DESC);
CREATE INDEX idx_ingestion_runs_created
  ON ingestion_runs(created_at DESC);
CREATE INDEX idx_editorial_runs_channel_date
  ON editorial_runs(channel_id, coverage_start DESC);

CREATE VIRTUAL TABLE posts_fts USING fts5(
  title,
  excerpt,
  body_md,
  content='posts',
  content_rowid='rowid',
  tokenize='unicode61'
);

CREATE TRIGGER posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, title, excerpt, body_md)
  VALUES (new.rowid, coalesce(new.title, ''), coalesce(new.excerpt, ''), new.body_md);
END;

CREATE TRIGGER posts_ad AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, body_md)
  VALUES ('delete', old.rowid, coalesce(old.title, ''), coalesce(old.excerpt, ''), old.body_md);
END;

CREATE TRIGGER posts_au AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, body_md)
  VALUES ('delete', old.rowid, coalesce(old.title, ''), coalesce(old.excerpt, ''), old.body_md);
  INSERT INTO posts_fts(rowid, title, excerpt, body_md)
  VALUES (new.rowid, coalesce(new.title, ''), coalesce(new.excerpt, ''), new.body_md);
END;
