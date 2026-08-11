function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;

  return pathname.replace(/\/+$/, "");
}

export function archivePeriod(
  currentYear: string | null,
  currentMonth: string | null,
): "all" | "month" | "year" {
  if (currentMonth) return "month";
  return currentYear ? "year" : "all";
}

export function isActivePath(pathname: string, href: string): boolean {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (targetPath === "/") return currentPath === targetPath;

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export type StudioNavigationItem =
  "article" | "dashboard" | "editions" | "media" | "note" | "sources";

export function studioNavigationItemIsActive(
  item: StudioNavigationItem,
  pathname: string,
  contentKind: "article" | "note" | null = null,
): boolean {
  const currentPath = normalizePath(pathname);
  const isPostEditor = currentPath.startsWith("/studio/posts/");

  switch (item) {
    case "dashboard":
      return currentPath === "/studio";
    case "note":
      return isPostEditor
        ? contentKind === "note"
        : isActivePath(currentPath, "/studio/notes");
    case "article":
      return isPostEditor
        ? contentKind === "article"
        : isActivePath(currentPath, "/studio/articles");
    case "sources":
      return isActivePath(currentPath, "/studio/sources");
    case "editions":
      return isActivePath(currentPath, "/studio/editions");
    case "media":
      return false;
  }
}

export function readableSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function taxonomyHref(
  kind: "category" | "tag",
  slug: string,
): string | null {
  if (!slug || slug !== slug.trim()) return null;
  const collection = kind === "category" ? "categories" : "tags";
  return `/${collection}/${encodeURIComponent(slug)}`;
}

interface TaxonomyTerm {
  name: string;
  slug: string;
}

export interface PostTaxonomyLink {
  accessibleLabel: string;
  href: string | null;
  kind: "category" | "tag";
  label: string;
}

export function buildPostTaxonomyLinks(
  category: TaxonomyTerm | null,
  tags: readonly TaxonomyTerm[],
): PostTaxonomyLink[] {
  const links: PostTaxonomyLink[] = [];
  if (category) {
    links.push({
      accessibleLabel: `分類：${category.name} · Category: ${category.name}`,
      href: taxonomyHref("category", category.slug),
      kind: "category",
      label: category.name,
    });
  }
  for (const tag of tags) {
    links.push({
      accessibleLabel: `標籤：${tag.name} · Tag: ${tag.name}`,
      href: taxonomyHref("tag", tag.slug),
      kind: "tag",
      label: `#${tag.name}`,
    });
  }
  return links;
}
