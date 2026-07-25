import { UserFacingError } from "../errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 6000;

export interface ValidatedImage {
  extension: "jpg" | "png";
  height: number;
  mimeType: "image/jpeg" | "image/png";
  width: number;
}

function isPng(bytes: Uint8Array): boolean {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  return signature.every((value, index) => bytes[index] === value);
}

function readPngDimensions(bytes: Uint8Array): {
  height: number;
  width: number;
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function readJpegDimensions(
  bytes: Uint8Array,
): { height: number; width: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    if (marker === undefined) {
      return null;
    }
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }

    const segmentLength = view.getUint16(offset + 2);
    if (segmentLength < 2 || offset + segmentLength + 2 > bytes.length) {
      return null;
    }

    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isStartOfFrame) {
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }

    offset += segmentLength + 2;
  }

  return null;
}

export function validateImage(
  bytes: Uint8Array,
  declaredMimeType: string,
): ValidatedImage {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new UserFacingError("圖片檔案大小不符合限制。");
  }

  let result: ValidatedImage | null = null;
  if (declaredMimeType === "image/png" && isPng(bytes) && bytes.length >= 24) {
    const dimensions = readPngDimensions(bytes);
    result = { ...dimensions, extension: "png", mimeType: "image/png" };
  } else if (declaredMimeType === "image/jpeg") {
    const dimensions = readJpegDimensions(bytes);
    if (dimensions) {
      result = { ...dimensions, extension: "jpg", mimeType: "image/jpeg" };
    }
  }

  if (!result) {
    throw new UserFacingError("只接受檔頭正確的 PNG 或 JPEG 圖片。");
  }

  if (
    result.width <= 0 ||
    result.height <= 0 ||
    result.width > MAX_IMAGE_DIMENSION ||
    result.height > MAX_IMAGE_DIMENSION
  ) {
    throw new UserFacingError("圖片尺寸不符合限制。");
  }

  return result;
}
