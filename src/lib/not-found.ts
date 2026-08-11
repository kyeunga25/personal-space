export type PublicNotFoundKind = "article" | "edition" | "note" | "page";

interface PublicNotFoundCopy {
  backHref: string;
  backLabel: string;
  backLabelEn: string;
  description: string;
  descriptionEn: string;
  heading: string;
  headingEn: string;
  title: string;
  titleEn: string;
}

const COPY: Record<PublicNotFoundKind, PublicNotFoundCopy> = {
  article: {
    backHref: "/articles",
    backLabel: "返回文章",
    backLabelEn: "Back to Articles",
    description: "無法在這個公開位置找到文章；內容可能已移動或不存在。",
    descriptionEn:
      "The article could not be found at this public address; it may have moved or been removed.",
    heading: "找不到這篇文章。",
    headingEn: "This article could not be found.",
    title: "找不到文章",
    titleEn: "Article not found",
  },
  edition: {
    backHref: "/editions",
    backLabel: "返回 Editions",
    backLabelEn: "Back to Editions",
    description: "無法在這個公開位置找到這份 Edition；內容可能已移動或不存在。",
    descriptionEn:
      "The Edition could not be found at this public address; it may have moved or been removed.",
    heading: "找不到這份 Edition。",
    headingEn: "This Edition could not be found.",
    title: "找不到 Edition",
    titleEn: "Edition not found",
  },
  note: {
    backHref: "/notes",
    backLabel: "返回筆記",
    backLabelEn: "Back to Notes",
    description: "無法在這個公開位置找到筆記；內容可能已移動或不存在。",
    descriptionEn:
      "The note could not be found at this public address; it may have moved or been removed.",
    heading: "找不到這篇筆記。",
    headingEn: "This note could not be found.",
    title: "找不到筆記",
    titleEn: "Note not found",
  },
  page: {
    backHref: "/",
    backLabel: "返回首頁",
    backLabelEn: "Home",
    description: "頁面可能已移動，或者尚未存在。",
    descriptionEn: "The page may have moved, or it may not exist yet.",
    heading: "找不到這個頁面。",
    headingEn: "This page could not be found.",
    title: "找不到頁面",
    titleEn: "Not found",
  },
};

export function publicNotFoundCopy(
  kind: PublicNotFoundKind,
): PublicNotFoundCopy {
  return COPY[kind];
}
