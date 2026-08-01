ALTER TABLE sources ADD COLUMN review_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (review_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE sources ADD COLUMN terms_url TEXT;
ALTER TABLE sources ADD COLUMN rights_basis TEXT;
ALTER TABLE sources ADD COLUMN review_notes TEXT;
ALTER TABLE sources ADD COLUMN reviewed_at TEXT;

-- Existing sources must be reviewed under the new policy before automation
-- can fetch them again. No source is implicitly grandfathered in.
UPDATE sources
SET status = 'paused', review_status = 'pending', reviewed_at = NULL;

CREATE TRIGGER sources_require_rights_on_insert
BEFORE INSERT ON sources
WHEN NEW.status = 'enabled' AND (
  NEW.review_status != 'approved'
  OR NEW.terms_url IS NULL
  OR length(trim(NEW.terms_url)) = 0
  OR NEW.rights_basis IS NULL
  OR length(trim(NEW.rights_basis)) = 0
  OR NEW.reviewed_at IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'enabled source requires approved rights review');
END;

CREATE TRIGGER sources_require_rights_on_update
BEFORE UPDATE ON sources
WHEN NEW.status = 'enabled' AND (
  NEW.review_status != 'approved'
  OR NEW.terms_url IS NULL
  OR length(trim(NEW.terms_url)) = 0
  OR NEW.rights_basis IS NULL
  OR length(trim(NEW.rights_basis)) = 0
  OR NEW.reviewed_at IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'enabled source requires approved rights review');
END;

CREATE TABLE automation_runs (
  id TEXT PRIMARY KEY,
  run_key TEXT NOT NULL UNIQUE,
  job TEXT NOT NULL CHECK (job IN ('source_ingestion', 'edition_generation')),
  trigger_kind TEXT NOT NULL CHECK (trigger_kind IN ('cron', 'manual')),
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('running', 'succeeded', 'partial', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  claim_token TEXT,
  lease_expires_at TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  summary_json TEXT NOT NULL DEFAULT '{}',
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_sources_review_status
  ON sources(review_status, status, updated_at DESC);
CREATE INDEX idx_automation_runs_recent
  ON automation_runs(job, scheduled_at DESC);
CREATE INDEX idx_automation_runs_status
  ON automation_runs(status, lease_expires_at);
