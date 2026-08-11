import { POST_INPUT_LIMITS } from "../config/publishing";
import { isMediaUploadMimeType, MEDIA_UPLOAD_LIMITS } from "../config/media";
import { requestApiResponse } from "./api-response";

export const MEDIA_UPLOAD_RESPONSE_ERROR =
  "圖片上傳失敗，請重新登入或稍後再試。 Image upload failed; sign in again or retry later.";
export const MEDIA_UPLOAD_REQUIRED_ERROR =
  "請先選擇圖片並填寫替代文字。 Choose an image and enter alt text first.";
export const MEDIA_UPLOAD_SIZE_ERROR =
  "圖片檔案大小不符合限制。 Image size is outside the allowed limit.";
export const MEDIA_UPLOAD_TYPE_ERROR =
  "只接受 PNG 或 JPEG 圖片。 Only PNG or JPEG images are accepted.";
const MEDIA_UPLOAD_ALT_TEXT_LIMIT_LABEL = String(MEDIA_UPLOAD_LIMITS.altText);
export const MEDIA_UPLOAD_ALT_TEXT_ERROR = `替代文字不可超過 ${MEDIA_UPLOAD_ALT_TEXT_LIMIT_LABEL} 個字元。 Alt text cannot exceed ${MEDIA_UPLOAD_ALT_TEXT_LIMIT_LABEL} characters.`;
export const MEDIA_UPLOAD_PENDING_STATE = "上傳中… Uploading…";
export const MEDIA_UPLOAD_SUCCESS_STATE =
  "圖片已上傳；儲存內容後連結。 Image uploaded; save the content to link it.";
export const MEDIA_UPLOAD_FAILED_STATE =
  "圖片未上傳；目前的封面連結未變更。 Image not uploaded; the current cover link is unchanged.";
export const MEDIA_UPLOAD_SUCCESS_TOAST =
  "圖片上傳完成，請儲存內容。 Image uploaded; save the content.";
export const MEDIA_CLEAR_STATE =
  "封面連結已清除；儲存後生效。 Cover link cleared; save to apply.";

interface MediaUploadControls {
  clearButton: { disabled: boolean };
  link: { value: string };
  saveState: { innerHTML: string };
  state: { textContent: string | null };
  uploadButton: { disabled: boolean };
}

export interface MediaPreview {
  altText: string;
  height: number;
  mediaId: string;
  width: number;
}

interface MediaPreviewImage {
  alt: string;
  height: number;
  removeAttribute(name: string): void;
  src: string;
  width: number;
}

interface MediaPreviewOutput {
  container: { hidden: boolean | string };
  image: MediaPreviewImage;
}

export interface ParsedMediaUploadResponse {
  mediaId: string;
  preview: MediaPreview | null;
}

interface BrowserMediaFile {
  size: number;
  type: string;
}

interface BrowserNamedMediaFile extends BrowserMediaFile {
  name: string;
}

export interface MediaSelectionFeedback {
  label: string;
  ready: boolean;
  state: "empty" | "invalid" | "needs-alt" | "ready";
}

interface MediaSelectionFeedbackTarget {
  dataset: { state?: string | undefined };
  textContent: string | null;
}

type PreparedMediaUploadSelection<T extends BrowserMediaFile> =
  { altText: string; file: T } | { error: string };

function formatMediaBytes(bytes: number): string {
  const mebibyte = 1024 * 1024;
  if (bytes >= mebibyte) return `${(bytes / mebibyte).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${String(bytes)} B`;
}

export function getMediaSelectionFeedback(
  file: BrowserNamedMediaFile | null | undefined,
  altText: string,
): MediaSelectionFeedback {
  if (!file) {
    return {
      label: "尚未選擇待上傳圖片。 No upload selected.",
      ready: false,
      state: "empty",
    };
  }
  if (file.size <= 0 || file.size > MEDIA_UPLOAD_LIMITS.fileBytes) {
    return {
      label: MEDIA_UPLOAD_SIZE_ERROR,
      ready: false,
      state: "invalid",
    };
  }
  if (!isMediaUploadMimeType(file.type)) {
    return {
      label: MEDIA_UPLOAD_TYPE_ERROR,
      ready: false,
      state: "invalid",
    };
  }

  const fileName = file.name.trim() || "未命名圖片 Unnamed image";
  const normalizedAltText = altText.trim();
  if (!normalizedAltText) {
    return {
      label: `已選擇 Selected：${fileName} · 請填寫替代文字 Add alt text`,
      ready: false,
      state: "needs-alt",
    };
  }
  if (normalizedAltText.length > MEDIA_UPLOAD_LIMITS.altText) {
    return {
      label: MEDIA_UPLOAD_ALT_TEXT_ERROR,
      ready: false,
      state: "invalid",
    };
  }
  return {
    label:
      `準備上傳 Ready to upload：${fileName} · ` + formatMediaBytes(file.size),
    ready: true,
    state: "ready",
  };
}

export function updateMediaSelectionFeedback(
  target: MediaSelectionFeedbackTarget,
  file: BrowserNamedMediaFile | null | undefined,
  altText: string,
): boolean {
  const feedback = getMediaSelectionFeedback(file, altText);
  target.textContent = feedback.label;
  target.dataset.state = feedback.state;
  return feedback.ready;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function prepareMediaUploadSelection<T extends BrowserMediaFile>(
  file: T | null | undefined,
  altText: string,
): PreparedMediaUploadSelection<T> {
  const normalizedAltText = altText.trim();
  if (!file || !normalizedAltText) {
    return { error: MEDIA_UPLOAD_REQUIRED_ERROR };
  }
  if (normalizedAltText.length > MEDIA_UPLOAD_LIMITS.altText) {
    return { error: MEDIA_UPLOAD_ALT_TEXT_ERROR };
  }
  if (file.size <= 0 || file.size > MEDIA_UPLOAD_LIMITS.fileBytes) {
    return { error: MEDIA_UPLOAD_SIZE_ERROR };
  }
  if (!isMediaUploadMimeType(file.type)) {
    return { error: MEDIA_UPLOAD_TYPE_ERROR };
  }
  return { altText: normalizedAltText, file };
}

export function parseMediaUploadResponse(
  value: unknown,
): ParsedMediaUploadResponse | null {
  if (!isRecord(value) || !isRecord(value.media)) return null;

  const id = value.media.id;
  if (typeof id !== "string") return null;

  const mediaId = id.trim();
  if (!mediaId || mediaId.length > POST_INPUT_LIMITS.heroMediaId) return null;

  const altText =
    typeof value.media.altText === "string" ? value.media.altText.trim() : "";
  const height = value.media.height;
  const width = value.media.width;
  const preview =
    altText.length > 0 &&
    altText.length <= MEDIA_UPLOAD_LIMITS.altText &&
    Number.isSafeInteger(height) &&
    Number(height) > 0 &&
    Number(height) <= MEDIA_UPLOAD_LIMITS.imageDimension &&
    Number.isSafeInteger(width) &&
    Number(width) > 0 &&
    Number(width) <= MEDIA_UPLOAD_LIMITS.imageDimension
      ? {
          altText,
          height: Number(height),
          mediaId,
          width: Number(width),
        }
      : null;

  return { mediaId, preview };
}

export function updateMediaPreviewOutput(
  output: MediaPreviewOutput,
  preview: MediaPreview | null,
): void {
  if (!preview) {
    output.container.hidden = true;
    output.image.alt = "";
    output.image.height = 0;
    output.image.width = 0;
    output.image.removeAttribute("src");
    return;
  }

  output.image.alt = preview.altText;
  output.image.height = preview.height;
  output.image.src = `/api/studio/media/${encodeURIComponent(preview.mediaId)}`;
  output.image.width = preview.width;
  output.container.hidden = false;
}

export async function applyMediaUploadRequest(
  controls: MediaUploadControls,
  request: () => Promise<Response>,
): Promise<ParsedMediaUploadResponse> {
  const originalUploadDisabled = controls.uploadButton.disabled;
  const originalClearDisabled = controls.clearButton.disabled;
  let uploadSucceeded = false;
  controls.uploadButton.disabled = true;
  controls.clearButton.disabled = true;
  controls.state.textContent = MEDIA_UPLOAD_PENDING_STATE;

  try {
    const result = await requestApiResponse(
      request,
      parseMediaUploadResponse,
      MEDIA_UPLOAD_RESPONSE_ERROR,
    );
    controls.link.value = result.mediaId;
    controls.clearButton.disabled = false;
    controls.saveState.innerHTML = '未儲存 <span lang="en">Unsaved</span>';
    controls.state.textContent = MEDIA_UPLOAD_SUCCESS_STATE;
    uploadSucceeded = true;
    return result;
  } catch (error) {
    controls.state.textContent = MEDIA_UPLOAD_FAILED_STATE;
    throw error;
  } finally {
    controls.uploadButton.disabled = originalUploadDisabled;
    if (!uploadSucceeded) {
      controls.clearButton.disabled = originalClearDisabled;
    }
  }
}
