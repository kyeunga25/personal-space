import { describe, expect, it } from "vitest";

import { validateImage } from "../src/server/media/image-validation";

function pngFixture(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe("owner media validation", () => {
  it("accepts a PNG whose signature and dimensions are valid", () => {
    expect(validateImage(pngFixture(1200, 630), "image/png")).toEqual({
      extension: "png",
      height: 630,
      mimeType: "image/png",
      width: 1200,
    });
  });

  it("rejects MIME spoofing and oversized dimensions", () => {
    expect(() => validateImage(pngFixture(1200, 630), "image/jpeg")).toThrow(
      "檔頭正確",
    );
    expect(() => validateImage(pngFixture(7000, 630), "image/png")).toThrow(
      "尺寸",
    );
  });
});
