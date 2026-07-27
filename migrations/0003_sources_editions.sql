CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  site_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('enabled', 'paused')),
  etag TEXT,
  last_modified TEXT,
  last_fetched_at TEXT,
  last_success_at TEXT,
  last_error_code TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE story_clusters (
  id TEXT PRIMARY KEY,
  representative_title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 1 CHECK (item_count > 0)
);

CREATE TABLE source_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  cluster_id TEXT NOT NULL REFERENCES story_clusters(id),
  external_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TEXT,
  discovered_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'unread'
    CHECK (state IN ('unread', 'included', 'dismissed')),
  UNIQUE(source_id, external_id),
  UNIQUE(source_id, canonical_url)
);

CREATE TABLE editions (
  id TEXT PRIMARY KEY,
  edition_date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  intro_md TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE edition_items (
  edition_id TEXT NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL REFERENCES story_clusters(id),
  source_item_id TEXT NOT NULL REFERENCES source_items(id),
  position INTEGER NOT NULL CHECK (position >= 0),
  annotation TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (edition_id, cluster_id),
  UNIQUE(edition_id, position)
);

CREATE INDEX idx_sources_status_updated
  ON sources(status, updated_at DESC);
CREATE INDEX idx_story_clusters_recent
  ON story_clusters(last_seen_at DESC);
CREATE INDEX idx_source_items_recent
  ON source_items(state, discovered_at DESC);
CREATE INDEX idx_source_items_cluster
  ON source_items(cluster_id, published_at DESC);
CREATE INDEX idx_editions_public
  ON editions(status, edition_date DESC);
CREATE INDEX idx_edition_items_order
  ON edition_items(edition_id, position);
