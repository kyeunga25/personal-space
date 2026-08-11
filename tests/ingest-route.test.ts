import { beforeEach, describe, expect, it, vi } from "vitest";

const runIngestion = vi.hoisted(() => vi.fn<() => Promise<unknown>>());

vi.mock("cloudflare:workers", () => ({ env: { DB: {} } }));
vi.mock("../src/server/editions/service", () => ({
  EditionAutomationService: class {
    runIngestion() {
      return runIngestion();
    }
  },
}));

import { POST } from "../src/pages/api/studio/ingest";

describe("Source ingestion route", () => {
  beforeEach(() => {
    runIngestion.mockReset();
  });

  it("returns a bounded bilingual error when every enabled source fails", async () => {
    runIngestion.mockResolvedValue({
      runId: "synthetic-run",
      status: "failed",
    });

    const response = await POST({} as never);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error:
        "所有已啟用來源均同步失敗，請查看執行紀錄。 All enabled sources failed to sync; review the run log.",
    });
  });

  it.each(["partial", "skipped", "succeeded"])(
    "preserves a completed %s acknowledgement",
    async (status) => {
      const result = { runId: "synthetic-run", status };
      runIngestion.mockResolvedValue(result);

      const response = await POST({} as never);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ result });
    },
  );
});
