export const MEDIA_UPLOAD_LIMITS = {
  altText: 240,
  fileBytes: 5 * 1024 * 1024,
  imageDimension: 6000,
} as const;

export const MEDIA_UPLOAD_MIME_TYPES = ["image/png", "image/jpeg"] as const;

export type MediaUploadMimeType = (typeof MEDIA_UPLOAD_MIME_TYPES)[number];

export function isMediaUploadMimeType(
  value: string,
): value is MediaUploadMimeType {
  return MEDIA_UPLOAD_MIME_TYPES.some((mimeType) => mimeType === value);
}
