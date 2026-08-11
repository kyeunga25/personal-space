import type {
  AutomationRunStatus,
  AutomationTrigger,
  EditionRecord,
  FeedEntry,
  IngestedEntry,
  IngestionReport,
  StoryClusterCandidate,
} from "./domain";
import { FeedFetchError, fetchFeedDocument } from "./feed-fetcher";
import { parseSyndicationFeed } from "./feed-parser";
import { sha256Hex } from "./hashing";
import { D1EditionRepository } from "./repository";
import { normalizeStoryTitle, storyTitleSimilarity } from "./similarity";

export const MAX_SOURCES_PER_RUN = 2;
export const MAX_ITEMS_PER_SOURCE = 5;
const CLUSTER_THRESHOLD = 0.6;
const RUN_LEASE_MS = 14 * 60 * 1000;

type CompletedRunStatus = Exclude<AutomationRunStatus, "running">;

export interface AutomationExecution<T> {
  attemptCount: number;
  duplicate: boolean;
  report: T | null;
  runId: string;
  status: CompletedRunStatus;
}

export interface AutomationRunOptions {
  now?: Date;
  scheduledAt?: Date;
  trigger?: AutomationTrigger;
}

export type EditionAutomationRepository = Pick<
  D1EditionRepository,
  | "claimAutomationRun"
  | "completeAutomationRun"
  | "findExistingItems"
  | "generateDailyEdition"
  | "listEnabledSources"
  | "listRecentClusters"
  | "markSourceFailure"
  | "markSourceNotModified"
  | "saveIngestedEntries"
>;

function hongKongDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
  }).format(date);
}

function errorCode(error: unknown): string {
  if (error instanceof FeedFetchError) return error.code;
  return "invalid_feed";
}

function bestCluster(
  title: string,
  clusters: StoryClusterCandidate[],
): StoryClusterCandidate | null {
  let best: StoryClusterCandidate | null = null;
  let bestScore = 0;
  for (const cluster of clusters) {
    const score = storyTitleSimilarity(title, cluster.representativeTitle);
    if (score > bestScore) {
      best = cluster;
      bestScore = score;
    }
  }
  return bestScore >= CLUSTER_THRESHOLD ? best : null;
}

async function prepareEntry(
  sourceId: string,
  entry: FeedEntry,
  clusters: StoryClusterCandidate[],
): Promise<IngestedEntry> {
  const normalizedTitle = normalizeStoryTitle(entry.title);
  const matched = bestCluster(entry.title, clusters);
  const clusterId =
    matched?.id ?? (await sha256Hex(`cluster\n${normalizedTitle}`));
  if (!matched) {
    clusters.push({
      id: clusterId,
      normalizedTitle,
      representativeTitle: entry.title,
    });
  }
  return {
    ...entry,
    clusterId,
    contentHash: await sha256Hex(
      `${entry.title}\n${entry.summary ?? ""}\n${entry.url}`,
    ),
    id: await sha256Hex(`${sourceId}\n${entry.externalId}`),
    normalizedTitle,
  };
}

function completedStatus(status: AutomationRunStatus): CompletedRunStatus {
  return status === "running" ? "skipped" : status;
}

export class EditionAutomationService {
  constructor(
    private readonly repository: EditionAutomationRepository,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async runIngestion(
    options: AutomationRunOptions = {},
  ): Promise<AutomationExecution<IngestionReport>> {
    const now = options.now ?? new Date();
    const scheduledAt = options.scheduledAt ?? now;
    const trigger = options.trigger ?? "manual";
    const claim = await this.repository.claimAutomationRun(
      "source_ingestion",
      trigger,
      scheduledAt.toISOString(),
      now.toISOString(),
      new Date(now.getTime() + RUN_LEASE_MS).toISOString(),
    );
    if (!claim.claimed) {
      return {
        attemptCount: claim.attemptCount,
        duplicate: true,
        report: null,
        runId: claim.id,
        status: completedStatus(claim.status),
      };
    }

    try {
      const report = await this.ingestSources(now);
      const successfulSources =
        report.fetchedSources + report.notModifiedSources;
      const status: CompletedRunStatus =
        report.attemptedSources === 0
          ? "skipped"
          : successfulSources === 0
            ? "failed"
            : report.failedSources > 0
              ? "partial"
              : "succeeded";
      await this.repository.completeAutomationRun(
        claim,
        status,
        {
          attemptedSources: report.attemptedSources,
          failedSources: report.failedSources,
          fetchedSources: report.fetchedSources,
          newItems: report.newItems,
          notModifiedSources: report.notModifiedSources,
        },
        new Date().toISOString(),
        status === "failed" ? "all_sources_failed" : null,
      );
      return {
        attemptCount: claim.attemptCount,
        duplicate: false,
        report,
        runId: claim.id,
        status,
      };
    } catch (error) {
      await this.repository.completeAutomationRun(
        claim,
        "failed",
        {},
        new Date().toISOString(),
        "ingestion_error",
      );
      throw error;
    }
  }

  async runEditionGeneration(
    options: AutomationRunOptions = {},
  ): Promise<AutomationExecution<EditionRecord>> {
    const now = options.now ?? new Date();
    const scheduledAt = options.scheduledAt ?? now;
    const trigger = options.trigger ?? "manual";
    const claim = await this.repository.claimAutomationRun(
      "edition_generation",
      trigger,
      scheduledAt.toISOString(),
      now.toISOString(),
      new Date(now.getTime() + RUN_LEASE_MS).toISOString(),
    );
    if (!claim.claimed) {
      return {
        attemptCount: claim.attemptCount,
        duplicate: true,
        report: null,
        runId: claim.id,
        status: completedStatus(claim.status),
      };
    }

    try {
      const edition = await this.generateDailyEdition(now);
      await this.repository.completeAutomationRun(
        claim,
        "succeeded",
        { editionItems: edition.entries.length },
        new Date().toISOString(),
      );
      return {
        attemptCount: claim.attemptCount,
        duplicate: false,
        report: edition,
        runId: claim.id,
        status: "succeeded",
      };
    } catch (error) {
      await this.repository.completeAutomationRun(
        claim,
        "failed",
        {},
        new Date().toISOString(),
        "edition_generation_error",
      );
      throw error;
    }
  }

  private async ingestSources(now: Date): Promise<IngestionReport> {
    const nowIso = now.toISOString();
    const clusters = await this.repository.listRecentClusters(
      new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    );
    const sources =
      await this.repository.listEnabledSources(MAX_SOURCES_PER_RUN);
    const report: IngestionReport = {
      attemptedSources: sources.length,
      failedSources: 0,
      fetchedSources: 0,
      newItems: 0,
      notModifiedSources: 0,
    };

    for (const source of sources) {
      let fetched: Awaited<ReturnType<typeof fetchFeedDocument>>;
      try {
        fetched = await fetchFeedDocument(source, this.fetcher);
      } catch (error) {
        await this.repository.markSourceFailure(
          source.id,
          errorCode(error),
          nowIso,
        );
        report.failedSources += 1;
        continue;
      }

      if (fetched.notModified) {
        await this.repository.markSourceNotModified(source.id, nowIso);
        report.notModifiedSources += 1;
        continue;
      }

      let parsed: FeedEntry[];
      try {
        parsed = parseSyndicationFeed(
          fetched.body ?? "",
          fetched.finalUrl,
          MAX_ITEMS_PER_SOURCE,
        );
      } catch (error) {
        await this.repository.markSourceFailure(
          source.id,
          errorCode(error),
          nowIso,
        );
        report.failedSources += 1;
        continue;
      }

      const prepared: IngestedEntry[] = [];
      for (const entry of parsed) {
        prepared.push(await prepareEntry(source.id, entry, clusters));
      }
      const existing = await this.repository.findExistingItems(
        source.id,
        prepared.map((entry) => entry.id),
        prepared.map((entry) => entry.url),
      );
      const newEntries = prepared.filter(
        (entry) => !existing.ids.has(entry.id) && !existing.urls.has(entry.url),
      );
      report.newItems += await this.repository.saveIngestedEntries(
        source.id,
        newEntries,
        { etag: fetched.etag, lastModified: fetched.lastModified },
        nowIso,
      );
      report.fetchedSources += 1;
    }
    return report;
  }

  private async generateDailyEdition(now: Date): Promise<EditionRecord> {
    return this.repository.generateDailyEdition(
      hongKongDateKey(now),
      new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      now.toISOString(),
    );
  }
}
