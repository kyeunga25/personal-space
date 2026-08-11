ALTER TABLE edition_items ADD COLUMN source_name_snapshot TEXT;
ALTER TABLE edition_items ADD COLUMN source_site_url_snapshot TEXT;
ALTER TABLE edition_items ADD COLUMN source_terms_url_snapshot TEXT;
ALTER TABLE edition_items ADD COLUMN source_rights_basis_snapshot TEXT;
ALTER TABLE edition_items ADD COLUMN source_reviewed_at_snapshot TEXT;

CREATE INDEX idx_posts_public_media
  ON posts(hero_media_id, status, visibility, scheduled_at);

UPDATE edition_items
SET
  source_name_snapshot = (
    SELECT s.name
    FROM source_items si
    JOIN sources s ON s.id = si.source_id
    WHERE si.id = edition_items.source_item_id
  ),
  source_site_url_snapshot = (
    SELECT s.site_url
    FROM source_items si
    JOIN sources s ON s.id = si.source_id
    WHERE si.id = edition_items.source_item_id
  ),
  source_terms_url_snapshot = (
    SELECT s.terms_url
    FROM source_items si
    JOIN sources s ON s.id = si.source_id
    WHERE si.id = edition_items.source_item_id
  ),
  source_rights_basis_snapshot = (
    SELECT s.rights_basis
    FROM source_items si
    JOIN sources s ON s.id = si.source_id
    WHERE si.id = edition_items.source_item_id
  ),
  source_reviewed_at_snapshot = (
    SELECT s.reviewed_at
    FROM source_items si
    JOIN sources s ON s.id = si.source_id
    WHERE si.id = edition_items.source_item_id
  );

CREATE TRIGGER edition_items_require_rights_snapshot_on_insert
BEFORE INSERT ON edition_items
WHEN EXISTS (
  SELECT 1 FROM editions
  WHERE id = NEW.edition_id AND status = 'published'
) AND (
  NOT EXISTS (
    SELECT 1
    FROM source_items si
    JOIN sources s ON s.id = si.source_id
    WHERE si.id = NEW.source_item_id
      AND s.review_status = 'approved'
      AND s.terms_url IS NOT NULL
      AND length(trim(s.terms_url)) > 0
      AND s.rights_basis IS NOT NULL
      AND length(trim(s.rights_basis)) > 0
      AND s.reviewed_at IS NOT NULL
  )
  OR NEW.source_name_snapshot IS NULL
  OR length(trim(NEW.source_name_snapshot)) = 0
  OR NEW.source_terms_url_snapshot IS NULL
  OR length(trim(NEW.source_terms_url_snapshot)) = 0
  OR NEW.source_rights_basis_snapshot IS NULL
  OR length(trim(NEW.source_rights_basis_snapshot)) = 0
  OR NEW.source_reviewed_at_snapshot IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'published edition item requires rights snapshot');
END;

CREATE TRIGGER editions_require_current_rights_before_publish
BEFORE UPDATE OF status ON editions
WHEN NEW.status = 'published' AND (
  NOT EXISTS (
    SELECT 1 FROM edition_items WHERE edition_id = NEW.id
  )
  OR EXISTS (
    SELECT 1
    FROM edition_items ei
    WHERE ei.edition_id = NEW.id
      AND (
        NOT EXISTS (
          SELECT 1
          FROM source_items si
          JOIN sources s ON s.id = si.source_id
          WHERE si.id = ei.source_item_id
            AND s.review_status = 'approved'
            AND s.terms_url IS NOT NULL
            AND length(trim(s.terms_url)) > 0
            AND s.rights_basis IS NOT NULL
            AND length(trim(s.rights_basis)) > 0
            AND s.reviewed_at IS NOT NULL
        )
        OR ei.source_name_snapshot IS NULL
        OR length(trim(ei.source_name_snapshot)) = 0
        OR ei.source_terms_url_snapshot IS NULL
        OR length(trim(ei.source_terms_url_snapshot)) = 0
        OR ei.source_rights_basis_snapshot IS NULL
        OR length(trim(ei.source_rights_basis_snapshot)) = 0
        OR ei.source_reviewed_at_snapshot IS NULL
      )
  )
)
BEGIN
  SELECT RAISE(ABORT, 'published edition requires current source rights');
END;

CREATE TRIGGER editions_must_start_unpublished
BEFORE INSERT ON editions
WHEN NEW.status = 'published'
BEGIN
  SELECT RAISE(ABORT, 'edition must be reviewed before publication');
END;
