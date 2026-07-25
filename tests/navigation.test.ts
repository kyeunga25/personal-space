import { describe, expect, it } from "vitest";

import { mobileNavigation, primaryNavigation } from "../src/config/navigation";
import { isActivePath, readableSlug } from "../src/lib/navigation";

describe("navigation helpers", () => {
  it("matches the home route exactly", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/stream", "/")).toBe(false);
  });

  it("matches nested paths without prefix collisions", () => {
    expect(isActivePath("/articles/example", "/articles")).toBe(true);
    expect(isActivePath("/article", "/articles")).toBe(false);
  });

  it("normalizes trailing slashes", () => {
    expect(isActivePath("/stream/", "/stream")).toBe(true);
  });

  it("keeps primary routes unique", () => {
    const hrefs = primaryNavigation.map(({ href }) => href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("provides Traditional Chinese and English navigation labels", () => {
    for (const item of primaryNavigation) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.labelEn.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the five primary mobile destinations in display order", () => {
    expect(mobileNavigation.map(({ href }) => href)).toEqual([
      "/",
      "/notes",
      "/articles",
      "/stream",
      "/search",
    ]);
  });

  it("turns public slugs into readable labels", () => {
    expect(readableSlug("cloudflare-workers")).toBe("Cloudflare Workers");
  });
});
