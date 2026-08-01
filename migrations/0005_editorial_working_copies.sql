CREATE TABLE post_working_copies (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'unlisted', 'private')),
  category_json TEXT,
  hero_media_id TEXT REFERENCES media(id),
  tags_json TEXT NOT NULL DEFAULT '[]',
  scheduled_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE edition_working_copies (
  edition_id TEXT PRIMARY KEY REFERENCES editions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  intro_md TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE edition_working_items (
  edition_id TEXT NOT NULL REFERENCES edition_working_copies(edition_id)
    ON DELETE CASCADE,
  cluster_id TEXT NOT NULL REFERENCES story_clusters(id),
  source_item_id TEXT NOT NULL REFERENCES source_items(id),
  position INTEGER NOT NULL CHECK (position >= 0),
  annotation TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (edition_id, cluster_id),
  UNIQUE(edition_id, position)
);

ALTER TABLE post_revisions ADD COLUMN hero_media_id TEXT;

CREATE INDEX idx_post_working_copies_updated
  ON post_working_copies(updated_at DESC);
CREATE INDEX idx_edition_working_copies_updated
  ON edition_working_copies(updated_at DESC);
CREATE INDEX idx_edition_working_items_order
  ON edition_working_items(edition_id, position);
