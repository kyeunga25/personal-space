import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { EDITION_INPUT_LIMITS } from "../src/config/editions";

const editionPage = readFileSync(
  new URL("../src/pages/studio/editions/[id].astro", import.meta.url),
  "utf8",
);
const editionClient = readFileSync(
  new URL("../src/scripts/studio-edition.ts", import.meta.url),
  "utf8",
);
const editionInput = readFileSync(
  new URL("../src/server/editions/input.ts", import.meta.url),
  "utf8",
);

describe("Edition character count contracts", () => {
  it("defines one shared set of server and form limits", () => {
    expect(EDITION_INPUT_LIMITS).toEqual({
      annotation: 600,
      introMd: 5000,
      itemId: 100,
      items: 20,
      title: 180,
    });
    expect(editionInput).toContain(
      'import { EDITION_INPUT_LIMITS } from "../../config/editions";',
    );
    expect(editionPage).toContain(
      'import { EDITION_INPUT_LIMITS } from "../../../config/editions";',
    );
  });

  it("renders a labelled initial counter for every editable text field", () => {
    expect(editionPage).toContain("maxlength={EDITION_INPUT_LIMITS.title}");
    expect(editionPage).toContain("maxlength={EDITION_INPUT_LIMITS.introMd}");
    expect(editionPage).toContain(
      "maxlength={EDITION_INPUT_LIMITS.annotation}",
    );
    expect(editionPage.match(/data-edition-character-count/g)).toHaveLength(3);
    expect(editionPage).toContain("titleCount.label");
    expect(editionPage).toContain("introCount.label");
    expect(editionPage).toMatch(
      /getEditorCharacterCount\(\s*entry\.annotation,\s*EDITION_INPUT_LIMITS\.annotation,?\s*\)/u,
    );
    expect(editionPage).toContain('aria-describedby="edition-title-count"');
    expect(editionPage).toContain('aria-describedby="edition-intro-count"');
  });

  it("refreshes all counters on input using the shared count logic", () => {
    expect(editionClient).toContain("getEditorCharacterCount");
    expect(editionClient).toContain('"[data-edition-character-count]"');
    expect(editionClient).toContain(
      "editionForm.elements.namedItem(fieldName)",
    );
    expect(editionClient).toContain("target.textContent = count.label");
    expect(editionClient).toContain("target.dataset.state = count.state");
    expect(editionClient).toContain("updateEditionCharacterCounters()");
  });

  it("visually distinguishes counters near and at their limit", () => {
    expect(editionPage).toMatch(
      /\.edition-character-count\[data-state="near"\]/u,
    );
    expect(editionPage).toMatch(
      /\.edition-character-count\[data-state="limit"\]/u,
    );
  });
});
