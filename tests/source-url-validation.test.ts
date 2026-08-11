import { describe, expect, it } from "vitest";

import { PUBLIC_HTTPS_URL_MAX_LENGTH } from "../src/lib/public-https-url";
import { getSourceUrlValidationMessage } from "../src/scripts/source-url-validation";

describe("source URL validation messages", () => {
  it.each(["", "   ", "https://example.com/feed.xml"])(
    "does not replace native required validation for an empty or valid value: %s",
    (value) => {
      expect(getSourceUrlValidationMessage(value)).toBe("");
    },
  );

  it("explains malformed URLs in Traditional Chinese and English", () => {
    expect(getSourceUrlValidationMessage("not a URL")).toBe(
      "請輸入有效網址。 Enter a valid URL.",
    );
  });

  it("explains the public HTTPS requirement without waiting for the server", () => {
    expect(getSourceUrlValidationMessage("http://localhost/feed.xml")).toBe(
      "只支援公開 HTTPS 網址，不可包含登入資料、私人主機或非標準連接埠。 Use a public HTTPS URL without credentials, private hosts, or non-standard ports.",
    );
  });

  it("shows the shared length limit", () => {
    const overlong = `https://example.com/${"a".repeat(
      PUBLIC_HTTPS_URL_MAX_LENGTH,
    )}`;

    expect(getSourceUrlValidationMessage(overlong)).toBe(
      "網址不可超過 2,048 個字元。 URL must be 2,048 characters or fewer.",
    );
  });
});
