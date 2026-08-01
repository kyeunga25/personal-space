CREATE TRIGGER posts_require_media_visibility_on_insert
BEFORE INSERT ON posts
WHEN NEW.hero_media_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM media
  WHERE id = NEW.hero_media_id
    AND visibility = CASE
      WHEN NEW.visibility = 'private' THEN 'private'
      ELSE 'public'
    END
)
BEGIN
  SELECT RAISE(ABORT, 'post and hero media visibility must match');
END;

CREATE TRIGGER posts_require_media_visibility_on_update
BEFORE UPDATE OF hero_media_id, visibility ON posts
WHEN NEW.hero_media_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM media
  WHERE id = NEW.hero_media_id
    AND visibility = CASE
      WHEN NEW.visibility = 'private' THEN 'private'
      ELSE 'public'
    END
)
BEGIN
  SELECT RAISE(ABORT, 'post and hero media visibility must match');
END;

CREATE TRIGGER post_working_copies_require_media_visibility_on_insert
BEFORE INSERT ON post_working_copies
WHEN NEW.hero_media_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM media
  WHERE id = NEW.hero_media_id
    AND visibility = CASE
      WHEN NEW.visibility = 'private' THEN 'private'
      ELSE 'public'
    END
)
BEGIN
  SELECT RAISE(ABORT, 'working copy and hero media visibility must match');
END;

CREATE TRIGGER post_working_copies_require_media_visibility_on_update
BEFORE UPDATE OF hero_media_id, visibility ON post_working_copies
WHEN NEW.hero_media_id IS NOT NULL AND NOT EXISTS (
  SELECT 1
  FROM media
  WHERE id = NEW.hero_media_id
    AND visibility = CASE
      WHEN NEW.visibility = 'private' THEN 'private'
      ELSE 'public'
    END
)
BEGIN
  SELECT RAISE(ABORT, 'working copy and hero media visibility must match');
END;

CREATE TRIGGER media_prevent_visibility_drift
BEFORE UPDATE OF visibility ON media
WHEN EXISTS (
  SELECT 1
  FROM posts
  WHERE hero_media_id = NEW.id
    AND NEW.visibility != CASE
      WHEN visibility = 'private' THEN 'private'
      ELSE 'public'
    END
  UNION ALL
  SELECT 1
  FROM post_working_copies
  WHERE hero_media_id = NEW.id
    AND NEW.visibility != CASE
      WHEN visibility = 'private' THEN 'private'
      ELSE 'public'
    END
)
BEGIN
  SELECT RAISE(ABORT, 'linked media visibility cannot drift');
END;
