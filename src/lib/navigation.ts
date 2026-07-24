function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;

  return pathname.replace(/\/+$/, "");
}

export function isActivePath(pathname: string, href: string): boolean {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (targetPath === "/") return currentPath === targetPath;

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function readableSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
