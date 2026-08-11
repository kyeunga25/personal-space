import { getPostContentReadinessError } from "../config/publishing";
import { getReadingTime } from "../lib/reading-time";

type PostKind = "article" | "note";
type PostVisibility = "private" | "public" | "unlisted";

export interface PostVisibilitySummary {
  effect: string;
  label: string;
  visibility: PostVisibility;
}

interface PublishConfirmationInput {
  bodyMd: string;
  kind: string;
  title: string;
  visibility: string;
}

interface PublishConfirmation {
  effect: string;
  readiness: string;
  title: string;
  visibility: string;
}

interface TextTarget {
  textContent: string | null;
}

interface PublishConfirmationTargets {
  effect: TextTarget;
  readiness: TextTarget;
  title: TextTarget;
  visibility: TextTarget;
}

interface AttributeTarget {
  setAttribute(name: string, value: string): void;
}

interface PostVisibilitySummaryTargets {
  container: AttributeTarget;
  effect: TextTarget;
  label: TextTarget;
}

const VISIBILITY_SUMMARIES: Record<
  PostVisibility,
  Pick<PublishConfirmation, "effect" | "visibility">
> = {
  private: {
    effect:
      "只限 Studio，不會出現在公開網站。 Studio only; not available on the public site.",
    visibility: "私人 · Private",
  },
  public: {
    effect:
      "會立即出現在公開網站及適用的列表。 Immediately available on the public site and eligible listings.",
    visibility: "公開 · Public",
  },
  unlisted: {
    effect:
      "可經精確連結讀取，但不會出現在列表或搜尋。 Available by exact link, but omitted from listings and search.",
    visibility: "不公開列出 · Unlisted",
  },
};

function isPostKind(value: string): value is PostKind {
  return value === "article" || value === "note";
}

function isPostVisibility(value: string): value is PostVisibility {
  return value === "private" || value === "public" || value === "unlisted";
}

export const PUBLISH_CONFIRMATION_STATE_ERROR =
  "發佈設定不完整，請重新整理後再試。 Publish settings are incomplete; reload and try again.";

export function getPostVisibilitySummary(
  value: string,
): PostVisibilitySummary | null {
  if (!isPostVisibility(value)) return null;

  const summary = VISIBILITY_SUMMARIES[value];
  return {
    effect: summary.effect,
    label: summary.visibility,
    visibility: value,
  };
}

export function getPublishReadinessError({
  bodyMd,
  kind,
  title,
  visibility,
}: PublishConfirmationInput): string | null {
  if (!isPostKind(kind) || !isPostVisibility(visibility)) {
    return PUBLISH_CONFIRMATION_STATE_ERROR;
  }
  return getPostContentReadinessError({ bodyMd, kind, title });
}

export function buildPublishConfirmation({
  bodyMd,
  kind,
  title,
  visibility,
}: PublishConfirmationInput): PublishConfirmation | null {
  if (getPublishReadinessError({ bodyMd, kind, title, visibility })) {
    return null;
  }
  const summary = getPostVisibilitySummary(visibility);
  if (!isPostKind(kind) || !summary) return null;

  return {
    effect: summary.effect,
    readiness:
      kind === "article"
        ? `內容已準備 · Content ready · ${getReadingTime(bodyMd).label}`
        : "內容已準備 · Content ready",
    title: title.trim() || "無標題筆記 · Untitled note",
    visibility: summary.label,
  };
}

export function updatePostVisibilitySummary(
  targets: PostVisibilitySummaryTargets,
  value: string,
): boolean {
  const summary = getPostVisibilitySummary(value);
  if (!summary) return false;

  targets.effect.textContent = summary.effect;
  targets.label.textContent = summary.label;
  targets.container.setAttribute("data-visibility", summary.visibility);
  return true;
}

export function updatePostVisibilityEffect(
  target: TextTarget,
  value: string,
): boolean {
  const summary = getPostVisibilitySummary(value);
  if (!summary) return false;
  target.textContent = summary.effect;
  return true;
}

export function updatePublishConfirmation(
  targets: PublishConfirmationTargets,
  input: PublishConfirmationInput,
): boolean {
  const confirmation = buildPublishConfirmation(input);
  if (!confirmation) return false;

  targets.effect.textContent = confirmation.effect;
  targets.readiness.textContent = confirmation.readiness;
  targets.title.textContent = confirmation.title;
  targets.visibility.textContent = confirmation.visibility;
  return true;
}
