import { describe, expect, it, vi } from "vitest";

import { D1PublishingRepository } from "../src/server/publishing/repository";

describe("public media publication boundary", () => {
  it("requires a currently readable canonical parent post", async () => {
    let sql = "";
    let bindings: unknown[] = [];
    const prepare = vi.fn((value: string) => {
      sql = value;
      const statement = {
        bind: vi.fn((...values: unknown[]) => {
          bindings = values;
          return statement;
        }),
        first: vi.fn().mockResolvedValue(null),
      };
      return statement;
    });
    const repository = new D1PublishingRepository({
      prepare,
    } as unknown as D1Database);
    const now = "2026-08-11T12:00:00.000Z";

    await expect(
      repository.findPublicMedia("synthetic-media", now),
    ).resolves.toBeNull();

    expect(sql).toContain("JOIN posts p ON p.hero_media_id = m.id");
    expect(sql).toContain("p.visibility IN ('public', 'unlisted')");
    expect(sql).toContain("p.status = 'published'");
    expect(sql).toContain("p.scheduled_at <= ?");
    expect(bindings).toEqual(["synthetic-media", now]);
  });
});
