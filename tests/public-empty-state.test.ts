import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const discoveryList = readSource("../src/components/DiscoveryPostList.astro");
const homePage = readSource("../src/pages/index.astro");
const archivePage = readSource("../src/components/ArchivePage.astro");
const dedicatedList = readSource("../src/components/PostListPage.astro");

describe("public empty-state language contracts", () => {
  it("renders customizable English discovery copy as separate language content", () => {
    expect(discoveryList).toContain("emptyTitleEn?: string");
    expect(discoveryList).toContain("emptyDescriptionEn?: string");
    expect(discoveryList).toContain('<small lang="en">{emptyTitleEn}</small>');
    expect(discoveryList).toMatch(
      /<p class="en-subline" lang="en">\s*\{emptyDescriptionEn\}\s*<\/p>/u,
    );
  });

  it("gives the welcoming home state matching English meaning", () => {
    expect(homePage).toContain('emptyTitleEn="This space is ready"');
    expect(homePage).toContain(
      'emptyDescriptionEn="Published notes or articles will appear here chronologically."',
    );
  });

  it("keeps archive empty descriptions in separate languages", () => {
    expect(archivePage).toContain("const emptyDescriptionEn =");
    expect(archivePage).toContain("{emptyDescriptionEn}");
    expect(archivePage).not.toContain(
      "這個月份暫未有公開內容。 No public entries in this month.",
    );
  });

  it("uses kind-specific bilingual copy in dedicated lists", () => {
    expect(dedicatedList).toContain("getPublicPostListEmptyState");
    expect(dedicatedList).toContain("emptyState.titleEn");
    expect(dedicatedList).toContain("emptyState.descriptionEn");
  });
});
