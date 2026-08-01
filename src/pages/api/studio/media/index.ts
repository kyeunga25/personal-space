import type { APIRoute } from "astro";

import { errorResponse, jsonResponse } from "../../../../server/http/json";
import {
  MAX_IMAGE_BYTES,
  validateImage,
} from "../../../../server/media/image-validation";
import { getBindings } from "../../../../server/platform/bindings";
import type { MediaRecord } from "../../../../server/publishing/domain";
import { D1PublishingRepository } from "../../../../server/publishing/repository";

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const altText = form.get("altText");
    const visibility = form.get("visibility");

    if (
      !(file instanceof File) ||
      typeof altText !== "string" ||
      altText.trim().length === 0 ||
      altText.trim().length > 240 ||
      (visibility !== "public" && visibility !== "private")
    ) {
      return jsonResponse(
        { error: "請選擇圖片、填寫替代文字並設定可見度。" },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return jsonResponse(
        { error: "圖片檔案大小不符合限制。" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const validated = validateImage(bytes, file.type);
    const id = crypto.randomUUID();
    const objectKey = `${visibility}/${id}.${validated.extension}`;
    const now = new Date().toISOString();
    const media: MediaRecord = {
      altText: altText.trim(),
      byteSize: bytes.byteLength,
      createdAt: now,
      height: validated.height,
      id,
      mimeType: validated.mimeType,
      objectKey,
      updatedAt: now,
      visibility,
      width: validated.width,
    };
    const bindings = getBindings();

    await bindings.MEDIA.put(objectKey, arrayBuffer, {
      httpMetadata: {
        cacheControl:
          visibility === "public"
            ? "public, max-age=300, stale-while-revalidate=60"
            : "private, no-store",
        contentType: validated.mimeType,
      },
      customMetadata: {
        mediaId: id,
        visibility,
      },
    });

    try {
      await new D1PublishingRepository(bindings.DB).createMedia(media);
    } catch (error) {
      await bindings.MEDIA.delete(objectKey);
      throw error;
    }

    return jsonResponse(
      {
        media: {
          ...media,
          url:
            visibility === "public"
              ? `/media/${id}`
              : `/api/studio/media/${id}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
};
