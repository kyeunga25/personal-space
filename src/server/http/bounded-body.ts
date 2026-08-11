import { UserFacingError } from "../errors";

function validDeclaredLength(value: string | null): number | null {
  if (value === null || !/^\d+$/u.test(value)) {
    return null;
  }

  const length = Number(value);
  return Number.isSafeInteger(length) ? length : null;
}

export async function readBoundedBody(
  request: Request,
  maxBytes: number,
): Promise<ArrayBuffer> {
  const declaredLength = validDeclaredLength(
    request.headers.get("content-length"),
  );
  if (declaredLength !== null && declaredLength > maxBytes) {
    throw new UserFacingError(
      "要求內容超出大小限制。 Request body exceeds the size limit.",
      413,
    );
  }

  if (!request.body) {
    return new ArrayBuffer(0);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel("payload_too_large");
        } catch {
          // The bounded rejection remains the public failure mode.
        }
        throw new UserFacingError(
          "要求內容超出大小限制。 Request body exceeds the size limit.",
          413,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

export async function rebuildRequestWithBoundedBody(
  request: Request,
  maxBytes: number,
): Promise<Request> {
  const body = await readBoundedBody(request, maxBytes);
  const headers = new Headers(request.headers);
  headers.delete("content-length");

  return new Request(request.url, {
    body,
    headers,
    method: request.method,
  });
}
