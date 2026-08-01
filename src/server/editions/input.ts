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
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function optionalSiteUrl(value: unknown): string | null {
  const raw = text(value, 2048);
  if (!raw) return null;
  const url = validateFeedUrl(raw);
  url.pathname = url.pathname === "/" ? "/" : url.pathname;
  return url.toString();
}

function optionalText(value: unknown, limit: number): string | null {
  return text(value, limit) || null;
}

export function parseSourceInput(value: unknown): SourceInput | null {
  const record = asRecord(value);
  if (!record) return null;
  const name = text(record.name, 120);
  const feedUrl = text(record.feedUrl, 2048);
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
      throw new UserFacingError("請明確確認已核對來源條款及使用權利。", 400);
    }
    if (!termsUrl || !rightsBasis) {
      throw new UserFacingError("核准來源需要條款網址及權利依據。", 400);
    }
  }
  if (status === "enabled" && reviewStatus !== "approved") {
    throw new UserFacingError("來源完成權利審核後才可啟用。", 400);
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
  const action = record.action;
  if (action !== "archive" && action !== "publish" && action !== "save") {
    return null;
  }
  const title = text(record.title, 180);
  if (!title) return null;
  const includedItemIds = Array.isArray(record.includedItemIds)
    ? record.includedItemIds
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 100))
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const rawAnnotations = asRecord(record.annotations) ?? {};
  const annotations = Object.fromEntries(
    Object.entries(rawAnnotations)
      .filter((entry): entry is [string, string] =>
        entry.every((part) => typeof part === "string"),
      )
      .slice(0, 20)
      .map(([id, annotation]) => [
        id.slice(0, 100),
        annotation.trim().slice(0, 600),
      ]),
  );

  if (action === "publish" && includedItemIds.length === 0) {
    throw new UserFacingError("Edition 至少需要一項內容才可發佈。", 400);
  }

  return {
    action,
    annotations,
    includedItemIds: [...new Set(includedItemIds)],
    introMd: text(record.introMd, 5000),
    title,
  };
}
