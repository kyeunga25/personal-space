export type SourceStatus = "enabled" | "paused";
export type EditionStatus = "archived" | "draft" | "published";

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
  siteUrl: string | null;
  status: SourceStatus;
  updatedAt: string;
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
  id: string;
  introMd: string;
  publishedAt: string | null;
  status: EditionStatus;
  title: string;
  updatedAt: string;
}

export interface EditionSaveInput {
  action: "archive" | "publish" | "save";
  annotations: Record<string, string>;
  includedItemIds: string[];
  introMd: string;
  title: string;
}

export interface IngestionReport {
  failedSources: number;
  fetchedSources: number;
  newItems: number;
  notModifiedSources: number;
}
