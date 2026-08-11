CREATE INDEX idx_automation_runs_timeline
  ON automation_runs(scheduled_at DESC, created_at DESC, id DESC);
