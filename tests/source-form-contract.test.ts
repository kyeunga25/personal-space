import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const sourcePage = readFileSync(
  new URL("../src/pages/studio/sources/index.astro", import.meta.url),
  "utf8",
);
const sourceClient = readFileSync(
  new URL("../src/scripts/studio-sources.ts", import.meta.url),
  "utf8",
);

describe("source form URL contracts", () => {
  it("explains the accepted URL policy beside the form", () => {
    expect(sourcePage).toContain('id="source-url-requirements"');
    expect(sourcePage).toContain("僅支援公開 HTTPS 網址");
    expect(sourcePage).toContain("Public HTTPS URLs only");
    expect(sourcePage).toContain("2,048");
  });

  it("gives every new and saved URL field the shared browser contract", () => {
    expect(sourcePage).toContain(
      'import { PUBLIC_HTTPS_URL_MAX_LENGTH } from "../../../lib/public-https-url";',
    );
    expect(sourcePage.match(/data-source-url/g)).toHaveLength(12);
    expect(
      sourcePage.match(/maxlength=\{PUBLIC_HTTPS_URL_MAX_LENGTH\}/g),
    ).toHaveLength(6);
    expect(sourcePage.match(/inputmode="url"/g)).toHaveLength(6);
    expect(
      sourcePage.match(/aria-describedby="source-url-requirements"/g),
    ).toHaveLength(6);
    expect(sourcePage.match(/data-source-url-error/g)).toHaveLength(6);
  });

  it("sets native validity and exposes immediate inline errors", () => {
    expect(sourceClient).toContain("getSourceUrlValidationMessage");
    expect(sourceClient).toContain('"[data-source-url]"');
    expect(sourceClient).toContain("input.setCustomValidity(message)");
    expect(sourceClient).toContain(
      'input.setAttribute("aria-invalid", "true")',
    );
    expect(sourceClient).toContain('input.removeAttribute("aria-invalid")');
    expect(sourceClient).toContain('"[data-source-url-error]"');
  });
});
