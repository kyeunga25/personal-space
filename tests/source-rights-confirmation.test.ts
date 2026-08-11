import { describe, expect, it } from "vitest";

import { invalidateSourceRightsConfirmation } from "../src/scripts/source-rights-confirmation";

describe("source rights confirmation", () => {
  it.each(["feedUrl", "siteUrl", "termsUrl", "rightsBasis"])(
    "revokes an existing confirmation after %s changes",
    (fieldName) => {
      const confirmation = { checked: true };

      expect(invalidateSourceRightsConfirmation(fieldName, confirmation)).toBe(
        true,
      );
      expect(confirmation.checked).toBe(false);
    },
  );

  it.each(["name", "reviewNotes", "reviewStatus", "status", "rightsConfirmed"])(
    "keeps the confirmation after non-evidence field %s changes",
    (fieldName) => {
      const confirmation = { checked: true };

      expect(invalidateSourceRightsConfirmation(fieldName, confirmation)).toBe(
        false,
      );
      expect(confirmation.checked).toBe(true);
    },
  );

  it("does not report a second revocation when already unchecked", () => {
    const confirmation = { checked: false };

    expect(invalidateSourceRightsConfirmation("termsUrl", confirmation)).toBe(
      false,
    );
    expect(confirmation.checked).toBe(false);
  });
});
