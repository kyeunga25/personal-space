import { describe, expect, it, vi } from "vitest";

import type {
  EditionEntry,
  EditionRecord,
  EditionSaveInput,
} from "../src/server/editions/domain";
import { D1EditionRepository } from "../src/server/editions/repository";
import { UserFacingError } from "../src/server/errors";

const now = "2026-08-10T00:00:00.000Z";
const entry: EditionEntry = {
  annotation: "Synthetic annotation.",
  clusterId: "synthetic-cluster",
  itemId: "synthetic-item",
  position: 0,
  publishedAt: now,
  sourceName: "Example",
  sourceSiteUrl: "https://example.com/",
  summary: "Synthetic summary.",
  title: "Synthetic item",
  url: "https://example.com/items/1",
};
const secondEntry: EditionEntry = {
  ...entry,
  annotation: "Second synthetic annotation.",
  clusterId: "synthetic-cluster-2",
  itemId: "synthetic-item-2",
  position: 1,
  title: "Second synthetic item",
  url: "https://example.com/items/2",
};
const edition: EditionRecord = {
  createdAt: now,
  date: "2026-08-10",
  entries: [entry],
  hasWorkingCopy: false,
  id: "synthetic-edition",
  introMd: "Synthetic introduction.",
  publishedAt: null,
  status: "draft",
  title: "Synthetic Edition",
  updatedAt: now,
};
const input: EditionSaveInput = {
  action: "save",
  annotations: { [entry.itemId]: entry.annotation },
  includedItemIds: [entry.itemId],
  introMd: edition.introMd,
  title: edition.title,
};

interface EditionRepositoryInternals {
  findApprovedRightsSnapshots(itemIds: string[]): Promise<
    {
      item_id: string;
      reviewed_at: string;
      rights_basis: string;
      site_url: string | null;
      source_name: string;
      terms_url: string;
    }[]
  >;
  findCanonicalEdition(id: string): Promise<EditionRecord | null>;
}

function repositoryFixture() {
  const prepare = vi.fn();
  const repository = new D1EditionRepository({
    prepare,
  } as unknown as D1Database);
  return {
    internals: repository as unknown as EditionRepositoryInternals,
    prepare,
    repository,
  };
}

describe("Edition repository public errors", () => {
  it("rejects a missing owner Edition with a bilingual 404", async () => {
    const { prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(null);

    await expect(
      repository.saveEdition("missing-edition", input, now),
    ).rejects.toEqual(
      new UserFacingError(
        "找不到這份 Edition。 The requested Edition could not be found.",
        404,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rejects a missing canonical Edition with the same bilingual 404", async () => {
    const { internals, prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(edition);
    vi.spyOn(internals, "findCanonicalEdition").mockResolvedValue(null);

    await expect(
      repository.saveEdition(edition.id, input, now),
    ).rejects.toEqual(
      new UserFacingError(
        "找不到這份 Edition。 The requested Edition could not be found.",
        404,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rejects stale item selections with a bilingual 409 before writing", async () => {
    const { internals, prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(edition);
    vi.spyOn(internals, "findCanonicalEdition").mockResolvedValue(edition);

    await expect(
      repository.saveEdition(
        edition.id,
        { ...input, includedItemIds: ["missing-item"] },
        now,
      ),
    ).rejects.toEqual(
      new UserFacingError(
        "Edition 內容已變更，請重新載入。 Edition content has changed; reload before saving.",
        409,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });

  it("rejects publication when current source rights evidence is missing", async () => {
    const { internals, prepare, repository } = repositoryFixture();
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(edition);
    vi.spyOn(internals, "findCanonicalEdition").mockResolvedValue(edition);
    vi.spyOn(internals, "findApprovedRightsSnapshots").mockResolvedValue([]);

    await expect(
      repository.saveEdition(edition.id, { ...input, action: "publish" }, now),
    ).rejects.toEqual(
      new UserFacingError(
        "來源權利狀態已變更，請重新核對後再發佈。 Source rights changed; review them before publishing.",
        409,
      ),
    );
    expect(prepare).not.toHaveBeenCalled();
  });
});

describe("Edition repository item order", () => {
  it("persists the reviewed item sequence as consecutive positions", async () => {
    const bindings: { args: unknown[]; sql: string }[] = [];
    const batch = vi.fn().mockResolvedValue([]);
    const prepare = vi.fn((sql: string) => {
      const statement = {
        bind: vi.fn((...args: unknown[]) => {
          bindings.push({ args, sql });
          return statement;
        }),
      };
      return statement;
    });
    const repository = new D1EditionRepository({
      batch,
      prepare,
    } as unknown as D1Database);
    const orderedEdition = {
      ...edition,
      entries: [entry, secondEntry],
    };
    const internals = repository as unknown as EditionRepositoryInternals;
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(orderedEdition);
    vi.spyOn(internals, "findCanonicalEdition").mockResolvedValue(
      orderedEdition,
    );

    await repository.saveEdition(
      orderedEdition.id,
      {
        ...input,
        annotations: {
          [entry.itemId]: entry.annotation,
          [secondEntry.itemId]: secondEntry.annotation,
        },
        includedItemIds: [secondEntry.itemId, entry.itemId],
      },
      now,
    );

    const inserts = bindings.filter(({ sql }) =>
      sql.includes("INSERT INTO edition_items"),
    );
    expect(inserts.map(({ args }) => args)).toEqual([
      [
        orderedEdition.id,
        secondEntry.clusterId,
        secondEntry.itemId,
        0,
        secondEntry.annotation,
      ],
      [orderedEdition.id, entry.clusterId, entry.itemId, 1, entry.annotation],
    ]);
    expect(batch).toHaveBeenCalledOnce();
  });

  it("snapshots approved attribution and rights evidence on publication", async () => {
    const bindings: { args: unknown[]; sql: string }[] = [];
    const batch = vi.fn().mockResolvedValue([]);
    const prepare = vi.fn((sql: string) => {
      const statement = {
        bind: vi.fn((...args: unknown[]) => {
          bindings.push({ args, sql });
          return statement;
        }),
      };
      return statement;
    });
    const repository = new D1EditionRepository({
      batch,
      prepare,
    } as unknown as D1Database);
    const internals = repository as unknown as EditionRepositoryInternals;
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(edition);
    vi.spyOn(internals, "findCanonicalEdition").mockResolvedValue(edition);
    vi.spyOn(internals, "findApprovedRightsSnapshots").mockResolvedValue([
      {
        item_id: entry.itemId,
        reviewed_at: now,
        rights_basis: "Synthetic approved use.",
        site_url: entry.sourceSiteUrl,
        source_name: entry.sourceName,
        terms_url: "https://example.com/terms",
      },
    ]);

    await repository.saveEdition(
      edition.id,
      { ...input, action: "publish" },
      now,
    );

    const insert = bindings.find(({ sql }) =>
      sql.includes("INSERT INTO edition_items"),
    );
    expect(insert?.sql).toContain("source_rights_basis_snapshot");
    expect(insert?.args).toEqual([
      edition.id,
      entry.clusterId,
      entry.itemId,
      0,
      entry.annotation,
      entry.sourceName,
      entry.sourceSiteUrl,
      "https://example.com/terms",
      "Synthetic approved use.",
      now,
    ]);
    expect(batch).toHaveBeenCalledOnce();
  });

  it("moves a published Edition out of the public state before replacing items during archive", async () => {
    const statements: string[] = [];
    const batch = vi.fn().mockResolvedValue([]);
    const prepare = vi.fn((sql: string) => {
      statements.push(sql);
      const statement = {
        bind: vi.fn(() => statement),
      };
      return statement;
    });
    const repository = new D1EditionRepository({
      batch,
      prepare,
    } as unknown as D1Database);
    const publishedEdition: EditionRecord = {
      ...edition,
      publishedAt: now,
      status: "published",
    };
    const internals = repository as unknown as EditionRepositoryInternals;
    vi.spyOn(repository, "findOwnerEdition").mockResolvedValue(
      publishedEdition,
    );
    vi.spyOn(internals, "findCanonicalEdition").mockResolvedValue(
      publishedEdition,
    );

    await repository.saveEdition(
      publishedEdition.id,
      { ...input, action: "archive" },
      now,
    );

    expect(statements[0]).toContain("SET status = 'archived'");
    expect(statements[1]).toContain("DELETE FROM edition_items");
    expect(batch).toHaveBeenCalledOnce();
  });
});

describe("Edition repository public rights boundary", () => {
  it("requires current approval and immutable publication snapshots", async () => {
    let publicSql = "";
    const prepare = vi.fn((sql: string) => {
      publicSql = sql;
      const statement = {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn(() => statement),
      };
      return statement;
    });
    const repository = new D1EditionRepository({
      prepare,
    } as unknown as D1Database);

    await expect(repository.listPublicEditions()).resolves.toEqual([]);

    expect(publicSql).toContain("NOT EXISTS");
    expect(publicSql).toContain("rights_source.review_status = 'approved'");
    expect(publicSql).toContain("source_rights_basis_snapshot IS NULL");
  });
});
