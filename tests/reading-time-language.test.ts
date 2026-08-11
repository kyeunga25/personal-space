import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

describe("reading-time language markup", () => {
  it("renders the shared English label with an explicit language", () => {
    const label = readSource("../src/components/ReadingTimeLabel.astro");

    expect(label).toContain("readingTime.labelZh");
    expect(label).toContain('aria-hidden="true"');
    expect(label).toContain('lang="en"');
    expect(label).toContain("readingTime.labelEn");
  });

  it.each([
    "../src/components/DiscoveryPostList.astro",
    "../src/components/PostListPage.astro",
    "../src/components/PostDetailPage.astro",
  ])("uses the shared label in %s", (path) => {
    const source = readSource(path);

    expect(source).toContain("ReadingTimeLabel");
    expect(source).toContain("<ReadingTimeLabel");
  });

  it("keeps the live editor preview labels in separate language nodes", () => {
    const form = readSource("../src/components/studio/EditorForm.astro");
    const client = readSource("../src/scripts/studio-editor.ts");

    expect(form).toContain("data-preview-reading-time-label");
    expect(form).toContain("data-preview-reading-time-label-en");
    expect(form).toMatch(
      /<span\s+lang="en"\s+data-preview-reading-time-label-en>/u,
    );
    expect(client).toContain('"[data-preview-reading-time-label]"');
    expect(client).toContain('"[data-preview-reading-time-label-en]"');
  });
});
