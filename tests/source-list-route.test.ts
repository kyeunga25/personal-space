import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => {
  const all = vi.fn();
  const bind = vi.fn(() => ({ all }));
  const prepare = vi.fn(() => ({ bind }));
  return { all, bind, prepare };
});

vi.mock("cloudflare:workers", () => ({
  env: { DB: { prepare: database.prepare } },
}));

import { GET } from "../src/pages/api/studio/sources/index";

function sourceRow(id: string, createdAt: string) {
  return {
    created_at: createdAt,
    etag: null,
    failure_count: 0,
    feed_url: `https://example.com/${id}.xml`,
    id,
    last_error_code: null,
    last_fetched_at: null,
    last_modified: null,
    last_success_at: null,
    name: `Source ${id}`,
    review_notes: null,
    review_status: "pending",
    reviewed_at: null,
    rights_basis: null,
    site_url: "https://example.com/",
    status: "paused",
    terms_url: null,
    updated_at: createdAt,
  };
}

describe("Source list route", () => {
  beforeEach(() => {
    database.all.mockReset();
    database.bind.mockClear();
    database.prepare.mockClear();
  });

  it("bounds the first page and returns a continuation cursor", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => {
      const day = String(31 - index).padStart(2, "0");
      return sourceRow(
        `source-${String(21 - index).padStart(2, "0")}`,
        `2026-07-${day}T08:00:00.000Z`,
      );
    });
    database.all.mockResolvedValue({ results: rows });

    const response = await GET({
      url: new URL("https://example.com/api/studio/sources"),
    } as never);
    const payload: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      nextCursor: {
        before: "2026-07-12T08:00:00.000Z",
        beforeId: "source-02",
      },
    });
    if (
      !payload ||
      typeof payload !== "object" ||
      !("sources" in payload) ||
      !Array.isArray(payload.sources)
    ) {
      throw new TypeError("Expected a source page response");
    }
    expect(payload.sources).toHaveLength(20);
    expect(payload.sources.at(-1)).toMatchObject({ id: "source-02" });
    expect(database.bind).toHaveBeenCalledWith(21);
  });

  it("binds a complete cursor and ignores an incomplete one", async () => {
    database.all.mockResolvedValue({ results: [] });
    const before = "2026-07-12T08:00:00.000Z";

    await GET({
      url: new URL(
        `https://example.com/api/studio/sources?sourceBefore=${encodeURIComponent(before)}&sourceBeforeId=source-02`,
      ),
    } as never);
    expect(database.bind).toHaveBeenLastCalledWith(
      before,
      before,
      "source-02",
      21,
    );

    await GET({
      url: new URL(
        `https://example.com/api/studio/sources?sourceBefore=${encodeURIComponent(before)}`,
      ),
    } as never);
    expect(database.bind).toHaveBeenLastCalledWith(21);
  });
});
