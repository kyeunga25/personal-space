CREATE VIRTUAL TABLE posts_fts USING fts5(
  title,
  excerpt,
  body_md,
  content = 'posts',
  content_rowid = 'rowid',
  tokenize = 'trigram'
);

CREATE TRIGGER posts_fts_after_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, title, excerpt, body_md)
  VALUES (new.rowid, new.title, new.excerpt, new.body_md);
END;

CREATE TRIGGER posts_fts_after_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, body_md)
  VALUES ('delete', old.rowid, old.title, old.excerpt, old.body_md);
END;

CREATE TRIGGER posts_fts_after_update AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, excerpt, body_md)
  VALUES ('delete', old.rowid, old.title, old.excerpt, old.body_md);
  INSERT INTO posts_fts(rowid, title, excerpt, body_md)
  VALUES (new.rowid, new.title, new.excerpt, new.body_md);
END;

INSERT INTO posts_fts(posts_fts) VALUES ('rebuild');

CREATE INDEX idx_posts_public_archive
  ON posts(status, visibility, published_at DESC, kind);

CREATE INDEX idx_post_tags_tag_post
  ON post_tags(tag_id, post_id);
