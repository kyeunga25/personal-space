import type { PostKind, PostVisibility, SavePostInput } from "./domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | null | undefined {
  return value === null || typeof value === "string" ? value : undefined;
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    return undefined;
  }
  const tags: string[] = [];
  for (const tag of value as unknown[]) {
    if (typeof tag === "string") tags.push(tag);
  }
  return tags;
}

export function parseSavePostInput(value: unknown): SavePostInput | null {
  if (!isRecord(value)) return null;
  const actions = ["archive", "publish", "save", "schedule"] as const;
  const kinds: PostKind[] = ["article", "note"];
  const visibilities: PostVisibility[] = ["private", "public", "unlisted"];
  const tags = parseTags(value.tags);

  if (
    typeof value.action !== "string" ||
    !actions.includes(value.action as (typeof actions)[number]) ||
    typeof value.bodyMd !== "string" ||
    typeof value.kind !== "string" ||
    !kinds.includes(value.kind as PostKind) ||
    typeof value.visibility !== "string" ||
    !visibilities.includes(value.visibility as PostVisibility) ||
    tags === undefined
  ) {
    return null;
  }

  return {
    action: value.action as SavePostInput["action"],
    bodyMd: value.bodyMd,
    category: optionalString(value.category),
    excerpt: optionalString(value.excerpt),
    heroMediaId: optionalString(value.heroMediaId),
    id: typeof value.id === "string" ? value.id : undefined,
    kind: value.kind as PostKind,
    scheduledAt: optionalString(value.scheduledAt),
    slug: optionalString(value.slug),
    tags,
    title: optionalString(value.title),
    visibility: value.visibility as PostVisibility,
  };
}
