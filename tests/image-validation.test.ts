import { describe, expect, it } from "vitest";

import { validateImage } from "../src/server/media/image-validation";
import { jpegFixture, pngFixture } from "./helpers/image-fixtures";

describe("owner media validation", () => {
  it("accepts a complete PNG whose structure and dimensions are valid", async () => {
    await expect(
      validateImage(pngFixture(1200, 630), "image/png"),
    ).resolves.toEqual({
      extension: "png",
      height: 630,
      mimeType: "image/png",
      width: 1200,
    });
  });

  it("accepts a structurally complete JPEG", async () => {
    await expect(validateImage(jpegFixture(), "image/jpeg")).resolves.toEqual({
      extension: "jpg",
      height: 1,
      mimeType: "image/jpeg",
      width: 1,
    });
  });

  it("rejects MIME spoofing and oversized dimensions", async () => {
    await expect(
      validateImage(pngFixture(1200, 630), "image/jpeg"),
    ).rejects.toThrow("Only complete, structurally valid PNG or JPEG images");
    await expect(
      validateImage(pngFixture(7000, 630), "image/png"),
    ).rejects.toThrow("Image dimensions or decoded size are outside");
  });

  it("rejects corrupt, truncated and high-expansion PNG files", async () => {
    const corrupt = pngFixture();
    corrupt[corrupt.length - 1] = (corrupt.at(-1) ?? 0) ^ 1;
    await expect(validateImage(corrupt, "image/png")).rejects.toThrow(
      "Only complete, structurally valid PNG or JPEG images",
    );

    const truncated = pngFixture().slice(0, -12);
    await expect(validateImage(truncated, "image/png")).rejects.toThrow(
      "Only complete, structurally valid PNG or JPEG images",
    );

    const highExpansion = pngFixture(5_000, 5_000, {
      bitDepth: 8,
      colorType: 6,
      omitScanlines: true,
    });
    await expect(validateImage(highExpansion, "image/png")).rejects.toThrow(
      "Image dimensions or decoded size are outside",
    );
  });

  it("enforces PNG palette and transparency ordering and sample bounds", async () => {
    const invalidPaletteSize = pngFixture(1, 1, {
      bitDepth: 1,
      colorType: 3,
      preIdatChunks: [
        {
          data: new Uint8Array([0, 0, 0, 255, 255, 255, 127, 127, 127]),
          type: "PLTE",
        },
      ],
    });
    await expect(
      validateImage(invalidPaletteSize, "image/png"),
    ).rejects.toThrow("Only complete, structurally valid PNG or JPEG images");

    const paletteAfterTransparency = pngFixture(1, 1, {
      bitDepth: 8,
      colorType: 2,
      preIdatChunks: [
        { data: new Uint8Array(6), type: "tRNS" },
        { data: new Uint8Array([0, 0, 0]), type: "PLTE" },
      ],
    });
    await expect(
      validateImage(paletteAfterTransparency, "image/png"),
    ).rejects.toThrow("Only complete, structurally valid PNG or JPEG images");

    const outOfRangeTransparency = pngFixture(1, 1, {
      bitDepth: 1,
      colorType: 0,
      preIdatChunks: [{ data: new Uint8Array([0, 2]), type: "tRNS" }],
    });
    await expect(
      validateImage(outOfRangeTransparency, "image/png"),
    ).rejects.toThrow("Only complete, structurally valid PNG or JPEG images");

    const validIndexedTransparency = pngFixture(1, 1, {
      bitDepth: 1,
      colorType: 3,
      preIdatChunks: [
        {
          data: new Uint8Array([0, 0, 0, 255, 255, 255]),
          type: "PLTE",
        },
        { data: new Uint8Array([0, 255]), type: "tRNS" },
      ],
    });
    await expect(
      validateImage(validIndexedTransparency, "image/png"),
    ).resolves.toMatchObject({ height: 1, width: 1 });
  });

  it("rejects JPEG files without a final EOI marker or with trailing bytes", async () => {
    await expect(
      validateImage(jpegFixture().slice(0, -2), "image/jpeg"),
    ).rejects.toThrow("Only complete, structurally valid PNG or JPEG images");
    const trailing = new Uint8Array([...jpegFixture(), 0]);
    await expect(validateImage(trailing, "image/jpeg")).rejects.toThrow(
      "Only complete, structurally valid PNG or JPEG images",
    );
  });
});
