import { getReadingTime } from "../lib/reading-time";
import { createSlug } from "../server/publishing/slug";
import { parseEditorTags } from "./editor-input";

export type PreviewContentKind = "article" | "note";

export interface PreviewHeaderInput {
  excerpt: string;
  kind: PreviewContentKind;
  title: string;
}

export interface PreviewHeaderContent {
  excerpt: string;
  showExcerpt: boolean;
  title: string;
}

export interface PreviewReadingTimeContent {
  label: string;
  labelEn: string;
  show: boolean;
}

interface PreviewTextOutput {
  textContent: string | null;
}

interface PreviewExcerptOutput extends PreviewTextOutput {
  hidden: boolean | string;
}

interface PreviewReadingTimeOutput {
  container: { hidden: boolean | string };
  label: PreviewTextOutput;
  labelEn: PreviewTextOutput;
}

export interface PreviewHeaderOutput {
  excerpt: PreviewExcerptOutput;
  title: PreviewTextOutput;
}

export interface PreviewTaxonomyContent {
  items: string[];
  show: boolean;
}

interface PreviewTaxonomyOutput {
  container: { hidden: boolean | string };
  items: PreviewTextOutput;
}

export function getPreviewHeaderContent({
  excerpt,
  kind,
  title,
}: PreviewHeaderInput): PreviewHeaderContent {
  const normalizedExcerpt = excerpt.trim();
  const normalizedTitle = title.trim();
  const showExcerpt = Boolean(normalizedTitle && normalizedExcerpt);

  return {
    excerpt: showExcerpt ? normalizedExcerpt : "",
    showExcerpt,
    title:
      normalizedTitle ||
      normalizedExcerpt ||
      (kind === "article"
        ? "未命名文章 · Untitled article"
        : "無標題筆記 · Untitled note"),
  };
}

export function updatePreviewHeaderOutput(
  output: PreviewHeaderOutput,
  input: PreviewHeaderInput,
): void {
  const content = getPreviewHeaderContent(input);
  output.title.textContent = content.title;
  output.excerpt.textContent = content.excerpt;
  output.excerpt.hidden = !content.showExcerpt;
}

export function getPreviewReadingTimeContent(
  kind: PreviewContentKind,
  body: string,
): PreviewReadingTimeContent {
  if (kind === "note") return { label: "", labelEn: "", show: false };
  const readingTime = getReadingTime(body);
  return {
    label: readingTime.labelZh,
    labelEn: readingTime.labelEn,
    show: true,
  };
}

export function updatePreviewReadingTimeOutput(
  output: PreviewReadingTimeOutput,
  kind: PreviewContentKind,
  body: string,
): void {
  const content = getPreviewReadingTimeContent(kind, body);
  output.label.textContent = content.label;
  output.labelEn.textContent = content.labelEn;
  output.container.hidden = !content.show;
}

export function getPreviewTaxonomyContent(
  category: string,
  tagsInput: string,
): PreviewTaxonomyContent {
  const items: string[] = [];
  const normalizedCategory = category.trim();
  if (normalizedCategory && createSlug(normalizedCategory)) {
    items.push(normalizedCategory);
  }

  const tagsBySlug = new Map<string, string>();
  for (const tag of parseEditorTags(tagsInput)) {
    const slug = createSlug(tag);
    if (slug) tagsBySlug.set(slug, tag);
  }
  for (const tag of tagsBySlug.values()) items.push(`#${tag}`);

  return { items, show: items.length > 0 };
}

export function updatePreviewTaxonomyOutput(
  output: PreviewTaxonomyOutput,
  content: PreviewTaxonomyContent,
): void {
  output.items.textContent = content.items.join(" · ");
  output.container.hidden = !content.show;
}
