export type StudioNotFoundKind = "post";

interface StudioNotFoundCopy {
  backHref: string;
  backLabel: string;
  backLabelEn: string;
  createHref: string;
  createLabel: string;
  createLabelEn: string;
  description: string;
  descriptionEn: string;
  heading: string;
  headingEn: string;
  title: string;
  titleEn: string;
}

const COPY: Record<StudioNotFoundKind, StudioNotFoundCopy> = {
  post: {
    backHref: "/studio/posts",
    backLabel: "返回內容列表",
    backLabelEn: "Back to content",
    createHref: "/studio/posts/new",
    createLabel: "新增內容",
    createLabelEn: "New content",
    description: "無法開啟這個內容位置。你可以返回列表，或建立新的內容。",
    descriptionEn:
      "This content address could not be opened. Return to the list or create something new.",
    heading: "找不到這項內容。",
    headingEn: "This content could not be found.",
    title: "找不到內容",
    titleEn: "Content not found",
  },
};

export function studioNotFoundCopy(
  kind: StudioNotFoundKind,
): StudioNotFoundCopy {
  return COPY[kind];
}
