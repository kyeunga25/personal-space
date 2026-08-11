export interface AutomationRunPageCursor {
  beforeCreated: string;
  beforeId: string;
  beforeScheduled: string;
}

function normalizeTimestamp(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeRunId(value: string | null): string | null {
  if (!value || value !== value.trim() || value.length > 100) return null;
  return value;
}

export function parseAutomationRunPageCursor(
  params: URLSearchParams,
): AutomationRunPageCursor | null {
  const beforeCreated = normalizeTimestamp(params.get("runBeforeCreated"));
  const beforeId = normalizeRunId(params.get("runBeforeId"));
  const beforeScheduled = normalizeTimestamp(params.get("runBeforeScheduled"));
  return beforeCreated && beforeId && beforeScheduled
    ? { beforeCreated, beforeId, beforeScheduled }
    : null;
}

export function automationRunPageHref(
  cursor: AutomationRunPageCursor,
): string | null {
  const beforeCreated = normalizeTimestamp(cursor.beforeCreated);
  const beforeId = normalizeRunId(cursor.beforeId);
  const beforeScheduled = normalizeTimestamp(cursor.beforeScheduled);
  if (!beforeCreated || !beforeId || !beforeScheduled) return null;
  const params = new URLSearchParams({
    runBeforeScheduled: beforeScheduled,
    runBeforeCreated: beforeCreated,
    runBeforeId: beforeId,
  });
  return `?${params.toString()}#run-list-heading`;
}
