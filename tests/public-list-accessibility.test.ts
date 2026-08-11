import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const components = [
  {
    kindExpression: "post.kind",
    rowClass: "discovery-row",
    source: new URL(
      "../src/components/DiscoveryPostList.astro",
      import.meta.url,
    ),
  },
  {
    kindExpression: "kind",
    rowClass: "post-row",
    source: new URL("../src/components/PostListPage.astro", import.meta.url),
  },
] as const;

const taxonomyRenderers = [
  {
    name: "discovery list",
    source: new URL(
      "../src/components/DiscoveryPostList.astro",
      import.meta.url,
    ),
  },
  {
    name: "dedicated list",
    source: new URL("../src/components/PostListPage.astro", import.meta.url),
  },
  {
    name: "detail page",
    source: new URL("../src/components/PostDetailPage.astro", import.meta.url),
  },
] as const;

describe("public list accessibility contracts", () => {
  it.each(components)(
    "wraps long content inside .$rowClass",
    ({ rowClass, source }) => {
      const component = readFileSync(source, "utf8");
      const rowSelector = new RegExp(
        `\\.${rowClass}\\s*\\{[^}]*overflow-wrap:\\s*anywhere;`,
        "su",
      );

      expect(component).toMatch(rowSelector);
    },
  );

  it.each(components)(
    "marks English content-type text separately in .$rowClass",
    ({ kindExpression, rowClass, source }) => {
      const component = readFileSync(source, "utf8");

      expect(component).not.toContain("筆記 Note");
      expect(component).not.toContain("文章 Article");
      expect(component).toContain(
        `{${kindExpression} === "note" ? "筆記" : "文章"}`,
      );
      expect(component).toMatch(
        new RegExp(
          `<span lang="en">\\s*\\{${kindExpression.replace(".", "\\.")} === "note" \\? "Note" : "Article"\\}\\s*<\\/span>`,
          "u",
        ),
      );
      expect(component).toMatch(
        new RegExp(
          `\\.${rowClass}__kind span\\s*\\{[^}]*margin-left:\\s*0\\.35em;`,
          "su",
        ),
      );
    },
  );

  it.each(components)(
    "pairs hover and keyboard focus feedback for .$rowClass",
    ({ rowClass, source }) => {
      const component = readFileSync(source, "utf8");
      const interactionSelector = new RegExp(
        `\\.${rowClass}:hover,\\s*\\.${rowClass}:focus-within\\s*\\{`,
      );
      const articleSelector = new RegExp(
        `\\.${rowClass}--article:hover,\\s*\\.${rowClass}--article:focus-within\\s*\\{`,
      );

      expect(component).toMatch(interactionSelector);
      expect(component).toMatch(articleSelector);
    },
  );

  it.each(taxonomyRenderers)(
    "names category and tag links in the $name",
    ({ source }) => {
      const component = readFileSync(source, "utf8");

      expect(component).toContain("aria-label={item.accessibleLabel}");
      expect(component).toContain('class="visually-hidden"');
      expect(component).toContain("{item.accessibleLabel}");
      expect(component).toContain('aria-hidden="true">{item.label}');
    },
  );
});
