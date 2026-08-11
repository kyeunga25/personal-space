import {
  MEDIA_UPLOAD_LIMITS,
  MEDIA_UPLOAD_MIME_TYPES,
  type MediaUploadMimeType,
} from "../../config/media";
import { UserFacingError } from "../errors";

export const MAX_IMAGE_BYTES = MEDIA_UPLOAD_LIMITS.fileBytes;
export const MAX_IMAGE_DIMENSION = MEDIA_UPLOAD_LIMITS.imageDimension;
export const MAX_DECODED_IMAGE_BYTES = 64 * 1024 * 1024;
const PNG_MIME_TYPE = MEDIA_UPLOAD_MIME_TYPES[0];
const JPEG_MIME_TYPE = MEDIA_UPLOAD_MIME_TYPES[1];
const INVALID_IMAGE_ERROR =
  "只接受結構完整的 PNG 或 JPEG 圖片。 Only complete, structurally valid PNG or JPEG images are accepted.";

export interface ValidatedImage {
  extension: "jpg" | "png";
  height: number;
  mimeType: MediaUploadMimeType;
  width: number;
}

function isPng(bytes: Uint8Array): boolean {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  return signature.every((value, index) => bytes[index] === value);
}

const CRC32_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = (CRC32_TABLE[(value ^ byte) & 0xff] ?? 0) ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function invalidImage(): never {
  throw new UserFacingError(INVALID_IMAGE_ERROR);
}

function dimensionError(): never {
  throw new UserFacingError(
    "圖片尺寸或解壓後大小不符合限制。 Image dimensions or decoded size are outside the allowed limit.",
  );
}

function assertDimensions(
  width: number,
  height: number,
  decodedBytes: number,
): void {
  if (
    width <= 0 ||
    height <= 0 ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    decodedBytes > MAX_DECODED_IMAGE_BYTES
  ) {
    dimensionError();
  }
}

function pngChannels(colorType: number): number | null {
  return (
    {
      0: 1,
      2: 3,
      3: 1,
      4: 2,
      6: 4,
    }[colorType] ?? null
  );
}

function isValidPngBitDepth(colorType: number, bitDepth: number): boolean {
  const allowed: Record<number, readonly number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  };
  return allowed[colorType]?.includes(bitDepth) ?? false;
}

async function inflatePngScanlines(
  parts: Uint8Array[],
  expectedBytes: number,
): Promise<Uint8Array> {
  const compressedLength = parts.reduce(
    (total, part) => total + part.byteLength,
    0,
  );
  const compressed = new Uint8Array(compressedLength);
  let compressedOffset = 0;
  for (const part of parts) {
    compressed.set(part, compressedOffset);
    compressedOffset += part.byteLength;
  }

  const output = new Uint8Array(expectedBytes);
  let outputOffset = 0;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  try {
    reader = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream("deflate"))
      .getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (outputOffset + value.byteLength > expectedBytes) invalidImage();
      output.set(value, outputOffset);
      outputOffset += value.byteLength;
    }
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    invalidImage();
  } finally {
    try {
      await reader?.cancel();
    } catch {
      // A validation failure remains authoritative over stream cleanup.
    }
    reader?.releaseLock();
  }
  if (outputOffset !== expectedBytes) invalidImage();
  return output;
}

async function validatePng(bytes: Uint8Array): Promise<ValidatedImage> {
  if (!isPng(bytes) || bytes.byteLength < 45) invalidImage();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const idatParts: Uint8Array[] = [];
  let bitDepth = 0;
  let colorType = -1;
  let height = 0;
  let width = 0;
  let offset = 8;
  let chunkIndex = 0;
  let paletteEntries = 0;
  let sawIdat = false;
  let idatEnded = false;
  let sawIend = false;
  let sawTransparency = false;

  while (offset < bytes.byteLength) {
    if (offset + 12 > bytes.byteLength) invalidImage();
    const length = view.getUint32(offset);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;
    if (dataEnd < dataStart || nextOffset > bytes.byteLength) invalidImage();
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (!/^[A-Za-z]{4}$/u.test(type)) invalidImage();
    const expectedCrc = view.getUint32(dataEnd);
    if (crc32(bytes.subarray(offset + 4, dataEnd)) !== expectedCrc) {
      invalidImage();
    }

    if (chunkIndex === 0 && type !== "IHDR") invalidImage();
    if (sawIdat && type !== "IDAT") idatEnded = true;
    if (type === "IHDR") {
      if (chunkIndex !== 0 || length !== 13) invalidImage();
      width = view.getUint32(dataStart);
      height = view.getUint32(dataStart + 4);
      bitDepth = bytes[dataStart + 8] ?? invalidImage();
      colorType = bytes[dataStart + 9] ?? invalidImage();
      const compression = bytes[dataStart + 10];
      const filter = bytes[dataStart + 11];
      const interlace = bytes[dataStart + 12];
      if (
        !isValidPngBitDepth(colorType, bitDepth) ||
        compression !== 0 ||
        filter !== 0 ||
        interlace !== 0
      ) {
        invalidImage();
      }
    } else if (type === "PLTE") {
      if (
        sawIdat ||
        sawTransparency ||
        paletteEntries > 0 ||
        colorType === 0 ||
        colorType === 4 ||
        length === 0 ||
        length % 3 !== 0 ||
        length > 768 ||
        (colorType === 3 && length / 3 > 2 ** bitDepth)
      ) {
        invalidImage();
      }
      paletteEntries = length / 3;
    } else if (type === "tRNS") {
      if (sawIdat || sawTransparency) invalidImage();
      if (
        (colorType === 0 && length !== 2) ||
        (colorType === 2 && length !== 6) ||
        (colorType === 3 &&
          (paletteEntries === 0 || length === 0 || length > paletteEntries)) ||
        colorType === 4 ||
        colorType === 6
      ) {
        invalidImage();
      }
      if (
        (colorType === 0 && view.getUint16(dataStart) > 2 ** bitDepth - 1) ||
        (colorType === 2 &&
          bitDepth === 8 &&
          (view.getUint16(dataStart) > 0xff ||
            view.getUint16(dataStart + 2) > 0xff ||
            view.getUint16(dataStart + 4) > 0xff))
      ) {
        invalidImage();
      }
      sawTransparency = true;
    } else if (type === "IDAT") {
      if (idatEnded || length === 0 || (colorType === 3 && !paletteEntries)) {
        invalidImage();
      }
      sawIdat = true;
      idatParts.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      if (!sawIdat || length !== 0 || nextOffset !== bytes.length) {
        invalidImage();
      }
      sawIend = true;
    } else if (/^[A-Z]/u.test(type)) {
      invalidImage();
    }

    offset = nextOffset;
    chunkIndex += 1;
    if (sawIend) break;
  }

  if (!sawIend || offset !== bytes.byteLength) invalidImage();
  const channels = pngChannels(colorType);
  if (!channels) invalidImage();
  const rowBytes = Math.ceil((width * bitDepth * channels) / 8);
  const decodedBytes = (rowBytes + 1) * height;
  assertDimensions(width, height, decodedBytes);
  const scanlines = await inflatePngScanlines(idatParts, decodedBytes);
  for (let row = 0; row < height; row += 1) {
    const rowFilter = scanlines[row * (rowBytes + 1)];
    if (rowFilter === undefined || rowFilter > 4) invalidImage();
  }
  return {
    extension: "png",
    height,
    mimeType: PNG_MIME_TYPE,
    width,
  };
}

function validateJpeg(bytes: Uint8Array): ValidatedImage {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) invalidImage();
  let offset = 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let components = 0;
  let height = 0;
  let sawFrame = false;
  let sawScan = false;
  let width = 0;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) invalidImage();
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === undefined || marker === 0x00 || marker === 0xd8) {
      invalidImage();
    }
    offset += 1;
    if (marker === 0xd9) {
      if (!sawFrame || !sawScan || offset !== bytes.length) invalidImage();
      assertDimensions(width, height, width * height * components);
      return {
        extension: "jpg",
        height,
        mimeType: JPEG_MIME_TYPE,
        width,
      };
    }
    if (marker === 0x01) continue;
    if (marker >= 0xd0 && marker <= 0xd7) invalidImage();
    if (offset + 2 > bytes.length) invalidImage();
    const segmentLength = view.getUint16(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      invalidImage();
    }
    const dataStart = offset + 2;
    const segmentEnd = offset + segmentLength;
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame) {
      if (sawFrame || segmentLength < 11) invalidImage();
      const precision = bytes[dataStart];
      height = view.getUint16(dataStart + 1);
      width = view.getUint16(dataStart + 3);
      components = bytes[dataStart + 5] ?? invalidImage();
      if (
        precision !== 8 ||
        components < 1 ||
        components > 4 ||
        segmentLength !== 8 + 3 * components
      ) {
        invalidImage();
      }
      assertDimensions(width, height, width * height * components);
      sawFrame = true;
    }
    offset = segmentEnd;
    if (marker !== 0xda) continue;
    if (!sawFrame || segmentLength < 8) invalidImage();
    const scanComponents = bytes[dataStart] ?? invalidImage();
    if (
      scanComponents < 1 ||
      scanComponents > components ||
      segmentLength !== 6 + 2 * scanComponents
    ) {
      invalidImage();
    }
    sawScan = true;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const markerStart = offset;
      while (bytes[offset] === 0xff) offset += 1;
      const entropyMarker = bytes[offset];
      if (entropyMarker === 0x00) {
        offset += 1;
        continue;
      }
      if (
        entropyMarker !== undefined &&
        entropyMarker >= 0xd0 &&
        entropyMarker <= 0xd7
      ) {
        offset += 1;
        continue;
      }
      offset = markerStart;
      break;
    }
  }
  invalidImage();
}

export async function validateImage(
  bytes: Uint8Array,
  declaredMimeType: string,
): Promise<ValidatedImage> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new UserFacingError(
      "圖片檔案大小不符合限制。 Image size is outside the allowed limit.",
    );
  }

  if (declaredMimeType === PNG_MIME_TYPE) return validatePng(bytes);
  if (declaredMimeType === JPEG_MIME_TYPE) return validateJpeg(bytes);
  invalidImage();
}
