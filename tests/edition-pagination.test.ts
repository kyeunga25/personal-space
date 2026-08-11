import { describe, expect, it, vi } from "vitest";

import {
  editionPageHref,
  normalizeEditionDate,
  parseEditionPageCursor,
} from "../src/server/editions/pagination";
import { D1EditionRepository } from "../src/server/editions/repository";

function editionRow(date: string): Record<string, string | null> {
  return {
    created_at: `${date}T00:00:00.000Z`,
    edition_date: date,
    id: `edition-${date}`,
    intro_md: "Public introduction",
    published_at: `${date}T08:00:00.000Z`,
    status: "published",
    title: `Edition ${date}`,
    updated_at: `${date}T08:00:00.000Z`,
  };
}

function repositoryFixture(rows: Record<string, string | null>[]) {
  const editionAll = vi.fn().mockResolvedValue({ results: rows });
  const editionBind = vi.fn().mockReturnValue({ all: editionAll });
  const entryAll = vi.fn().mockResolvedValue({ results: [] });
  const entryBind = vi.fn().mockReturnValue({ all: entryAll });
  const prepare = vi.fn().mockImplementation((sql: string) => ({
    bind: sql.includes("FROM editions") ? editionBind : entryBind,
  }));
  return {
    editionBind,
    entryBind,
    prepare,
    repository: new D1EditionRepository({ prepare } as unknown as D1Database),
  };
}

describe("public Edition pagination", () => {
  it("accepts only real calendar-date cursors and emits a canonical link", () => {
    expect(normalizeEditionDate("2026-08-09")).toBe("2026-08-09");
    expect(normalizeEditionDate("2026-02-30")).toBeNull();
    expect(
      parseEditionPageCursor(
        new URLSearchParams({
          before: "2026-08-09",
          ignored: "private-fragment",
        }),
      ),
    ).toBe("2026-08-09");
    expect(editionPageHref("2026-08-09")).toBe(
      "?before=2026-08-09#edition-list",
    );
    expect(editionPageHref("2026-02-30")).toBeNull();

    for (const value of ["", "0000-01-01", "2026-02-30", "not-a-date"]) {
      expect(
        parseEditionPageCursor(new URLSearchParams({ before: value })),
      ).toBeNull();
    }
  });

  it("returns a continuation date without mapping its lookahead row", async () => {
    const { editionBind, entryBind, repository } = repositoryFixture([
      editionRow("2026-08-10"),
      editionRow("2026-08-09"),
      editionRow("2026-08-08"),
    ]);

    const page = await repository.listPublicEditionPage(null, 2);

    expect(page.editions.map((edition) => edition.date)).toEqual([
      "2026-08-10",
      "2026-08-09",
    ]);
    expect(page.nextCursor).toBe("2026-08-09");
    expect(editionBind).toHaveBeenCalledWith(3);
    expect(entryBind).toHaveBeenCalledWith(
      "edition-2026-08-10",
      "edition-2026-08-09",
    );
  });

  it("binds the continuation date to the published-only query", async () => {
    const { editionBind, prepare, repository } = repositoryFixture([]);

    await repository.listPublicEditionPage("2026-08-09", 2);

    const sql = String(prepare.mock.calls[0]?.[0]);
    expect(sql).toContain("status = 'published'");
    expect(sql).toContain("edition_date < ?");
    expect(editionBind).toHaveBeenCalledWith("2026-08-09", 3);
  });
});

describe("owner Edition pagination", () => {
  it("returns a continuation date without mapping its lookahead row", async () => {
    const { editionBind, entryBind, prepare, repository } = repositoryFixture([
      editionRow("2026-08-10"),
      editionRow("2026-08-09"),
      editionRow("2026-08-08"),
    ]);

    const page = await repository.listOwnerEditionPage(null, 2);

    expect(page.editions.map((edition) => edition.date)).toEqual([
      "2026-08-10",
      "2026-08-09",
    ]);
    expect(page.nextCursor).toBe("2026-08-09");
    expect(String(prepare.mock.calls[0]?.[0])).not.toContain(
      "status = 'published'",
    );
    expect(editionBind).toHaveBeenCalledWith(3);
    expect(entryBind).toHaveBeenCalledWith(
      "edition-2026-08-10",
      "edition-2026-08-09",
    );
  });

  it("binds the continuation date without a public-status filter", async () => {
    const { editionBind, prepare, repository } = repositoryFixture([]);

    await repository.listOwnerEditionPage("2026-08-09", 2);

    const sql = String(prepare.mock.calls[0]?.[0]);
    expect(sql).toContain("edition_date < ?");
    expect(sql).not.toContain("status = 'published'");
    expect(editionBind).toHaveBeenCalledWith("2026-08-09", 3);
  });
});
