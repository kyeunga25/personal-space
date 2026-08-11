import { MEDIA_UPLOAD_LIMITS } from "../../config/media";
import type { MediaRecord } from "../publishing/domain";
import { errorResponse, jsonResponse } from "../http/json";
import { rebuildRequestWithBoundedBody } from "../http/bounded-body";
import { MAX_IMAGE_BYTES, validateImage } from "./image-validation";

export const MAX_MEDIA_MULTIPART_OVERHEAD_BYTES = 64 * 1024;
export const MAX_MEDIA_UPLOAD_BODY_BYTES =
  MAX_IMAGE_BYTES + MAX_MEDIA_MULTIPART_OVERHEAD_BYTES;

interface MediaObjectWrite {
  body: ArrayBuffer;
  customMetadata: Record<string, string>;
  httpMetadata: {
    cacheControl: string;
    contentType: string;
  };
  key: string;
}

export interface MediaUploadDependencies {
  createMedia(media: MediaRecord): Promise<void>;
  deleteMediaObject(key: string): Promise<void>;
  putMediaObject(input: MediaObjectWrite): Promise<void>;
}

export async function mediaUploadResponse(
  request: Request,
  dependencies: MediaUploadDependencies,
): Promise<Response> {
  try {
    const boundedRequest = await rebuildRequestWithBoundedBody(
      request,
      MAX_MEDIA_UPLOAD_BODY_BYTES,
    );
    const form = await boundedRequest.formData();
    const file = form.get("file");
    const altText = form.get("altText");
    const visibility = form.get("visibility");

    if (
      !(file instanceof File) ||
      typeof altText !== "string" ||
      altText.trim().length === 0 ||
      altText.trim().length > MEDIA_UPLOAD_LIMITS.altText ||
      (visibility !== "public" && visibility !== "private")
    ) {
      return jsonResponse(
        {
          error:
            "請選擇圖片、填寫替代文字並設定可見度。 Choose an image, enter alt text, and set visibility.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return jsonResponse(
        {
          error:
            "圖片檔案大小不符合限制。 Image size is outside the allowed limit.",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const validated = await validateImage(bytes, file.type);
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

    await dependencies.putMediaObject({
      body: arrayBuffer,
      customMetadata: {
        mediaId: id,
        visibility,
      },
      httpMetadata: {
        cacheControl:
          visibility === "public"
            ? "public, max-age=300, stale-while-revalidate=60"
            : "private, no-store",
        contentType: validated.mimeType,
      },
      key: objectKey,
    });

    try {
      await dependencies.createMedia(media);
    } catch (error) {
      try {
        await dependencies.deleteMediaObject(objectKey);
      } catch (cleanupError) {
        console.error(
          JSON.stringify({
            errorType:
              cleanupError instanceof Error
                ? cleanupError.name
                : typeof cleanupError,
            message: "Media object cleanup failed",
          }),
        );
      }
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
}
