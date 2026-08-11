import { POST_INPUT_LIMITS } from "../../config/publishing";
import type { PostKind, PostVisibility, SavePostInput } from "./domain";

export { POST_INPUT_LIMITS } from "../../config/publishing";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null | undefined {
  return value === null || typeof value === "string" ? value : undefined;
}

function isOptionalNullableString(value: unknown, limit: number): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= limit)
  );
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.length > POST_INPUT_LIMITS.tags ||
    value.some(
      (tag) => typeof tag !== "string" || tag.length > POST_INPUT_LIMITS.tag,
    )
  ) {
    return undefined;
  }
  return value as string[];
}

export function parseSavePostInput(value: unknown): SavePostInput | null {
  if (!isRecord(value)) return null;
  const actions = ["archive", "publish", "save", "schedule"] as const;
  const kinds: PostKind[] = ["article", "note"];
  const visibilities: PostVisibility[] = ["private", "public", "unlisted"];
  const tags = parseTags(value.tags);
  const optionalStrings = [
    [value.category, POST_INPUT_LIMITS.category],
    [value.excerpt, POST_INPUT_LIMITS.excerpt],
    [value.heroMediaId, POST_INPUT_LIMITS.heroMediaId],
    [value.scheduledAt, POST_INPUT_LIMITS.scheduledAt],
    [value.slug, POST_INPUT_LIMITS.slug],
    [value.title, POST_INPUT_LIMITS.title],
  ] as const;

  if (
    typeof value.action !== "string" ||
    !actions.includes(value.action as (typeof actions)[number]) ||
    typeof value.bodyMd !== "string" ||
    value.bodyMd.length > POST_INPUT_LIMITS.bodyMd ||
    typeof value.kind !== "string" ||
    !kinds.includes(value.kind as PostKind) ||
    typeof value.visibility !== "string" ||
    !visibilities.includes(value.visibility as PostVisibility) ||
    tags === undefined ||
    optionalStrings.some(
      ([item, limit]) => !isOptionalNullableString(item, limit),
    ) ||
    (value.id !== undefined &&
      (typeof value.id !== "string" ||
        value.id.length === 0 ||
        value.id.length > POST_INPUT_LIMITS.id))
  ) {
    return null;
  }

  return {
    action: value.action as SavePostInput["action"],
    bodyMd: value.bodyMd,
    category: optionalString(value.category),
    excerpt: optionalString(value.excerpt),
    heroMediaId: optionalString(value.heroMediaId),
    id: value.id,
    kind: value.kind as PostKind,
    scheduledAt: optionalString(value.scheduledAt),
    slug: optionalString(value.slug),
    tags,
    title: optionalString(value.title),
    visibility: value.visibility as PostVisibility,
  };
}
