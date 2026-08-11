import { describe, expect, it, vi } from "vitest";

import {
  automationRunPageHref,
  parseAutomationRunPageCursor,
} from "../src/server/editions/automation-run-pagination";
import { D1EditionRepository } from "../src/server/editions/repository";

function automationRunRow(id: string, scheduledAt: string, createdAt: string) {
  return {
    attempt_count: 1,
    completed_at: scheduledAt,
    created_at: createdAt,
    error_code: null,
    id,
    job: "source_ingestion",
    scheduled_at: scheduledAt,
    started_at: scheduledAt,
    status: "succeeded",
    summary_json: '{"fetchedSources":1}',
    trigger_kind: "cron",
  };
}

function repositoryFixture(rows: ReturnType<typeof automationRunRow>[]) {
  const all = vi.fn().mockResolvedValue({ results: rows });
  const bind = vi.fn().mockReturnValue({ all });
  const prepare = vi.fn().mockReturnValue({ bind });
  return {
    bind,
    prepare,
    repository: new D1EditionRepository({
      prepare,
    } as unknown as D1Database),
  };
}

describe("automation run pagination", () => {
  it("accepts only a complete cursor and emits a canonical section link", () => {
    const cursor = {
      beforeCreated: "2026-08-10T08:00:01.000Z",
      beforeId: "run-2",
      beforeScheduled: "2026-08-10T08:00:00.000Z",
    };

    expect(
      parseAutomationRunPageCursor(
        new URLSearchParams({
          ignored: "private-fragment",
          runBeforeCreated: cursor.beforeCreated,
          runBeforeId: cursor.beforeId,
          runBeforeScheduled: cursor.beforeScheduled,
          sourceBefore: "2026-08-09T08:00:00.000Z",
          sourceBeforeId: "source-2",
        }),
      ),
    ).toEqual(cursor);
    expect(automationRunPageHref(cursor)).toBe(
      "?runBeforeScheduled=2026-08-10T08%3A00%3A00.000Z&runBeforeCreated=2026-08-10T08%3A00%3A01.000Z&runBeforeId=run-2#run-list-heading",
    );

    for (const params of [
      {},
      { runBeforeScheduled: cursor.beforeScheduled },
      {
        runBeforeCreated: cursor.beforeCreated,
        runBeforeId: cursor.beforeId,
        runBeforeScheduled: "not-a-date",
      },
      {
        runBeforeCreated: "not-a-date",
        runBeforeId: cursor.beforeId,
        runBeforeScheduled: cursor.beforeScheduled,
      },
      {
        runBeforeCreated: cursor.beforeCreated,
        runBeforeId: " run-2",
        runBeforeScheduled: cursor.beforeScheduled,
      },
      {
        runBeforeCreated: cursor.beforeCreated,
        runBeforeId: "x".repeat(101),
        runBeforeScheduled: cursor.beforeScheduled,
      },
    ]) {
      expect(
        parseAutomationRunPageCursor(new URLSearchParams(params)),
      ).toBeNull();
    }
  });

  it("returns a continuation cursor without mapping its lookahead row", async () => {
    const { bind, repository } = repositoryFixture([
      automationRunRow(
        "run-3",
        "2026-08-10T09:00:00.000Z",
        "2026-08-10T09:00:01.000Z",
      ),
      automationRunRow(
        "run-2",
        "2026-08-10T08:00:00.000Z",
        "2026-08-10T08:00:01.000Z",
      ),
      automationRunRow(
        "run-1",
        "2026-08-10T07:00:00.000Z",
        "2026-08-10T07:00:01.000Z",
      ),
    ]);

    const page = await repository.listAutomationRunPage(null, 2);

    expect(page.runs.map((run) => run.id)).toEqual(["run-3", "run-2"]);
    expect(page.nextCursor).toEqual({
      beforeCreated: "2026-08-10T08:00:01.000Z",
      beforeId: "run-2",
      beforeScheduled: "2026-08-10T08:00:00.000Z",
    });
    expect(bind).toHaveBeenCalledWith(3);
  });

  it("binds a stable schedule, creation time, and id cursor", async () => {
    const { bind, prepare, repository } = repositoryFixture([]);
    const cursor = {
      beforeCreated: "2026-08-10T08:00:01.000Z",
      beforeId: "run-2",
      beforeScheduled: "2026-08-10T08:00:00.000Z",
    };

    await repository.listAutomationRunPage(cursor, 2);

    const sql = String(prepare.mock.calls[0]?.[0]);
    expect(sql).toContain("scheduled_at < ?");
    expect(sql).toContain("scheduled_at = ? AND created_at < ?");
    expect(sql).toContain("scheduled_at = ? AND created_at = ? AND id < ?");
    expect(sql).toContain(
      "ORDER BY scheduled_at DESC, created_at DESC, id DESC",
    );
    expect(sql).not.toContain("claim_token");
    expect(bind).toHaveBeenCalledWith(
      cursor.beforeScheduled,
      cursor.beforeScheduled,
      cursor.beforeCreated,
      cursor.beforeScheduled,
      cursor.beforeCreated,
      cursor.beforeId,
      3,
    );
  });
});
