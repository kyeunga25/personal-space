import {
  ARTICLE_TITLE_REQUIRED_ERROR,
  POST_CONTENT_REQUIRED_ERROR,
  POST_INPUT_LIMITS,
} from "../config/publishing";
import { getReadingTime } from "../lib/reading-time";
import { createSlug } from "../server/publishing/slug";

export const EDITOR_TAGS_ERROR =
  `標籤最多 ${String(POST_INPUT_LIMITS.tags)} 個，每個不可超過 ${String(POST_INPUT_LIMITS.tag)} 個字元。 ` +
  `Use up to ${String(POST_INPUT_LIMITS.tags)} tags, with no more than ${String(POST_INPUT_LIMITS.tag)} characters each.`;

export const EDITOR_TAGS_INPUT_MAX_LENGTH =
  POST_INPUT_LIMITS.tags * POST_INPUT_LIMITS.tag +
  (POST_INPUT_LIMITS.tags - 1) * 2;

export interface EditorCharacterCount {
  current: number;
  label: string;
  remaining: number;
  state: "limit" | "near" | "normal";
}

export interface EditorBodyFeedbackInput {
  bodyMd: string;
  kind: string;
}

export interface EditorBodyFeedback {
  label: string;
  state: "ready" | "required";
}

export interface EditorCategoryFeedback {
  label: string;
  state: "empty" | "invalid" | "normal";
}

export interface EditorExcerptFeedback {
  label: string;
  state: "empty" | "ready";
}

export interface EditorHeadingInput {
  kind: string;
  title: string;
}

export interface EditorTagsFeedback {
  label: string;
  state: "empty" | "invalid" | "normal" | "notice";
}

export interface EditorTitleFeedback {
  label: string;
  state: "optional" | "ready" | "required";
}

export interface EditorSlugFeedbackInput {
  originalSlug: string;
  slug: string;
  title: string;
}

export interface EditorSlugFeedback {
  label: string;
  state: "automatic" | "changed" | "normal";
}

interface EditorTextTarget {
  textContent: string | null;
}

interface EditorFeedbackTarget extends EditorTextTarget {
  dataset: { state?: string | undefined };
}

export function getEditorHeading({
  kind,
  title,
}: EditorHeadingInput): string | null {
  const normalizedTitle = title.trim();
  if (kind === "article") return normalizedTitle || "未命名文章";
  if (kind === "note") return normalizedTitle || "快速筆記";
  return null;
}

export function getEditorAutofocusTarget(
  kind: string,
  isNew: boolean,
): "bodyMd" | "title" | null {
  if (!isNew) return null;
  if (kind === "article") return "title";
  if (kind === "note") return "bodyMd";
  return null;
}

export function getEditorBodyFeedback({
  bodyMd,
  kind,
}: EditorBodyFeedbackInput): EditorBodyFeedback | null {
  if (kind !== "article" && kind !== "note") return null;
  if (!bodyMd.trim()) {
    return {
      label:
        "草稿可先留空。 Drafts may be saved empty. " +
        POST_CONTENT_REQUIRED_ERROR,
      state: "required",
    };
  }
  if (kind === "article") {
    return {
      label:
        `正文已填寫；公開文章會顯示「${getReadingTime(bodyMd).label}」。 ` +
        "Body added; public articles show this reading time.",
      state: "ready",
    };
  }
  return {
    label:
      "正文已填寫；公開筆記維持精簡，不顯示閱讀時間。 Body added; public notes stay compact without reading time.",
    state: "ready",
  };
}

export function getEditorTitleFeedback({
  kind,
  title,
}: EditorHeadingInput): EditorTitleFeedback | null {
  if (kind === "article") {
    return title.trim()
      ? {
          label: "文章標題已填寫。 Article title is ready.",
          state: "ready",
        }
      : {
          label:
            "草稿可先留空。 Drafts may be saved without a title. " +
            ARTICLE_TITLE_REQUIRED_ERROR,
          state: "required",
        };
  }
  if (kind === "note") {
    return title.trim()
      ? {
          label:
            "此標題會顯示於筆記列表及頁面。 This title appears in note listings and on the note page.",
          state: "ready",
        }
      : {
          label:
            "選填；留空時會以正文自動摘要作為公開標題。 Optional; the generated body excerpt becomes the public title.",
          state: "optional",
        };
  }
  return null;
}

export function getEditorCharacterCount(
  value: string,
  limit: number,
): EditorCharacterCount {
  const normalizedLimit = Math.max(1, Math.trunc(limit));
  const current = value.length;
  const remaining = Math.max(normalizedLimit - current, 0);
  const base =
    `字元 Characters：${current.toLocaleString("en-US")} / ` +
    normalizedLimit.toLocaleString("en-US");
  if (remaining === 0) {
    return {
      current,
      label: `${base} · 已達上限 Limit reached`,
      remaining,
      state: "limit",
    };
  }
  if (current >= Math.ceil(normalizedLimit * 0.9)) {
    return {
      current,
      label: `${base} · 剩餘 Remaining：` + remaining.toLocaleString("en-US"),
      remaining,
      state: "near",
    };
  }
  return { current, label: base, remaining, state: "normal" };
}

export function parseEditorTags(value: string): string[] {
  const tags = value
    .split(/[,，]/u)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (
    tags.length > POST_INPUT_LIMITS.tags ||
    tags.some((tag) => tag.length > POST_INPUT_LIMITS.tag)
  ) {
    throw new Error(EDITOR_TAGS_ERROR);
  }

  return tags;
}

export function getEditorCategoryFeedback(
  value: string,
): EditorCategoryFeedback {
  const category = value.trim();
  if (!category) {
    return { label: "分類 Category：未設定 None", state: "empty" };
  }
  if (!createSlug(category)) {
    return {
      label:
        "無法識別此分類，儲存時會視為未分類。 This category is not recognized and will be saved as uncategorized.",
      state: "invalid",
    };
  }
  return { label: `將使用分類 Category：${category}`, state: "normal" };
}

export function getEditorExcerptFeedback(value: string): EditorExcerptFeedback {
  return value.trim()
    ? {
        label:
          "將顯示於文章列表、搜尋結果、文章頁與 RSS。 Shown in article lists, search results, the article page, and RSS.",
        state: "ready",
      }
    : {
        label:
          "選填；留空時儲存會從正文自動產生摘要。 Optional; when saved, a summary is generated from the body.",
        state: "empty",
      };
}

export function getEditorTagsFeedback(value: string): EditorTagsFeedback {
  let tags: string[];
  try {
    tags = parseEditorTags(value);
  } catch {
    return { label: EDITOR_TAGS_ERROR, state: "invalid" };
  }

  const recognizedSlugs = new Set<string>();
  let ignored = 0;
  for (const tag of tags) {
    const slug = createSlug(tag);
    if (!slug || recognizedSlugs.has(slug)) {
      ignored += 1;
      continue;
    }
    recognizedSlugs.add(slug);
  }

  const recognized = recognizedSlugs.size;
  if (recognized === 0 && ignored === 0) {
    return {
      label: `標籤 Tags：0 / ${String(POST_INPUT_LIMITS.tags)}`,
      state: "empty",
    };
  }

  const base =
    `已識別 Recognized：${String(recognized)} / ` +
    String(POST_INPUT_LIMITS.tags);
  return ignored > 0
    ? {
        label: `${base} · 將忽略 Ignored：${String(ignored)}`,
        state: "notice",
      }
    : { label: base, state: "normal" };
}

export function getEditorSlugFeedback({
  originalSlug,
  slug,
  title,
}: EditorSlugFeedbackInput): EditorSlugFeedback {
  const original = createSlug(originalSlug);
  const requested = slug.trim();
  const candidate = createSlug(requested || title);

  if (!candidate) {
    return original
      ? {
          label:
            "將改用系統自動代稱；已分享的舊連結不會自動轉址。 A system slug will replace the current path; shared existing links will not redirect.",
          state: "changed",
        }
      : {
          label:
            "系統會在需要公開路徑時自動建立網址。 A URL will be generated when a public path is needed.",
          state: "automatic",
        };
  }

  const path = `/articles/${candidate}`;
  if (original && candidate !== original) {
    return {
      label:
        `新網址路徑預覽 New URL path preview：${path} · ` +
        "已分享的舊連結不會自動轉址 Shared existing links will not redirect.",
      state: "changed",
    };
  }
  return requested
    ? { label: `網址路徑預覽 URL path preview：${path}`, state: "normal" }
    : {
        label: `自動網址路徑預覽 Automatic URL path preview：${path}`,
        state: "automatic",
      };
}

export function updateEditorSlugFeedback(
  target: EditorFeedbackTarget,
  input: EditorSlugFeedbackInput,
): void {
  const feedback = getEditorSlugFeedback(input);
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
}

export function updateEditorCategoryFeedback(
  target: EditorFeedbackTarget,
  value: string,
): void {
  const feedback = getEditorCategoryFeedback(value);
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
}

export function updateEditorExcerptFeedback(
  target: EditorFeedbackTarget,
  value: string,
): void {
  const feedback = getEditorExcerptFeedback(value);
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
}

export function updateEditorHeading(
  target: EditorTextTarget,
  input: EditorHeadingInput,
): boolean {
  const heading = getEditorHeading(input);
  if (!heading) return false;
  target.textContent = heading;
  return true;
}

export function updateEditorBodyFeedback(
  target: EditorFeedbackTarget,
  input: EditorBodyFeedbackInput,
): boolean {
  const feedback = getEditorBodyFeedback(input);
  if (!feedback) return false;
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
  return true;
}

export function updateEditorTitleFeedback(
  target: EditorFeedbackTarget,
  input: EditorHeadingInput,
): boolean {
  const feedback = getEditorTitleFeedback(input);
  if (!feedback) return false;
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
  return true;
}

export function updateEditorTagsFeedback(
  target: EditorFeedbackTarget,
  value: string,
): void {
  const feedback = getEditorTagsFeedback(value);
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
}
