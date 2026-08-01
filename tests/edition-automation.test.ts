import { describe, expect, it, vi } from "vitest";

import type {
  AutomationRunClaim,
  SourceRecord,
} from "../src/server/editions/domain";
import {
  EditionAutomationService,
  MAX_ITEMS_PER_SOURCE,
  MAX_SOURCES_PER_RUN,
  type EditionAutomationRepository,
} from "../src/server/editions/service";

const claimedRun: AutomationRunClaim = {
  attemptCount: 1,
  claimed: true,
  claimToken: "claim-token",
  id: "run-1",
  status: "running",
};

const source: SourceRecord = {
  createdAt: "2026-08-01T00:00:00.000Z",
  etag: null,
  failureCount: 0,
  feedUrl: "https://example.com/feed.xml",
  id: "source-1",
  lastErrorCode: null,
  lastFetchedAt: null,
  lastModified: null,
  lastSuccessAt: null,
  name: "Example",
  reviewNotes: null,
  reviewedAt: "2026-08-01T00:00:00.000Z",
  reviewStatus: "approved",
  rightsBasis: "Reviewed public feed terms.",
  siteUrl: "https://example.com/",
  status: "enabled",
  termsUrl: "https://example.com/terms",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function repository(
  overrides: Partial<EditionAutomationRepository> = {},
): EditionAutomationRepository {
  return {
    claimAutomationRun: vi.fn().mockResolvedValue(claimedRun),
    completeAutomationRun: vi.fn().mockResolvedValue(undefined),
    findExistingItems: vi.fn().mockResolvedValue({
      ids: new Set<string>(),
      urls: new Set<string>(),
    }),
    generateDailyEdition: vi.fn(),
    listEnabledSources: vi.fn().mockResolvedValue([]),
    listRecentClusters: vi.fn().mockResolvedValue([]),
    markSourceFailure: vi.fn().mockResolvedValue(undefined),
    markSourceNotModified: vi.fn().mockResolvedValue(undefined),
    saveIngestedEntries: vi.fn().mockResolvedValue(1),
    ...overrides,
  };
}

describe("edition automation", () => {
  it("keeps each ingestion run inside the documented free-tier budget", () => {
    expect(MAX_SOURCES_PER_RUN).toBe(2);
    expect(MAX_ITEMS_PER_SOURCE).toBe(5);
  });

  it("records a skipped run when no approved source is enabled", async () => {
    const data = repository();
    const result = await new EditionAutomationService(data).runIngestion({
      now: new Date("2026-08-01T00:00:00.000Z"),
    });

    expect(result.status).toBe("skipped");
    expect(result.report?.attemptedSources).toBe(0);
    expect(data.completeAutomationRun).toHaveBeenCalledWith(
      claimedRun,
      "skipped",
      expect.objectContaining({ attemptedSources: 0 }),
      expect.any(String),
      null,
    );
  });

  it("records a failed run when every attempted source fails", async () => {
    const data = repository({
      listEnabledSources: vi.fn().mockResolvedValue([source]),
    });
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("down"));
    const result = await new EditionAutomationService(
      data,
      fetcher,
    ).runIngestion({ now: new Date("2026-08-01T00:00:00.000Z") });

    expect(result.status).toBe("failed");
    expect(result.report).toEqual(
      expect.objectContaining({ attemptedSources: 1, failedSources: 1 }),
    );
    expect(data.completeAutomationRun).toHaveBeenCalledWith(
      claimedRun,
      "failed",
      expect.objectContaining({ failedSources: 1 }),
      expect.any(String),
      "all_sources_failed",
    );
  });

  it("records a successful bounded ingestion without source details", async () => {
    const data = repository({
      listEnabledSources: vi.fn().mockResolvedValue([source]),
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          "<rss><channel><item><guid>1</guid><title>Update</title><link>https://example.com/1</link></item></channel></rss>",
        ),
      );
    const result = await new EditionAutomationService(
      data,
      fetcher,
    ).runIngestion({ now: new Date("2026-08-01T00:00:00.000Z") });

    expect(result.status).toBe("succeeded");
    expect(result.report).toEqual(
      expect.objectContaining({
        attemptedSources: 1,
        fetchedSources: 1,
        newItems: 1,
      }),
    );
    const completion = vi.mocked(data.completeAutomationRun).mock.calls[0];
    expect(completion?.[2]).toEqual({
      attemptedSources: 1,
      failedSources: 0,
      fetchedSources: 1,
      newItems: 1,
      notModifiedSources: 0,
    });
  });

  it("records a partial run when one source succeeds and another fails", async () => {
    const secondSource: SourceRecord = {
      ...source,
      feedUrl: "https://second.example.com/feed.xml",
      id: "source-2",
      name: "Second",
      siteUrl: "https://second.example.com/",
      termsUrl: "https://second.example.com/terms",
    };
    const data = repository({
      listEnabledSources: vi.fn().mockResolvedValue([source, secondSource]),
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          "<rss><channel><item><guid>1</guid><title>Update</title><link>https://example.com/1</link></item></channel></rss>",
        ),
      )
      .mockRejectedValueOnce(new Error("down"));
    const result = await new EditionAutomationService(
      data,
      fetcher,
    ).runIngestion({ now: new Date("2026-08-01T00:00:00.000Z") });

    expect(result.status).toBe("partial");
    expect(result.report).toEqual(
      expect.objectContaining({
        attemptedSources: 2,
        failedSources: 1,
        fetchedSources: 1,
      }),
    );
  });

  it("does not repeat a completed Cron run", async () => {
    const listEnabledSources = vi.fn().mockResolvedValue([source]);
    const data = repository({
      claimAutomationRun: vi.fn().mockResolvedValue({
        ...claimedRun,
        claimed: false,
        status: "succeeded",
      }),
      listEnabledSources,
    });
    const result = await new EditionAutomationService(data).runIngestion({
      now: new Date("2026-08-01T00:00:00.000Z"),
      scheduledAt: new Date("2026-08-01T00:00:00.000Z"),
      trigger: "cron",
    });

    expect(result).toEqual(
      expect.objectContaining({
        duplicate: true,
        report: null,
        status: "succeeded",
      }),
    );
    expect(listEnabledSources).not.toHaveBeenCalled();
    expect(data.completeAutomationRun).not.toHaveBeenCalled();
  });
});
