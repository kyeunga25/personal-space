import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const dashboard = readSource("../src/pages/studio/index.astro");
const editionList = readSource("../src/pages/studio/editions/index.astro");
const editionEditor = readSource("../src/pages/studio/editions/[id].astro");

describe("Studio content status presentation contracts", () => {
  it("presents recent post status and fallback titles bilingually", () => {
    expect(dashboard).toContain("formatContentStatus(post.status)");
    expect(dashboard).not.toContain("{post.status}");
    expect(dashboard).toContain("未命名草稿 Untitled draft");
    expect(dashboard).toContain("未發佈修改 Unpublished changes");
  });

  it("presents Edition status, item count, and working copies bilingually", () => {
    expect(editionList).toContain("formatContentStatus(edition.status)");
    expect(editionList).toContain(
      "formatEditionItemCount(edition.entries.length)",
    );
    expect(editionList).not.toContain("{edition.status} ·");
    expect(editionList).not.toContain("{edition.entries.length} items");
    expect(editionList).toContain("未發佈修改 Unpublished changes");

    expect(editionEditor).toContain("formatContentStatus(edition.status)");
    expect(editionEditor).not.toContain("{edition.date} · {edition.status}");
    expect(editionEditor).toContain("未發佈修改 Unpublished changes");
  });
});
