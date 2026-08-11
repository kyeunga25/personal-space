export type SourceStatus = "enabled" | "paused";
export type SourceReviewStatus = "approved" | "pending" | "rejected";
export type EditionStatus = "archived" | "draft" | "published";
export type AutomationJob = "edition_generation" | "source_ingestion";
export type AutomationRunStatus =
  "failed" | "partial" | "running" | "skipped" | "succeeded";
export type AutomationTrigger = "cron" | "manual";

export interface SourceRecord {
  createdAt: string;
  etag: string | null;
  failureCount: number;
  feedUrl: string;
  id: string;
  lastErrorCode: string | null;
  lastFetchedAt: string | null;
  lastModified: string | null;
  lastSuccessAt: string | null;
  name: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  reviewStatus: SourceReviewStatus;
  rightsBasis: string | null;
  siteUrl: string | null;
  status: SourceStatus;
  termsUrl: string | null;
  updatedAt: string;
}

export interface AutomationRunRecord {
  attemptCount: number;
  completedAt: string | null;
  errorCode: string | null;
  id: string;
  job: AutomationJob;
  scheduledAt: string;
  startedAt: string;
  status: AutomationRunStatus;
  summary: Record<string, number>;
  trigger: AutomationTrigger;
}

export interface AutomationRunClaim {
  attemptCount: number;
  claimToken: string;
  claimed: boolean;
  id: string;
  status: AutomationRunStatus;
}

export interface FeedEntry {
  externalId: string;
  publishedAt: string | null;
  summary: string | null;
  title: string;
  url: string;
}

export interface StoryClusterCandidate {
  id: string;
  normalizedTitle: string;
  representativeTitle: string;
}

export interface IngestedEntry extends FeedEntry {
  clusterId: string;
  contentHash: string;
  id: string;
  normalizedTitle: string;
}

export interface EditionEntry {
  annotation: string;
  clusterId: string;
  itemId: string;
  position: number;
  publishedAt: string | null;
  sourceName: string;
  sourceSiteUrl: string | null;
  summary: string | null;
  title: string;
  url: string;
}

export interface EditionRecord {
  createdAt: string;
  date: string;
  entries: EditionEntry[];
  hasWorkingCopy: boolean;
  id: string;
  introMd: string;
  publishedAt: string | null;
  status: EditionStatus;
  title: string;
  updatedAt: string;
}

export interface EditionPage {
  editions: EditionRecord[];
  nextCursor: string | null;
}

export interface EditionSaveInput {
  action: "archive" | "publish" | "save";
  annotations: Record<string, string>;
  includedItemIds: string[];
  introMd: string;
  title: string;
}

export interface IngestionReport {
  attemptedSources: number;
  failedSources: number;
  fetchedSources: number;
  newItems: number;
  notModifiedSources: number;
}
