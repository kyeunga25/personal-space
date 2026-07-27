import type {
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

const MAX_SOURCES_PER_RUN = 12;
const MAX_ITEMS_PER_SOURCE = 10;
const CLUSTER_THRESHOLD = 0.6;

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

export class EditionAutomationService {
  constructor(
    private readonly repository: D1EditionRepository,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async ingest(now = new Date()): Promise<IngestionReport> {
    const nowIso = now.toISOString();
    const clusters = await this.repository.listRecentClusters(
      new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    );
    const sources =
      await this.repository.listEnabledSources(MAX_SOURCES_PER_RUN);
    const report: IngestionReport = {
      failedSources: 0,
      fetchedSources: 0,
      newItems: 0,
      notModifiedSources: 0,
    };

    for (const source of sources) {
      try {
        const fetched = await fetchFeedDocument(source, this.fetcher);
        if (fetched.notModified) {
          await this.repository.markSourceNotModified(source.id, nowIso);
          report.notModifiedSources += 1;
          continue;
        }
        const parsed = parseSyndicationFeed(
          fetched.body ?? "",
          fetched.finalUrl,
        ).slice(0, MAX_ITEMS_PER_SOURCE);
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
          (entry) =>
            !existing.ids.has(entry.id) && !existing.urls.has(entry.url),
        );
        report.newItems += await this.repository.saveIngestedEntries(
          source.id,
          newEntries,
          { etag: fetched.etag, lastModified: fetched.lastModified },
          nowIso,
        );
        report.fetchedSources += 1;
      } catch (error) {
        await this.repository.markSourceFailure(
          source.id,
          errorCode(error),
          nowIso,
        );
        report.failedSources += 1;
      }
    }
    return report;
  }

  async generateDailyEdition(now = new Date()): Promise<EditionRecord> {
    return this.repository.generateDailyEdition(
      hongKongDateKey(now),
      new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      now.toISOString(),
    );
  }
}
