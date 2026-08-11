import { describe, expect, it } from "vitest";

import { publicNotFoundCopy } from "../src/lib/not-found";

describe("public not-found copy", () => {
  it.each([
    ["note", "/notes", "筆記", "Note"],
    ["article", "/articles", "文章", "Article"],
    ["edition", "/editions", "Edition", "Edition"],
    ["page", "/", "頁面", "page"],
  ] as const)(
    "keeps the %s recovery state bilingual without revealing visibility",
    (kind, backHref, chineseNoun, englishNoun) => {
      const copy = publicNotFoundCopy(kind);

      expect(copy.backHref).toBe(backHref);
      expect(copy.heading).toContain(chineseNoun);
      expect(copy.headingEn.toLowerCase()).toContain(englishNoun.toLowerCase());
      expect(copy.description).not.toMatch(/私人|未公開|尚未公開/);
      expect(copy.descriptionEn).not.toMatch(/private|unlisted|unpublished/i);
      expect(copy.description.trim()).not.toBe("");
      expect(copy.descriptionEn.trim()).not.toBe("");
    },
  );
});
