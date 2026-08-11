import { UserFacingError } from "../errors";
import type { AutomationRunPageCursor } from "./automation-run-pagination";
import type {
  AutomationJob,
  AutomationRunClaim,
  AutomationRunRecord,
  AutomationRunStatus,
  AutomationTrigger,
  EditionEntry,
  EditionPage,
  EditionRecord,
  EditionSaveInput,
  EditionStatus,
  IngestedEntry,
  SourceRecord,
  StoryClusterCandidate,
} from "./domain";
import type { SourceInput } from "./input";
import type { SourcePageCursor } from "./source-pagination";

const DUPLICATE_SOURCE_ERROR =
  "這個 feed 已經加入。 This feed has already been added.";
const EDITION_NOT_FOUND_ERROR =
  "找不到這份 Edition。 The requested Edition could not be found.";
const EDITION_STALE_ERROR =
  "Edition 內容已變更，請重新載入。 Edition content has changed; reload before saving.";
const EDITION_RIGHTS_ERROR =
  "來源權利狀態已變更，請重新核對後再發佈。 Source rights changed; review them before publishing.";
const SOURCE_NOT_FOUND_ERROR =
  "找不到這個來源。 The requested source could not be found.";

interface SourceRow {
  created_at: string;
  etag: string | null;
  failure_count: number;
  feed_url: string;
  id: string;
  last_error_code: string | null;
  last_fetched_at: string | null;
  last_modified: string | null;
  last_success_at: string | null;
  name: string;
  review_notes: string | null;
  review_status: SourceRecord["reviewStatus"];
  reviewed_at: string | null;
  rights_basis: string | null;
  site_url: string | null;
  status: SourceRecord["status"];
  terms_url: string | null;
  updated_at: string;
}

interface AutomationRunDisplayRow {
  attempt_count: number;
  completed_at: string | null;
  error_code: string | null;
  id: string;
  job: AutomationJob;
  scheduled_at: string;
  started_at: string;
  status: AutomationRunStatus;
  summary_json: string;
  trigger_kind: AutomationTrigger;
}

interface AutomationRunRow extends AutomationRunDisplayRow {
  claim_token: string | null;
}

interface AutomationRunPageRow extends AutomationRunDisplayRow {
  created_at: string;
}

interface ClusterRow {
  id: string;
  normalized_title: string;
  representative_title: string;
}

interface EditionRow {
  created_at: string;
  edition_date: string;
  id: string;
  intro_md: string;
  published_at: string | null;
  status: EditionStatus;
  title: string;
  updated_at: string;
}

interface EditionWorkingCopyRow {
  edition_id: string;
  intro_md: string;
  title: string;
  updated_at: string;
}

interface EditionEntryRow {
  annotation: string;
  cluster_id: string;
  item_id: string;
  position: number;
  published_at: string | null;
  site_url: string | null;
  source_name: string;
  summary: string | null;
  title: string;
  url: string;
}

interface EditionEntryWithParentRow extends EditionEntryRow {
  edition_id: string;
}

interface EditionCandidateRow {
  cluster_id: string;
  item_id: string;
}

interface EditionRightsSnapshotRow {
  item_id: string;
  reviewed_at: string;
  rights_basis: string;
  site_url: string | null;
  source_name: string;
  terms_url: string;
}

const PUBLIC_EDITION_RIGHTS_CLAUSE = `EXISTS (
  SELECT 1 FROM edition_items public_item
  WHERE public_item.edition_id = editions.id
)
AND NOT EXISTS (
  SELECT 1
  FROM edition_items rights_item
  WHERE rights_item.edition_id = editions.id
    AND (
      NOT EXISTS (
        SELECT 1
        FROM source_items rights_source_item
        JOIN sources rights_source
          ON rights_source.id = rights_source_item.source_id
        WHERE rights_source_item.id = rights_item.source_item_id
          AND rights_source.review_status = 'approved'
          AND rights_source.terms_url IS NOT NULL
          AND length(trim(rights_source.terms_url)) > 0
          AND rights_source.rights_basis IS NOT NULL
          AND length(trim(rights_source.rights_basis)) > 0
          AND rights_source.reviewed_at IS NOT NULL
      )
      OR rights_item.source_name_snapshot IS NULL
      OR length(trim(rights_item.source_name_snapshot)) = 0
      OR rights_item.source_terms_url_snapshot IS NULL
      OR length(trim(rights_item.source_terms_url_snapshot)) = 0
      OR rights_item.source_rights_basis_snapshot IS NULL
      OR length(trim(rights_item.source_rights_basis_snapshot)) = 0
      OR rights_item.source_reviewed_at_snapshot IS NULL
    )
)`;

function mapSource(row: SourceRow): SourceRecord {
  return {
    createdAt: row.created_at,
    etag: row.etag,
    failureCount: row.failure_count,
    feedUrl: row.feed_url,
    id: row.id,
    lastErrorCode: row.last_error_code,
    lastFetchedAt: row.last_fetched_at,
    lastModified: row.last_modified,
    lastSuccessAt: row.last_success_at,
    name: row.name,
    reviewNotes: row.review_notes,
    reviewedAt: row.reviewed_at,
    reviewStatus: row.review_status,
    rightsBasis: row.rights_basis,
    siteUrl: row.site_url,
    status: row.status,
    termsUrl: row.terms_url,
    updatedAt: row.updated_at,
  };
}

function mapAutomationRun(row: AutomationRunDisplayRow): AutomationRunRecord {
  let summary: Record<string, number> = {};
  try {
    const parsed: unknown = JSON.parse(row.summary_json);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      summary = Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === "number" && Number.isFinite(entry[1]),
        ),
      );
    }
  } catch {
    summary = {};
  }
  return {
    attemptCount: row.attempt_count,
    completedAt: row.completed_at,
    errorCode: row.error_code,
    id: row.id,
    job: row.job,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    status: row.status,
    summary,
    trigger: row.trigger_kind,
  };
}

function mapEditionEntry(row: EditionEntryRow): EditionEntry {
  return {
    annotation: row.annotation,
    clusterId: row.cluster_id,
    itemId: row.item_id,
    position: row.position,
    publishedAt: row.published_at,
    sourceName: row.source_name,
    sourceSiteUrl: row.site_url,
    summary: row.summary,
    title: row.title,
    url: row.url,
  };
}

export class D1EditionRepository {
  constructor(private readonly database: D1Database) {}

  async listSourcePage(
    cursor: SourcePageCursor | null,
    limit = 20,
  ): Promise<{
    nextCursor: SourcePageCursor | null;
    sources: SourceRecord[];
  }> {
    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 40);
    const bindings: (number | string)[] = [];
    if (cursor) {
      bindings.push(cursor.before, cursor.before, cursor.beforeId);
    }
    bindings.push(pageSize + 1);
    const result = await this.database
      .prepare(
        `SELECT * FROM sources
         ${cursor ? "WHERE created_at < ? OR (created_at = ? AND id < ?)" : ""}
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<SourceRow>();
    const hasMore = result.results.length > pageSize;
    const pageRows = hasMore
      ? result.results.slice(0, pageSize)
      : result.results;
    const last = pageRows.at(-1);

    return {
      nextCursor:
        hasMore && last ? { before: last.created_at, beforeId: last.id } : null,
      sources: pageRows.map(mapSource),
    };
  }

  async listEnabledSources(limit = 20): Promise<SourceRecord[]> {
    const result = await this.database
      .prepare(
        `SELECT * FROM sources
         WHERE status = 'enabled' AND review_status = 'approved'
         ORDER BY COALESCE(last_fetched_at, created_at), id
         LIMIT ?`,
      )
      .bind(Math.min(Math.max(Math.trunc(limit), 1), 20))
      .all<SourceRow>();
    return result.results.map(mapSource);
  }

  async findSource(id: string): Promise<SourceRecord | null> {
    const row = await this.database
      .prepare("SELECT * FROM sources WHERE id = ? LIMIT 1")
      .bind(id)
      .first<SourceRow>();
    return row ? mapSource(row) : null;
  }

  async findSourceByFeedUrl(feedUrl: string): Promise<SourceRecord | null> {
    const row = await this.database
      .prepare("SELECT * FROM sources WHERE feed_url = ? LIMIT 1")
      .bind(feedUrl)
      .first<SourceRow>();
    return row ? mapSource(row) : null;
  }

  async createSource(input: SourceInput, now: string): Promise<SourceRecord> {
    if (await this.findSourceByFeedUrl(input.feedUrl)) {
      throw new UserFacingError(DUPLICATE_SOURCE_ERROR, 409);
    }
    const id = crypto.randomUUID();
    await this.database
      .prepare(
        `INSERT INTO sources (
           id, name, feed_url, site_url, status, review_status, terms_url,
           rights_basis, review_notes, reviewed_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.name,
        input.feedUrl,
        input.siteUrl,
        input.status,
        input.reviewStatus,
        input.termsUrl,
        input.rightsBasis,
        input.reviewNotes,
        input.reviewStatus === "approved" ? now : null,
        now,
        now,
      )
      .run();
    const source = await this.findSource(id);
    if (!source) throw new Error("Source insert could not be read back");
    return source;
  }

  async updateSource(
    id: string,
    input: SourceInput,
    now: string,
  ): Promise<SourceRecord> {
    const current = await this.findSource(id);
    if (!current) throw new UserFacingError(SOURCE_NOT_FOUND_ERROR, 404);
    const duplicate = await this.findSourceByFeedUrl(input.feedUrl);
    if (duplicate && duplicate.id !== id) {
      throw new UserFacingError(DUPLICATE_SOURCE_ERROR, 409);
    }
    await this.database
      .prepare(
        `UPDATE sources
         SET name = ?, feed_url = ?, site_url = ?, status = ?,
             review_status = ?, terms_url = ?, rights_basis = ?,
             review_notes = ?, reviewed_at = ?, etag = NULL,
             last_modified = NULL, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.name,
        input.feedUrl,
        input.siteUrl,
        input.status,
        input.reviewStatus,
        input.termsUrl,
        input.rightsBasis,
        input.reviewNotes,
        input.reviewStatus === "approved" ? now : null,
        now,
        id,
      )
      .run();
    const source = await this.findSource(id);
    if (!source) throw new Error("Source update could not be read back");
    return source;
  }

  async claimAutomationRun(
    job: AutomationJob,
    trigger: AutomationTrigger,
    scheduledAt: string,
    now: string,
    leaseExpiresAt: string,
  ): Promise<AutomationRunClaim> {
    const id = crypto.randomUUID();
    const claimToken = crypto.randomUUID();
    const runKey =
      trigger === "cron"
        ? `${job}:${scheduledAt}`
        : `${job}:manual:${crypto.randomUUID()}`;
    await this.database
      .prepare(
        `INSERT OR IGNORE INTO automation_runs (
           id, run_key, job, trigger_kind, scheduled_at, status,
           attempt_count, claim_token, lease_expires_at, started_at,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 'running', 1, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        runKey,
        job,
        trigger,
        scheduledAt,
        claimToken,
        leaseExpiresAt,
        now,
        now,
        now,
      )
      .run();
    await this.database
      .prepare(
        `UPDATE automation_runs
         SET status = 'running', attempt_count = attempt_count + 1,
             claim_token = ?, lease_expires_at = ?, started_at = ?,
             completed_at = NULL, error_code = NULL, updated_at = ?
         WHERE run_key = ? AND claim_token != ?
           AND (status = 'failed' OR (
             status = 'running' AND lease_expires_at < ?
           ))`,
      )
      .bind(claimToken, leaseExpiresAt, now, now, runKey, claimToken, now)
      .run();
    const row = await this.database
      .prepare(
        `SELECT id, attempt_count, claim_token, completed_at, error_code,
                job, scheduled_at, started_at, status, summary_json,
                trigger_kind
         FROM automation_runs WHERE run_key = ? LIMIT 1`,
      )
      .bind(runKey)
      .first<AutomationRunRow>();
    if (!row) throw new Error("Automation run claim could not be read back");
    return {
      attemptCount: row.attempt_count,
      claimed: row.claim_token === claimToken && row.status === "running",
      claimToken,
      id: row.id,
      status: row.status,
    };
  }

  async completeAutomationRun(
    claim: AutomationRunClaim,
    status: Exclude<AutomationRunStatus, "running">,
    summary: Record<string, number>,
    now: string,
    errorCode: string | null = null,
  ): Promise<void> {
    await this.database
      .prepare(
        `UPDATE automation_runs
         SET status = ?, completed_at = ?, summary_json = ?, error_code = ?,
             lease_expires_at = NULL, updated_at = ?
         WHERE id = ? AND claim_token = ? AND status = 'running'`,
      )
      .bind(
        status,
        now,
        JSON.stringify(summary),
        errorCode?.slice(0, 80) ?? null,
        now,
        claim.id,
        claim.claimToken,
      )
      .run();
  }

  async listAutomationRunPage(
    cursor: AutomationRunPageCursor | null,
    limit = 12,
  ): Promise<{
    nextCursor: AutomationRunPageCursor | null;
    runs: AutomationRunRecord[];
  }> {
    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 50);
    const bindings: (number | string)[] = [];
    if (cursor) {
      bindings.push(
        cursor.beforeScheduled,
        cursor.beforeScheduled,
        cursor.beforeCreated,
        cursor.beforeScheduled,
        cursor.beforeCreated,
        cursor.beforeId,
      );
    }
    bindings.push(pageSize + 1);
    const result = await this.database
      .prepare(
        `SELECT id, attempt_count, completed_at, error_code, job,
                scheduled_at, started_at, status, summary_json, trigger_kind,
                created_at
         FROM automation_runs
         ${
           cursor
             ? `WHERE scheduled_at < ?
                OR (scheduled_at = ? AND created_at < ?)
                OR (scheduled_at = ? AND created_at = ? AND id < ?)`
             : ""
         }
         ORDER BY scheduled_at DESC, created_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<AutomationRunPageRow>();
    const hasMore = result.results.length > pageSize;
    const pageRows = hasMore
      ? result.results.slice(0, pageSize)
      : result.results;
    const last = pageRows.at(-1);

    return {
      nextCursor:
        hasMore && last
          ? {
              beforeCreated: last.created_at,
              beforeId: last.id,
              beforeScheduled: last.scheduled_at,
            }
          : null,
      runs: pageRows.map(mapAutomationRun),
    };
  }

  async listRecentClusters(
    since: string,
    limit = 250,
  ): Promise<StoryClusterCandidate[]> {
    const result = await this.database
      .prepare(
        `SELECT id, representative_title, normalized_title
         FROM story_clusters
         WHERE last_seen_at >= ?
         ORDER BY last_seen_at DESC
         LIMIT ?`,
      )
      .bind(since, Math.min(Math.max(Math.trunc(limit), 1), 500))
      .all<ClusterRow>();
    return result.results.map((row) => ({
      id: row.id,
      normalizedTitle: row.normalized_title,
      representativeTitle: row.representative_title,
    }));
  }

  async findExistingItems(
    sourceId: string,
    ids: string[],
    urls: string[],
  ): Promise<{ ids: Set<string>; urls: Set<string> }> {
    if (ids.length === 0) return { ids: new Set(), urls: new Set() };
    const idPlaceholders = ids.map(() => "?").join(", ");
    const urlPlaceholders = urls.map(() => "?").join(", ");
    const result = await this.database
      .prepare(
        `SELECT id, canonical_url
         FROM source_items
         WHERE source_id = ?
           AND (id IN (${idPlaceholders}) OR canonical_url IN (${urlPlaceholders}))`,
      )
      .bind(sourceId, ...ids, ...urls)
      .all<{ canonical_url: string; id: string }>();
    return {
      ids: new Set(result.results.map((row) => row.id)),
      urls: new Set(result.results.map((row) => row.canonical_url)),
    };
  }

  async saveIngestedEntries(
    sourceId: string,
    entries: IngestedEntry[],
    metadata: { etag: string | null; lastModified: string | null },
    now: string,
  ): Promise<number> {
    const statements: D1PreparedStatement[] = [];
    for (const entry of entries) {
      statements.push(
        this.database
          .prepare(
            `INSERT INTO story_clusters (
               id, representative_title, normalized_title, first_seen_at,
               last_seen_at, item_count
             ) VALUES (?, ?, ?, ?, ?, 1)
             ON CONFLICT(id) DO UPDATE SET
               last_seen_at = excluded.last_seen_at,
               item_count = story_clusters.item_count + 1`,
          )
          .bind(entry.clusterId, entry.title, entry.normalizedTitle, now, now),
        this.database
          .prepare(
            `INSERT INTO source_items (
               id, source_id, cluster_id, external_id, canonical_url, title,
               summary, published_at, discovered_at, content_hash
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            entry.id,
            sourceId,
            entry.clusterId,
            entry.externalId,
            entry.url,
            entry.title,
            entry.summary,
            entry.publishedAt,
            now,
            entry.contentHash,
          ),
      );
    }
    statements.push(
      this.database
        .prepare(
          `UPDATE sources SET
             etag = ?, last_modified = ?, last_fetched_at = ?,
             last_success_at = ?, last_error_code = NULL, failure_count = 0,
             updated_at = ?
           WHERE id = ?`,
        )
        .bind(metadata.etag, metadata.lastModified, now, now, now, sourceId),
    );
    await this.database.batch(statements);
    return entries.length;
  }

  async markSourceNotModified(sourceId: string, now: string): Promise<void> {
    await this.database
      .prepare(
        `UPDATE sources SET
           last_fetched_at = ?, last_success_at = ?, last_error_code = NULL,
           failure_count = 0, updated_at = ?
         WHERE id = ?`,
      )
      .bind(now, now, now, sourceId)
      .run();
  }

  async markSourceFailure(
    sourceId: string,
    errorCode: string,
    now: string,
  ): Promise<void> {
    await this.database
      .prepare(
        `UPDATE sources SET
           last_fetched_at = ?, last_error_code = ?,
           failure_count = failure_count + 1, updated_at = ?
         WHERE id = ?`,
      )
      .bind(now, errorCode.slice(0, 80), now, sourceId)
      .run();
  }

  async generateDailyEdition(
    date: string,
    since: string,
    now: string,
    limit = 12,
  ): Promise<EditionRecord> {
    const id = `edition-${date}`;
    await this.database
      .prepare(
        `INSERT OR IGNORE INTO editions (
           id, edition_date, title, intro_md, status, created_at, updated_at
         ) VALUES (?, ?, ?, '', 'draft', ?, ?)`,
      )
      .bind(id, date, `${date} 每日整理 Daily Edition`, now, now)
      .run();

    const existing = await this.findOwnerEdition(id);
    if (!existing) throw new Error("Edition draft could not be created");
    if (existing.status !== "draft" || existing.entries.length > 0) {
      return existing;
    }

    const candidates = await this.database
      .prepare(
        `SELECT cluster_id, id AS item_id
         FROM (
           SELECT
             si.cluster_id,
             si.id,
             COALESCE(si.published_at, si.discovered_at) AS sort_time,
             ROW_NUMBER() OVER (
               PARTITION BY si.cluster_id
               ORDER BY COALESCE(si.published_at, si.discovered_at) DESC, si.id
             ) AS item_rank
           FROM source_items si
           WHERE si.state = 'unread'
             AND si.discovered_at >= ?
             AND NOT EXISTS (
               SELECT 1 FROM edition_items ei WHERE ei.cluster_id = si.cluster_id
             )
         )
         WHERE item_rank = 1
         ORDER BY sort_time DESC, item_id
         LIMIT ?`,
      )
      .bind(since, Math.min(Math.max(Math.trunc(limit), 1), 20))
      .all<EditionCandidateRow>();

    const statements: D1PreparedStatement[] = [];
    candidates.results.forEach((candidate, position) => {
      statements.push(
        this.database
          .prepare(
            `INSERT INTO edition_items (
               edition_id, cluster_id, source_item_id, position, annotation
             ) VALUES (?, ?, ?, ?, '')`,
          )
          .bind(id, candidate.cluster_id, candidate.item_id, position),
        this.database
          .prepare("UPDATE source_items SET state = 'included' WHERE id = ?")
          .bind(candidate.item_id),
      );
    });
    if (statements.length > 0) await this.database.batch(statements);
    const edition = await this.findOwnerEdition(id);
    if (!edition) throw new Error("Edition draft could not be read back");
    return edition;
  }

  async listOwnerEditions(limit = 30): Promise<EditionRecord[]> {
    return (await this.listOwnerEditionPage(null, limit)).editions;
  }

  async listOwnerEditionPage(
    before: string | null,
    limit = 30,
  ): Promise<EditionPage> {
    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 40);
    const bindings: (number | string)[] = [];
    if (before) bindings.push(before);
    bindings.push(pageSize + 1);
    const result = await this.database
      .prepare(
        `SELECT * FROM editions
         ${before ? "WHERE edition_date < ?" : ""}
         ORDER BY edition_date DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<EditionRow>();
    const hasMore = result.results.length > pageSize;
    const pageRows = hasMore
      ? result.results.slice(0, pageSize)
      : result.results;
    const editions = await this.mapEditions(pageRows, true);

    return {
      editions,
      nextCursor: hasMore ? (pageRows.at(-1)?.edition_date ?? null) : null,
    };
  }

  async listPublicEditions(limit = 30): Promise<EditionRecord[]> {
    const result = await this.database
      .prepare(
        `SELECT * FROM editions
         WHERE status = 'published'
           AND ${PUBLIC_EDITION_RIGHTS_CLAUSE}
         ORDER BY edition_date DESC
         LIMIT ?`,
      )
      .bind(Math.min(Math.max(Math.trunc(limit), 1), 100))
      .all<EditionRow>();
    return this.mapEditions(result.results);
  }

  async listPublicEditionPage(
    before: string | null,
    limit = 30,
  ): Promise<EditionPage> {
    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const bindings: (number | string)[] = [];
    if (before) bindings.push(before);
    bindings.push(pageSize + 1);
    const result = await this.database
      .prepare(
        `SELECT * FROM editions
         WHERE status = 'published'
           AND ${PUBLIC_EDITION_RIGHTS_CLAUSE}
         ${before ? "AND edition_date < ?" : ""}
         ORDER BY edition_date DESC
         LIMIT ?`,
      )
      .bind(...bindings)
      .all<EditionRow>();
    const hasMore = result.results.length > pageSize;
    const pageRows = hasMore
      ? result.results.slice(0, pageSize)
      : result.results;
    const editions = await this.mapEditions(pageRows);

    return {
      editions,
      nextCursor: hasMore ? (pageRows.at(-1)?.edition_date ?? null) : null,
    };
  }

  async findOwnerEdition(id: string): Promise<EditionRecord | null> {
    const row = await this.database
      .prepare("SELECT * FROM editions WHERE id = ? LIMIT 1")
      .bind(id)
      .first<EditionRow>();
    if (!row) return null;
    return (await this.mapEditions([row], true))[0] ?? null;
  }

  private async findCanonicalEdition(
    id: string,
  ): Promise<EditionRecord | null> {
    const row = await this.database
      .prepare("SELECT * FROM editions WHERE id = ? LIMIT 1")
      .bind(id)
      .first<EditionRow>();
    if (!row) return null;
    return (await this.mapEditions([row]))[0] ?? null;
  }

  async findPublicEditionByDate(date: string): Promise<EditionRecord | null> {
    const row = await this.database
      .prepare(
        `SELECT * FROM editions
         WHERE edition_date = ? AND status = 'published'
           AND ${PUBLIC_EDITION_RIGHTS_CLAUSE}
         LIMIT 1`,
      )
      .bind(date)
      .first<EditionRow>();
    if (!row) return null;
    return (await this.mapEditions([row]))[0] ?? null;
  }

  async saveEdition(
    id: string,
    input: EditionSaveInput,
    now: string,
  ): Promise<EditionRecord> {
    const current = await this.findOwnerEdition(id);
    if (!current) throw new UserFacingError(EDITION_NOT_FOUND_ERROR, 404);
    const canonical = await this.findCanonicalEdition(id);
    if (!canonical) throw new UserFacingError(EDITION_NOT_FOUND_ERROR, 404);
    const entryById = new Map(
      current.entries.map((entry) => [entry.itemId, entry]),
    );
    const selected = input.includedItemIds.map((itemId) =>
      entryById.get(itemId),
    );
    if (selected.some((entry) => !entry)) {
      throw new UserFacingError(EDITION_STALE_ERROR, 409);
    }
    const rightsSnapshots =
      input.action === "publish"
        ? await this.findApprovedRightsSnapshots(input.includedItemIds)
        : [];
    const rightsByItemId = new Map(
      rightsSnapshots.map((snapshot) => [snapshot.item_id, snapshot]),
    );
    if (
      input.action === "publish" &&
      (input.includedItemIds.length === 0 ||
        rightsByItemId.size !== new Set(input.includedItemIds).size)
    ) {
      throw new UserFacingError(EDITION_RIGHTS_ERROR, 409);
    }
    if (input.action === "save" && canonical.status === "published") {
      const statements: D1PreparedStatement[] = [
        this.database
          .prepare(
            `INSERT INTO edition_working_copies (
               edition_id, title, intro_md, updated_at
             ) VALUES (?, ?, ?, ?)
             ON CONFLICT(edition_id) DO UPDATE SET
               title = excluded.title,
               intro_md = excluded.intro_md,
               updated_at = excluded.updated_at`,
          )
          .bind(id, input.title, input.introMd, now),
        this.database
          .prepare("DELETE FROM edition_working_items WHERE edition_id = ?")
          .bind(id),
      ];
      selected.forEach((entry, position) => {
        if (!entry) return;
        statements.push(
          this.database
            .prepare(
              `INSERT INTO edition_working_items (
                 edition_id, cluster_id, source_item_id, position, annotation
               ) VALUES (?, ?, ?, ?, ?)`,
            )
            .bind(
              id,
              entry.clusterId,
              entry.itemId,
              position,
              input.annotations[entry.itemId] ?? "",
            ),
        );
      });
      await this.database.batch(statements);
      const workingCopy = await this.findOwnerEdition(id);
      if (!workingCopy) {
        throw new Error("Edition working copy could not be read back");
      }
      return workingCopy;
    }
    const status: EditionStatus =
      input.action === "publish"
        ? "published"
        : input.action === "archive"
          ? "archived"
          : canonical.status;
    const publishedAt =
      status === "published"
        ? (canonical.publishedAt ?? now)
        : canonical.publishedAt;
    const statements: D1PreparedStatement[] = [];
    if (input.action === "archive" && canonical.status === "published") {
      statements.push(
        this.database
          .prepare(
            "UPDATE editions SET status = 'archived', updated_at = ? WHERE id = ?",
          )
          .bind(now, id),
      );
    }
    statements.push(
      this.database
        .prepare("DELETE FROM edition_items WHERE edition_id = ?")
        .bind(id),
      this.database
        .prepare("DELETE FROM edition_working_copies WHERE edition_id = ?")
        .bind(id),
    );
    for (const entry of canonical.entries) {
      statements.push(
        this.database
          .prepare("UPDATE source_items SET state = 'unread' WHERE id = ?")
          .bind(entry.itemId),
      );
    }
    selected.forEach((entry, position) => {
      if (!entry) return;
      const rights = rightsByItemId.get(entry.itemId);
      if (input.action === "publish" && !rights) return;
      statements.push(
        this.database
          .prepare(
            input.action === "publish"
              ? `INSERT INTO edition_items (
                   edition_id, cluster_id, source_item_id, position, annotation,
                   source_name_snapshot, source_site_url_snapshot,
                   source_terms_url_snapshot, source_rights_basis_snapshot,
                   source_reviewed_at_snapshot
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
              : `INSERT INTO edition_items (
                   edition_id, cluster_id, source_item_id, position, annotation
                 ) VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            entry.clusterId,
            entry.itemId,
            position,
            input.annotations[entry.itemId] ?? "",
            ...(rights
              ? [
                  rights.source_name,
                  rights.site_url,
                  rights.terms_url,
                  rights.rights_basis,
                  rights.reviewed_at,
                ]
              : []),
          ),
        this.database
          .prepare("UPDATE source_items SET state = 'included' WHERE id = ?")
          .bind(entry.itemId),
      );
    });
    statements.push(
      this.database
        .prepare(
          `UPDATE editions SET
             title = ?, intro_md = ?, status = ?, published_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(input.title, input.introMd, status, publishedAt, now, id),
    );
    await this.database.batch(statements);
    const edition = await this.findOwnerEdition(id);
    if (!edition) throw new Error("Edition update could not be read back");
    return edition;
  }

  private async mapEditions(
    rows: EditionRow[],
    owner = false,
  ): Promise<EditionRecord[]> {
    if (rows.length === 0) return [];
    const placeholders = rows.map(() => "?").join(", ");
    const entries = await this.database
      .prepare(
        `SELECT
           ei.edition_id,
           ei.annotation,
           ei.cluster_id,
           ei.source_item_id AS item_id,
           ei.position,
           si.published_at,
           si.summary,
           si.title,
           si.canonical_url AS url,
           CASE
             WHEN ei.source_name_snapshot IS NOT NULL
               THEN ei.source_name_snapshot
             ELSE s.name
           END AS source_name,
           CASE
             WHEN ei.source_name_snapshot IS NOT NULL
               THEN ei.source_site_url_snapshot
             ELSE s.site_url
           END AS site_url
         FROM edition_items ei
         JOIN source_items si ON si.id = ei.source_item_id
         JOIN sources s ON s.id = si.source_id
         WHERE ei.edition_id IN (${placeholders})
         ORDER BY ei.edition_id, ei.position`,
      )
      .bind(...rows.map((row) => row.id))
      .all<EditionEntryWithParentRow>();
    const entriesByEdition = new Map<string, EditionEntry[]>();
    for (const entry of entries.results) {
      const editionEntries = entriesByEdition.get(entry.edition_id) ?? [];
      editionEntries.push(mapEditionEntry(entry));
      entriesByEdition.set(entry.edition_id, editionEntries);
    }
    const workingByEdition = new Map<string, EditionWorkingCopyRow>();
    const workingEntriesByEdition = new Map<string, EditionEntry[]>();
    if (owner) {
      const workingCopies = await this.database
        .prepare(
          `SELECT edition_id, title, intro_md, updated_at
           FROM edition_working_copies
           WHERE edition_id IN (${placeholders})`,
        )
        .bind(...rows.map((row) => row.id))
        .all<EditionWorkingCopyRow>();
      for (const working of workingCopies.results) {
        workingByEdition.set(working.edition_id, working);
      }
      if (workingCopies.results.length > 0) {
        const workingPlaceholders = workingCopies.results
          .map(() => "?")
          .join(", ");
        const workingEntries = await this.database
          .prepare(
            `SELECT
               ewi.edition_id,
               ewi.annotation,
               ewi.cluster_id,
               ewi.source_item_id AS item_id,
               ewi.position,
               si.published_at,
               si.summary,
               si.title,
               si.canonical_url AS url,
               s.name AS source_name,
               s.site_url
             FROM edition_working_items ewi
             JOIN source_items si ON si.id = ewi.source_item_id
             JOIN sources s ON s.id = si.source_id
             WHERE ewi.edition_id IN (${workingPlaceholders})
             ORDER BY ewi.edition_id, ewi.position`,
          )
          .bind(...workingCopies.results.map((row) => row.edition_id))
          .all<EditionEntryWithParentRow>();
        for (const entry of workingEntries.results) {
          const editionEntries =
            workingEntriesByEdition.get(entry.edition_id) ?? [];
          editionEntries.push(mapEditionEntry(entry));
          workingEntriesByEdition.set(entry.edition_id, editionEntries);
        }
      }
    }
    return rows.map((row) => ({
      ...(workingByEdition.has(row.id)
        ? {
            entries: workingEntriesByEdition.get(row.id) ?? [],
            introMd: workingByEdition.get(row.id)?.intro_md ?? row.intro_md,
            title: workingByEdition.get(row.id)?.title ?? row.title,
            updatedAt:
              workingByEdition.get(row.id)?.updated_at ?? row.updated_at,
          }
        : {
            entries: entriesByEdition.get(row.id) ?? [],
            introMd: row.intro_md,
            title: row.title,
            updatedAt: row.updated_at,
          }),
      createdAt: row.created_at,
      date: row.edition_date,
      hasWorkingCopy: workingByEdition.has(row.id),
      id: row.id,
      publishedAt: row.published_at,
      status: row.status,
    }));
  }

  private async findApprovedRightsSnapshots(
    itemIds: string[],
  ): Promise<EditionRightsSnapshotRow[]> {
    const uniqueIds = [...new Set(itemIds)];
    if (uniqueIds.length === 0) return [];
    const placeholders = uniqueIds.map(() => "?").join(", ");
    const result = await this.database
      .prepare(
        `SELECT
           si.id AS item_id,
           s.name AS source_name,
           s.site_url,
           s.terms_url,
           s.rights_basis,
           s.reviewed_at
         FROM source_items si
         JOIN sources s ON s.id = si.source_id
         WHERE si.id IN (${placeholders})
           AND s.review_status = 'approved'
           AND s.terms_url IS NOT NULL
           AND length(trim(s.terms_url)) > 0
           AND s.rights_basis IS NOT NULL
           AND length(trim(s.rights_basis)) > 0
           AND s.reviewed_at IS NOT NULL`,
      )
      .bind(...uniqueIds)
      .all<EditionRightsSnapshotRow>();
    return result.results;
  }
}
