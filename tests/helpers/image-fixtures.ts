import { deflateSync } from "node:zlib";

const CRC32_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});
const channelsByType: Record<number, number | undefined> = {
  0: 1,
  2: 3,
  3: 1,
  4: 2,
  6: 4,
};

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = (CRC32_TABLE[(value ^ byte) & 0xff] ?? 0) ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.byteLength);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.byteLength);
  for (let index = 0; index < 4; index += 1) {
    chunk[4 + index] = type.charCodeAt(index);
  }
  chunk.set(data, 8);
  view.setUint32(
    8 + data.byteLength,
    crc32(chunk.subarray(4, 8 + data.byteLength)),
  );
  return chunk;
}

function joinBytes(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const joined = new Uint8Array(
    parts.reduce((total, part) => total + part.byteLength, 0),
  );
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.byteLength;
  }
  return joined;
}

export function pngFixture(
  width = 1200,
  height = 630,
  options: {
    bitDepth?: number;
    colorType?: number;
    omitScanlines?: boolean;
    preIdatChunks?: { data: Uint8Array; type: string }[];
  } = {},
): Uint8Array<ArrayBuffer> {
  const bitDepth = options.bitDepth ?? 1;
  const colorType = options.colorType ?? 0;
  const channels = channelsByType[colorType];
  if (channels === undefined) {
    throw new Error("Unsupported synthetic PNG color type.");
  }
  const ihdr = new Uint8Array(13);
  const header = new DataView(ihdr.buffer);
  header.setUint32(0, width);
  header.setUint32(4, height);
  ihdr[8] = bitDepth;
  ihdr[9] = colorType;
  const rowBytes = Math.ceil((width * bitDepth * channels) / 8);
  const scanlines = options.omitScanlines
    ? new Uint8Array()
    : new Uint8Array((rowBytes + 1) * height);
  const compressed = deflateSync(scanlines);

  return joinBytes([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    ...(options.preIdatChunks ?? []).map(({ data, type }) =>
      pngChunk(type, data),
    ),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]);
}

export function jpegFixture(): Uint8Array<ArrayBuffer> {
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x03,
    0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00, 0xff, 0xda, 0x00,
    0x0c, 0x03, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x00, 0x3f, 0x00, 0x00,
    0xff, 0xd9,
  ]);
}
