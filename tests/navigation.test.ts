import { describe, expect, it } from "vitest";

import {
  mobileNavigation,
  primaryNavigation,
  profileNavigation,
} from "../src/config/navigation";
import {
  archivePeriod,
  buildPostTaxonomyLinks,
  isActivePath,
  readableSlug,
  studioNavigationItemIsActive,
  taxonomyHref,
} from "../src/lib/navigation";

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

  it.each([
    [null, null, "all"],
    ["2026", null, "year"],
    ["2026", "2026-08", "month"],
  ] as const)(
    "identifies archive state for year %s and month %s",
    (year, month, expected) => {
      expect(archivePeriod(year, month)).toBe(expected);
    },
  );

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

  it("uses canonical profile destinations without a false home selection", () => {
    expect(profileNavigation.map(({ href }) => href)).toEqual([
      "/notes",
      "/articles",
      "/editions",
    ]);
    expect(
      profileNavigation.filter(({ href }) => isActivePath("/", href)),
    ).toEqual([]);
    expect(
      profileNavigation
        .filter(({ href }) => isActivePath("/articles/example", href))
        .map(({ href }) => href),
    ).toEqual(["/articles"]);
  });

  it.each([
    ["/studio/posts/note-id", "note", ["note"]],
    ["/studio/posts/article-id", "article", ["article"]],
    ["/studio/posts/missing", null, []],
    ["/studio/notes/new", null, ["note"]],
    ["/studio/articles/new", null, ["article"]],
    ["/studio/sources", null, ["sources"]],
    ["/studio/editions/example", null, ["editions"]],
    ["/studio", null, ["dashboard"]],
  ] as const)(
    "marks the correct Studio item for %s with content kind %s",
    (pathname, contentKind, expected) => {
      const items = [
        "dashboard",
        "note",
        "article",
        "sources",
        "editions",
        "media",
      ] as const;
      const active = items.filter((item) =>
        studioNavigationItemIsActive(item, pathname, contentKind),
      );

      expect(active).toEqual(expected);
      expect(active).toHaveLength(expected.length);
    },
  );

  it("keeps profile labels bilingual", () => {
    for (const item of profileNavigation) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.labelEn.trim().length).toBeGreaterThan(0);
    }
  });

  it("turns public slugs into readable labels", () => {
    expect(readableSlug("cloudflare-workers")).toBe("Cloudflare Workers");
  });

  it.each([
    [
      "category",
      "cloud / 香港",
      "/categories/cloud%20%2F%20%E9%A6%99%E6%B8%AF",
    ],
    ["tag", "繁體中文", "/tags/%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87"],
  ] as const)("builds an encoded %s destination", (kind, slug, href) => {
    expect(taxonomyHref(kind, slug)).toBe(href);
  });

  it.each(["", "   ", " padded "])(
    "fails closed for an invalid taxonomy slug %j",
    (slug) => {
      expect(taxonomyHref("tag", slug)).toBeNull();
    },
  );

  it("builds consistent category and tag navigation for public cards", () => {
    expect(
      buildPostTaxonomyLinks({ name: "雲端", slug: "cloud / 香港" }, [
        { name: "繁體中文", slug: "繁體中文" },
        { name: "無效", slug: " padded " },
      ]),
    ).toEqual([
      {
        accessibleLabel: "分類：雲端 · Category: 雲端",
        href: "/categories/cloud%20%2F%20%E9%A6%99%E6%B8%AF",
        kind: "category",
        label: "雲端",
      },
      {
        accessibleLabel: "標籤：繁體中文 · Tag: 繁體中文",
        href: "/tags/%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87",
        kind: "tag",
        label: "#繁體中文",
      },
      {
        accessibleLabel: "標籤：無效 · Tag: 無效",
        href: null,
        kind: "tag",
        label: "#無效",
      },
    ]);
  });

  it("returns an empty taxonomy model when a post has no terms", () => {
    expect(buildPostTaxonomyLinks(null, [])).toEqual([]);
  });
});
