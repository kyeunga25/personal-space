export const PROTECTED_PATH_PREFIXES = [
  "/studio",
  "/private",
  "/api/studio",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
