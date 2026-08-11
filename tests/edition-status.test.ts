import { describe, expect, it } from "vitest";

import {
  formatAutomationError,
  formatAutomationJob,
  formatAutomationRunStatus,
  formatAutomationRunSummary,
  formatAutomationTrigger,
  formatSourceError,
  formatSourceReviewStatus,
  formatSourceStatus,
} from "../src/lib/edition-status";

describe("source status presentation", () => {
  it.each([
    ["enabled", "啟用 Enabled"],
    ["paused", "暫停 Paused"],
  ] as const)("presents %s bilingually", (status, expected) => {
    expect(formatSourceStatus(status)).toBe(expected);
  });

  it.each([
    ["approved", "已核准 Approved"],
    ["pending", "待審核 Pending"],
    ["rejected", "不採用 Rejected"],
  ] as const)("presents review status %s bilingually", (status, expected) => {
    expect(formatSourceReviewStatus(status)).toBe(expected);
  });

  it.each([
    ["network_error", "無法連接來源。 Could not connect to the source."],
    ["redirect_error", "來源重新導向無效。 Source redirect was invalid."],
    ["feed_too_large", "Feed 超出大小上限。 Feed exceeded the size limit."],
    ["invalid_feed", "Feed 格式無法讀取。 Feed format could not be read."],
    ["http_503", "來源伺服器回應 HTTP 503。 Source server returned HTTP 503."],
  ])("presents source error %s without an internal code", (code, expected) => {
    expect(formatSourceError(code)).toBe(expected);
  });

  it("hides an unknown source error code behind a useful fallback", () => {
    expect(formatSourceError("future_private_detail")).toBe(
      "未能分類的來源錯誤。 Unclassified source error.",
    );
  });

  it("falls back safely when stored source states are newer than the UI", () => {
    expect(formatSourceStatus("legacy" as never)).toBe(
      "未識別來源狀態 Unknown source status",
    );
    expect(formatSourceReviewStatus("legacy" as never)).toBe(
      "未識別審核狀態 Unknown review status",
    );
  });
});

describe("automation run presentation", () => {
  it.each([
    ["failed", "失敗 Failed"],
    ["partial", "部分完成 Partially completed"],
    ["running", "執行中 Running"],
    ["skipped", "已略過 Skipped"],
    ["succeeded", "已完成 Succeeded"],
  ] as const)("presents run status %s bilingually", (status, expected) => {
    expect(formatAutomationRunStatus(status)).toBe(expected);
  });

  it.each([
    ["cron", "排程 Scheduled"],
    ["manual", "手動 Manual"],
  ] as const)("presents trigger %s bilingually", (trigger, expected) => {
    expect(formatAutomationTrigger(trigger)).toBe(expected);
  });

  it.each([
    ["source_ingestion", "來源同步 Source ingestion"],
    ["edition_generation", "Edition 產生 Edition generation"],
  ] as const)("presents job %s bilingually", (job, expected) => {
    expect(formatAutomationJob(job)).toBe(expected);
  });

  it.each([
    [
      "all_sources_failed",
      "所有已啟用來源均同步失敗。 All enabled sources failed to sync.",
    ],
    ["ingestion_error", "同步程序未能完成。 Source sync could not complete."],
    [
      "edition_generation_error",
      "Edition 產生程序未能完成。 Edition generation could not complete.",
    ],
  ])("presents run error %s bilingually", (code, expected) => {
    expect(formatAutomationError(code)).toBe(expected);
  });

  it("hides an unknown run error code behind a useful fallback", () => {
    expect(formatAutomationError("future_private_detail")).toBe(
      "未能分類的執行錯誤。 Unclassified run error.",
    );
  });

  it("falls back safely when stored run states are newer than the UI", () => {
    expect(formatAutomationRunStatus("legacy" as never)).toBe(
      "未識別執行狀態 Unknown run status",
    );
    expect(formatAutomationTrigger("legacy" as never)).toBe(
      "未識別觸發方式 Unknown trigger",
    );
    expect(formatAutomationJob("legacy" as never)).toBe(
      "未識別工作 Unknown job",
    );
  });

  it("orders known summary values using human-readable labels", () => {
    expect(
      formatAutomationRunSummary({
        failedSources: 1,
        fetchedSources: 2,
        newItems: 5,
        attemptedSources: 3,
      }),
    ).toBe(
      "嘗試來源 Attempted sources：3 · 已讀取來源 Fetched sources：2 · 失敗來源 Failed sources：1 · 新增項目 New items：5",
    );
  });

  it("counts unknown metrics without exposing their internal keys", () => {
    expect(
      formatAutomationRunSummary({ editionItems: 4, futurePrivateMetric: 9 }),
    ).toBe("Edition 項目 Edition items：4 · 其他項目 Other metrics：1");
    expect(formatAutomationRunSummary({})).toBe("");
  });
});
