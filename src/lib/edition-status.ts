import type {
  AutomationJob,
  AutomationRunStatus,
  AutomationTrigger,
  SourceReviewStatus,
  SourceStatus,
} from "../server/editions/domain";

const SOURCE_STATUS_LABELS = {
  enabled: "啟用 Enabled",
  paused: "暫停 Paused",
} satisfies Record<SourceStatus, string>;

const SOURCE_REVIEW_STATUS_LABELS = {
  approved: "已核准 Approved",
  pending: "待審核 Pending",
  rejected: "不採用 Rejected",
} satisfies Record<SourceReviewStatus, string>;

const AUTOMATION_RUN_STATUS_LABELS = {
  failed: "失敗 Failed",
  partial: "部分完成 Partially completed",
  running: "執行中 Running",
  skipped: "已略過 Skipped",
  succeeded: "已完成 Succeeded",
} satisfies Record<AutomationRunStatus, string>;

const AUTOMATION_TRIGGER_LABELS = {
  cron: "排程 Scheduled",
  manual: "手動 Manual",
} satisfies Record<AutomationTrigger, string>;

const AUTOMATION_JOB_LABELS = {
  edition_generation: "Edition 產生 Edition generation",
  source_ingestion: "來源同步 Source ingestion",
} satisfies Record<AutomationJob, string>;

const SOURCE_ERROR_LABELS: Readonly<Record<string, string>> = {
  feed_too_large: "Feed 超出大小上限。 Feed exceeded the size limit.",
  invalid_feed: "Feed 格式無法讀取。 Feed format could not be read.",
  network_error: "無法連接來源。 Could not connect to the source.",
  redirect_error: "來源重新導向無效。 Source redirect was invalid.",
};

const AUTOMATION_ERROR_LABELS: Readonly<Record<string, string>> = {
  all_sources_failed:
    "所有已啟用來源均同步失敗。 All enabled sources failed to sync.",
  edition_generation_error:
    "Edition 產生程序未能完成。 Edition generation could not complete.",
  ingestion_error: "同步程序未能完成。 Source sync could not complete.",
};

const AUTOMATION_SUMMARY_METRICS = [
  ["attemptedSources", "嘗試來源 Attempted sources"],
  ["fetchedSources", "已讀取來源 Fetched sources"],
  ["notModifiedSources", "未變更來源 Unchanged sources"],
  ["failedSources", "失敗來源 Failed sources"],
  ["newItems", "新增項目 New items"],
  ["editionItems", "Edition 項目 Edition items"],
] as const;

const AUTOMATION_SUMMARY_KEYS = new Set<string>(
  AUTOMATION_SUMMARY_METRICS.map(([key]) => key),
);

function formatKnownLabel<T extends string>(
  labels: Readonly<Record<T, string>>,
  value: string,
  fallback: string,
): string {
  return Object.hasOwn(labels, value) ? labels[value as T] : fallback;
}

export function formatSourceStatus(status: SourceStatus): string {
  return formatKnownLabel(
    SOURCE_STATUS_LABELS,
    status,
    "未識別來源狀態 Unknown source status",
  );
}

export function formatSourceReviewStatus(status: SourceReviewStatus): string {
  return formatKnownLabel(
    SOURCE_REVIEW_STATUS_LABELS,
    status,
    "未識別審核狀態 Unknown review status",
  );
}

export function formatAutomationRunStatus(status: AutomationRunStatus): string {
  return formatKnownLabel(
    AUTOMATION_RUN_STATUS_LABELS,
    status,
    "未識別執行狀態 Unknown run status",
  );
}

export function formatAutomationTrigger(trigger: AutomationTrigger): string {
  return formatKnownLabel(
    AUTOMATION_TRIGGER_LABELS,
    trigger,
    "未識別觸發方式 Unknown trigger",
  );
}

export function formatAutomationJob(job: AutomationJob): string {
  return formatKnownLabel(AUTOMATION_JOB_LABELS, job, "未識別工作 Unknown job");
}

export function formatSourceError(code: string): string {
  const knownLabel = SOURCE_ERROR_LABELS[code];
  if (knownLabel) return knownLabel;

  const httpStatus = /^http_(\d{3})$/u.exec(code)?.[1];
  if (httpStatus) {
    return `來源伺服器回應 HTTP ${httpStatus}。 Source server returned HTTP ${httpStatus}.`;
  }
  return "未能分類的來源錯誤。 Unclassified source error.";
}

export function formatAutomationError(code: string): string {
  return (
    AUTOMATION_ERROR_LABELS[code] ??
    "未能分類的執行錯誤。 Unclassified run error."
  );
}

export function formatAutomationRunSummary(
  summary: Readonly<Record<string, number>>,
): string {
  const parts: string[] = [];
  for (const [key, label] of AUTOMATION_SUMMARY_METRICS) {
    const value = summary[key];
    if (value === undefined || !Number.isFinite(value)) continue;
    parts.push(`${label}：${String(value)}`);
  }

  const unknownMetricCount = Object.keys(summary).filter(
    (key) => !AUTOMATION_SUMMARY_KEYS.has(key),
  ).length;
  if (unknownMetricCount > 0) {
    parts.push(`其他項目 Other metrics：${String(unknownMetricCount)}`);
  }
  return parts.join(" · ");
}
