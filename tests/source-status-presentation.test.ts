import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const sourcePage = readFileSync(
  new URL("../src/pages/studio/sources/index.astro", import.meta.url),
  "utf8",
);

describe("source page status presentation contracts", () => {
  it("uses shared bilingual labels instead of raw source state", () => {
    expect(sourcePage).toContain("formatSourceStatus(source.status)");
    expect(sourcePage).toContain(
      "formatSourceReviewStatus(source.reviewStatus)",
    );
    expect(sourcePage).toContain("formatSourceError(source.lastErrorCode)");
    expect(sourcePage).not.toContain("審核：{source.reviewStatus}");
    expect(sourcePage).not.toContain("狀態：{source.lastErrorCode}");
  });

  it("uses shared bilingual labels instead of raw automation state", () => {
    expect(sourcePage).toContain("formatAutomationJob(run.job)");
    expect(sourcePage).toContain("formatAutomationRunStatus(run.status)");
    expect(sourcePage).toContain("formatAutomationTrigger(run.trigger)");
    expect(sourcePage).toContain("formatAutomationRunSummary(run.summary)");
    expect(sourcePage).toContain("formatAutomationError(run.errorCode)");
    expect(sourcePage).not.toContain(">{run.status}</span>");
    expect(sourcePage).not.toContain("{run.trigger} · 嘗試");
  });
});
