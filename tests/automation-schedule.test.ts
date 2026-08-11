import { describe, expect, it } from "vitest";

import { scheduledAutomationJob } from "../src/server/editions/schedule";

const environment = {
  EDITION_CRON: "0 1 * * *",
  INGEST_CRON: "0 0 * * *",
};

describe("private automation schedule mapping", () => {
  it("maps only schedules supplied by the deployment environment", () => {
    expect(scheduledAutomationJob("0 0 * * *", environment)).toBe(
      "source_ingestion",
    );
    expect(scheduledAutomationJob("0 1 * * *", environment)).toBe(
      "edition_generation",
    );
    expect(scheduledAutomationJob("0 2 * * *", environment)).toBeNull();
  });

  it("fails closed when schedule configuration is missing or ambiguous", () => {
    expect(() => scheduledAutomationJob("0 0 * * *", {})).toThrow(
      "automation_schedule_configuration_error",
    );
    expect(() =>
      scheduledAutomationJob("0 0 * * *", {
        EDITION_CRON: "0 0 * * *",
        INGEST_CRON: "0 0 * * *",
      }),
    ).toThrow("automation_schedule_configuration_error");
  });
});
