import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readingPage = readFileSync(
  new URL("../src/components/PostDetailPage.astro", import.meta.url),
  "utf8",
);

describe("public reading layout contracts", () => {
  it("matches note and article type colors used in public lists", () => {
    expect(readingPage).toMatch(
      /\.reading-header__kind\s*\{[^}]*color:\s*var\(--space-primary-strong\);/su,
    );
    expect(readingPage).toMatch(
      /\.reading-page--article \.reading-header__kind\s*\{[^}]*color:\s*var\(--space-blue-strong\);/su,
    );
  });

  it("wraps long titles and body text without widening the page", () => {
    expect(readingPage).toMatch(
      /\.reading-page\s*\{[^}]*overflow-wrap:\s*anywhere;/su,
    );
  });

  it("keeps preformatted code independently scrollable", () => {
    expect(readingPage).toMatch(
      /\.reading-body :global\(pre\)\s*\{[^}]*overflow-x:\s*auto;/su,
    );
  });
});
