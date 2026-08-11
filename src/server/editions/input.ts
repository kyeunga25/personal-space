import { EDITION_INPUT_LIMITS } from "../../config/editions";
import { UserFacingError } from "../errors";
import type {
  EditionSaveInput,
  SourceReviewStatus,
  SourceStatus,
} from "./domain";
import { validateFeedUrl } from "./feed-fetcher";

export interface SourceInput {
  feedUrl: string;
  name: string;
  reviewNotes: string | null;
  reviewStatus: SourceReviewStatus;
  rightsBasis: string | null;
  siteUrl: string | null;
  status: SourceStatus;
  termsUrl: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function text(value: unknown, limit: number): string {
  return normalizedText(value).slice(0, limit);
}

function exceedsTextLimit(value: unknown, limit: number): boolean {
  return typeof value === "string" && value.trim().length > limit;
}

function optionalSiteUrl(value: unknown): string | null {
  const raw = normalizedText(value);
  if (!raw) return null;
  const url = validateFeedUrl(raw);
  url.pathname = url.pathname === "/" ? "/" : url.pathname;
  return url.toString();
}

function optionalText(value: unknown, limit: number): string | null {
  return text(value, limit) || null;
}

function parseEditionItemIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > EDITION_INPUT_LIMITS.items) {
    return null;
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") return null;
    const id = item.trim();
    if (!id || id.length > EDITION_INPUT_LIMITS.itemId || seen.has(id)) {
      return null;
    }
    ids.push(id);
    seen.add(id);
  }
  return ids;
}

function parseEditionAnnotations(
  value: unknown,
  includedItemIds: string[],
): Record<string, string> | null {
  const record = asRecord(value);
  if (!record) return null;
  const entries = Object.entries(record);
  if (entries.length > EDITION_INPUT_LIMITS.items) return null;

  const included = new Set(includedItemIds);
  const annotations: Record<string, string> = {};
  for (const [rawId, annotation] of entries) {
    const id = rawId.trim();
    if (
      !id ||
      id.length > EDITION_INPUT_LIMITS.itemId ||
      !included.has(id) ||
      Object.prototype.hasOwnProperty.call(annotations, id) ||
      typeof annotation !== "string" ||
      annotation.length > EDITION_INPUT_LIMITS.annotation
    ) {
      return null;
    }
    annotations[id] = annotation.trim();
  }
  return annotations;
}

export function parseSourceInput(value: unknown): SourceInput | null {
  const record = asRecord(value);
  if (!record) return null;
  if (
    exceedsTextLimit(record.name, 120) ||
    exceedsTextLimit(record.rightsBasis, 600) ||
    exceedsTextLimit(record.reviewNotes, 1000)
  ) {
    return null;
  }
  const name = text(record.name, 120);
  const feedUrl = normalizedText(record.feedUrl);
  const status: SourceStatus =
    record.status === "enabled" ? "enabled" : "paused";
  const reviewStatus: SourceReviewStatus =
    record.reviewStatus === "approved"
      ? "approved"
      : record.reviewStatus === "rejected"
        ? "rejected"
        : "pending";
  if (!name || !feedUrl) return null;

  const termsUrl = optionalSiteUrl(record.termsUrl);
  const rightsBasis = optionalText(record.rightsBasis, 600);
  const reviewNotes = optionalText(record.reviewNotes, 1000);
  if (reviewStatus === "approved") {
    if (record.rightsConfirmed !== true) {
      throw new UserFacingError(
        "請明確確認已核對來源條款及使用權利。 Explicitly confirm that the source terms and usage rights have been reviewed.",
        400,
      );
    }
    if (!termsUrl || !rightsBasis) {
      throw new UserFacingError(
        "核准來源需要條款網址及權利依據。 Approved sources require a terms URL and rights basis.",
        400,
      );
    }
  }
  if (status === "enabled" && reviewStatus !== "approved") {
    throw new UserFacingError(
      "來源完成權利審核後才可啟用。 Sources can be enabled only after rights review is complete.",
      400,
    );
  }

  return {
    feedUrl: validateFeedUrl(feedUrl).toString(),
    name,
    reviewNotes,
    reviewStatus,
    rightsBasis,
    siteUrl: optionalSiteUrl(record.siteUrl),
    status,
    termsUrl,
  };
}

export function parseEditionSaveInput(value: unknown): EditionSaveInput | null {
  const record = asRecord(value);
  if (!record) return null;
  if (
    exceedsTextLimit(record.title, EDITION_INPUT_LIMITS.title) ||
    exceedsTextLimit(record.introMd, EDITION_INPUT_LIMITS.introMd)
  ) {
    return null;
  }
  const action = record.action;
  if (action !== "archive" && action !== "publish" && action !== "save") {
    return null;
  }
  const title = text(record.title, EDITION_INPUT_LIMITS.title);
  if (!title) return null;
  const includedItemIds = parseEditionItemIds(record.includedItemIds);
  if (!includedItemIds) return null;
  const annotations = parseEditionAnnotations(
    record.annotations,
    includedItemIds,
  );
  if (!annotations) return null;

  if (action === "publish" && includedItemIds.length === 0) {
    throw new UserFacingError(
      "Edition 至少需要一項內容才可發佈。 Include at least one item before publishing.",
      400,
    );
  }

  return {
    action,
    annotations,
    includedItemIds,
    introMd: text(record.introMd, EDITION_INPUT_LIMITS.introMd),
    title,
  };
}
